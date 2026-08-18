'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import {
  AuthCredential,
  GoogleAuthProvider,
  GithubAuthProvider,
  User,
  createUserWithEmailAndPassword,
  getRedirectResult,
  linkWithCredential,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
} from 'firebase/auth'
import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { firebaseAuth, firestore } from '@/lib/firebase'

type LoginProvider = 'google' | 'github' | 'password'

type AuthContextValue = {
  user: User | null
  loading: boolean
  pendingProviderLink: 'github' | null
  signInWithGoogle: () => Promise<boolean>
  signInWithGithub: () => Promise<boolean>
  linkPendingGithubWithGoogle: () => Promise<boolean>
  clearPendingProviderLink: () => void
  signInWithEmail: (
    email: string,
    password: string,
  ) => Promise<void>
  signUpWithEmail: (details: {
    name: string
    email: string
    phone: string
    password: string
  }) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
)

/*
 * Save/update the user's Firestore profile.
 *
 * loginProvider represents the provider actually used
 * for THIS login session.
 *
 * Example:
 * user.providerData = ['google.com', 'github.com']
 *
 * But:
 * loginProvider = 'github'
 *
 * So the profile can correctly display:
 * "Signed in with GitHub"
 */
async function saveUserProfile(
  user: User,
  loginProvider?: LoginProvider,
) {
  const providers = user.providerData.map(
    (provider) => provider.providerId,
  )

  const profileData: Record<string, unknown> = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    providers,
    lastLoginAt: serverTimestamp(),
  }

  /*
   * Only overwrite provider when we actually know
   * which provider was used for this login.
   *
   * This prevents onAuthStateChanged from changing
   * GitHub back to Google simply because both are linked.
   */
  if (loginProvider) {
    profileData.provider = loginProvider
  }

  await setDoc(
    doc(firestore, 'users', user.uid),
    profileData,
    { merge: true },
  )
}

export function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const [pendingGithubCredential, setPendingGithubCredential] =
    useState<AuthCredential | null>(null)

  const [pendingProviderLink, setPendingProviderLink] =
    useState<'github' | null>(null)

  useEffect(() => {
    /*
     * Handle OAuth redirect results.
     *
     * We try to identify which provider produced
     * the redirect result.
     */
    getRedirectResult(firebaseAuth)
      .then(async (result) => {
        if (!result?.user) {
          return
        }

        let loginProvider: LoginProvider | undefined

        if (result.providerId === 'google.com') {
          loginProvider = 'google'
        }

        if (result.providerId === 'github.com') {
          loginProvider = 'github'
        }

        await saveUserProfile(
          result.user,
          loginProvider,
        )
      })
      .catch((error) => {
        console.error(
          'OAuth redirect sign-in failed:',
          error,
        )
      })

    /*
     * Listen for Firebase authentication state.
     *
     * IMPORTANT:
     *
     * Do NOT determine the provider here.
     *
     * providerData represents ALL linked providers,
     * not necessarily the provider that was used
     * for the current login.
     */
    return onAuthStateChanged(
      firebaseAuth,
      (nextUser) => {
        setUser(nextUser)
        setLoading(false)

        if (nextUser) {
          /*
           * Update generic account information,
           * but do NOT overwrite the login provider.
           */
          saveUserProfile(nextUser).catch(
            console.error,
          )
        }
      },
    )
  }, [])

  /*
   * Google Login
   */
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider()

    provider.setCustomParameters({
      prompt: 'select_account',
    })

    try {
      const result = await signInWithPopup(
        firebaseAuth,
        provider,
      )

      /*
       * The user specifically authenticated
       * through Google.
       */
      await saveUserProfile(
        result.user,
        'google',
      )

      /*
       * Optional local session information.
       * Useful if the profile page wants immediate
       * access without waiting for Firestore.
       */
      window.sessionStorage.setItem(
        'verde-login-provider',
        'google',
      )

      return true
    } catch (error: any) {
      if (
        error?.code === 'auth/popup-blocked' ||
        error?.code ===
          'auth/popup-closed-by-user'
      ) {
        /*
         * Save our intended provider before redirect.
         */
        window.sessionStorage.setItem(
          'verde-login-provider',
          'google',
        )

        await signInWithRedirect(
          firebaseAuth,
          provider,
        )

        return false
      }

      throw error
    }
  }

  /*
   * GitHub Login
   */
  const signInWithGithub = async () => {
    const provider = new GithubAuthProvider()

    provider.addScope('user:email')

    provider.setCustomParameters({
      prompt: 'select_account',
    })

    try {
      const result = await signInWithPopup(
        firebaseAuth,
        provider,
      )

      /*
       * The user specifically authenticated
       * through GitHub.
       */
      await saveUserProfile(
        result.user,
        'github',
      )

      window.sessionStorage.setItem(
        'verde-login-provider',
        'github',
      )

      return true
    } catch (error: any) {
      /*
       * GitHub email already exists through
       * another Firebase authentication provider.
       */
      if (
        error?.code ===
        'auth/account-exists-with-different-credential'
      ) {
        const githubCredential =
          GithubAuthProvider.credentialFromError(
            error,
          )

        if (!githubCredential) {
          throw new Error(
            'Unable to retrieve the pending GitHub credential.',
          )
        }

        setPendingGithubCredential(
          githubCredential,
        )

        setPendingProviderLink('github')

        return false
      }

      if (
        error?.code === 'auth/popup-blocked' ||
        error?.code ===
          'auth/popup-closed-by-user'
      ) {
        window.sessionStorage.setItem(
          'verde-login-provider',
          'github',
        )

        await signInWithRedirect(
          firebaseAuth,
          provider,
        )

        return false
      }

      throw error
    }
  }

  /*
   * Link GitHub to an existing Google account.
   *
   * Even though Google is used to verify ownership
   * of the existing Firebase account, the ORIGINAL
   * action the user initiated was GitHub login.
   *
   * Therefore, after linking succeeds, we store
   * the current login provider as GitHub.
   */
  const linkPendingGithubWithGoogle =
    async () => {
      if (!pendingGithubCredential) {
        throw new Error(
          'No GitHub account is waiting to be linked.',
        )
      }

      const googleProvider =
        new GoogleAuthProvider()

      googleProvider.setCustomParameters({
        prompt: 'select_account',
      })

      try {
        const googleResult =
          await signInWithPopup(
            firebaseAuth,
            googleProvider,
          )

        const linkedResult =
          await linkWithCredential(
            googleResult.user,
            pendingGithubCredential,
          )

        /*
         * User originally chose:
         * "Continue with GitHub"
         *
         * Google was only used to confirm ownership.
         */
        await saveUserProfile(
          linkedResult.user,
          'github',
        )

        window.sessionStorage.setItem(
          'verde-login-provider',
          'github',
        )

        setPendingGithubCredential(null)
        setPendingProviderLink(null)

        return true
      } catch (error: any) {
        console.error(
          'Unable to link GitHub account:',
          error,
        )

        throw error
      }
    }

  const clearPendingProviderLink = () => {
    setPendingGithubCredential(null)
    setPendingProviderLink(null)
  }

  /*
   * Email/password Login
   */
  const signInWithEmail = async (
    email: string,
    password: string,
  ) => {
    const result =
      await signInWithEmailAndPassword(
        firebaseAuth,
        email,
        password,
      )

    await saveUserProfile(
      result.user,
      'password',
    )

    window.sessionStorage.setItem(
      'verde-login-provider',
      'password',
    )
  }

  /*
   * Email/password Registration
   */
  const signUpWithEmail = async ({
    name,
    email,
    phone,
    password,
  }: {
    name: string
    email: string
    phone: string
    password: string
  }) => {
    const result =
      await createUserWithEmailAndPassword(
        firebaseAuth,
        email,
        password,
      )

    await updateProfile(result.user, {
      displayName: name,
    })

    await setDoc(
      doc(firestore, 'users', result.user.uid),
      {
        uid: result.user.uid,
        email,
        displayName: name,
        phone,
        photoURL: result.user.photoURL,

        /*
         * Actual provider used for this session.
         */
        provider: 'password',

        /*
         * All providers currently attached.
         */
        providers: ['password'],

        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      },
      { merge: true },
    )

    window.sessionStorage.setItem(
      'verde-login-provider',
      'password',
    )
  }

  /*
   * Password Reset
   */
  const resetPassword = (email: string) =>
    sendPasswordResetEmail(
      firebaseAuth,
      email,
    )

  /*
   * Logout
   */
  const logout = async () => {
    window.localStorage.removeItem(
      'verde-cart',
    )

    window.localStorage.removeItem(
      'verde-wishlist',
    )

    /*
     * Remove provider information for
     * the current browser session.
     */
    window.sessionStorage.removeItem(
      'verde-login-provider',
    )

    const deviceId =
      window.localStorage.getItem(
        'verde-device-id',
      )

    if (
      firebaseAuth.currentUser &&
      deviceId
    ) {
      await deleteDoc(
        doc(
          firestore,
          'users',
          firebaseAuth.currentUser.uid,
          'devices',
          deviceId,
        ),
      ).catch((error) =>
        console.error(
          'Unable to remove signed-out device:',
          error,
        ),
      )
    }

    setPendingGithubCredential(null)
    setPendingProviderLink(null)

    await signOut(firebaseAuth)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        pendingProviderLink,
        signInWithGoogle,
        signInWithGithub,
        linkPendingGithubWithGoogle,
        clearPendingProviderLink,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider',
    )
  }

  return context
}