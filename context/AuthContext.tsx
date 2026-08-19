'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  AuthCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  GithubAuthProvider,
  User,
  createUserWithEmailAndPassword,
  getRedirectResult,
  linkWithCredential,
  linkWithPopup,
  linkWithRedirect,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  unlink,
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
type ProviderId = 'google.com' | 'github.com' | 'password'
type AuthNoticeTone = 'success' | 'warning' | 'error'

type AuthNotice = {
  id: number
  message: string
  tone: AuthNoticeTone
}

type AuthContextValue = {
  user: User | null
  loading: boolean
  pendingProviderLink: 'github' | null
  signInWithGoogle: () => Promise<boolean>
  signInWithGithub: () => Promise<boolean>
  linkPendingGithubWithGoogle: () => Promise<boolean>
  clearPendingProviderLink: () => void
  connectedProviders: ProviderId[]
  authNotice: AuthNotice | null
  clearAuthNotice: () => void
  linkGoogleAccount: () => Promise<void>
  linkGithubAccount: () => Promise<void>
  linkPasswordAccount: (password: string) => Promise<void>
  unlinkProvider: (providerId: ProviderId) => Promise<void>
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
function providerIdToLoginProvider(
  providerId: string,
): LoginProvider | undefined {
  if (providerId === 'google.com') return 'google'
  if (providerId === 'github.com') return 'github'
  if (providerId === 'password') return 'password'
  return undefined
}

function loginProviderToProviderId(
  provider: LoginProvider,
): ProviderId {
  if (provider === 'google') return 'google.com'
  if (provider === 'github') return 'github.com'
  return 'password'
}

/*
 * Firebase Authentication is the source of truth for linked providers.
 *
 * Firestore only mirrors that information so the rest of the app can
 * display it. This prevents stale values such as:
 *
 * provider: "google"
 * providers: ["google.com"]
 *
 * when Firebase Authentication actually only has "password".
 */
async function saveUserProfile(
  user: User,
  loginProvider?: LoginProvider,
) {
  const providers = Array.from(
    new Set(
      user.providerData
        .map((provider) => provider.providerId)
        .filter(
          (providerId): providerId is ProviderId =>
            providerId === 'google.com' ||
            providerId === 'github.com' ||
            providerId === 'password',
        ),
    ),
  )

  let resolvedLoginProvider = loginProvider

  /*
   * If the caller did not explicitly tell us which provider was used,
   * try the current browser session — but only if that provider is
   * actually still linked to this Firebase user.
   */
  if (
    !resolvedLoginProvider &&
    typeof window !== 'undefined'
  ) {
    const sessionProvider =
      window.sessionStorage.getItem(
        'verde-login-provider',
      ) as LoginProvider | null

    if (
      sessionProvider &&
      providers.includes(
        loginProviderToProviderId(
          sessionProvider,
        ),
      )
    ) {
      resolvedLoginProvider =
        sessionProvider
    }
  }

  /*
   * If there is only one real Firebase provider, there is no ambiguity.
   * This also automatically repairs stale Firestore provider metadata.
   */
  if (
    !resolvedLoginProvider &&
    providers.length === 1
  ) {
    resolvedLoginProvider =
      providerIdToLoginProvider(
        providers[0],
      )
  }

  const profileData: Record<
    string,
    unknown
  > = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,

    /*
     * Always mirror the real Firebase Authentication providers.
     */
    providers,

    updatedAt: serverTimestamp(),
  }

  if (resolvedLoginProvider) {
    /*
     * Keep `provider` for compatibility with the existing UI,
     * while also storing the clearer field going forward.
     */
    profileData.provider =
      resolvedLoginProvider

    profileData.lastLoginProvider =
      resolvedLoginProvider

    profileData.lastLoginAt =
      serverTimestamp()
  }

  await setDoc(
    doc(
      firestore,
      'users',
      user.uid,
    ),
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

  const getConnectedProviders = (authUser: User | null): ProviderId[] =>
    authUser
      ? Array.from(
          new Set(
            authUser.providerData
              .map((provider) => provider.providerId)
              .filter(
                (providerId): providerId is ProviderId =>
                  providerId === 'google.com' ||
                  providerId === 'github.com' ||
                  providerId === 'password',
              ),
          ),
        )
      : []

  const [connectedProviders, setConnectedProviders] = useState<ProviderId[]>([])
  const [authNotice, setAuthNotice] = useState<AuthNotice | null>(null)

  const clearAuthNotice = useCallback(() => {
    setAuthNotice(null)
  }, [])

  const showAuthNotice = useCallback(
    (message: string, tone: AuthNoticeTone = 'error') => {
      setAuthNotice({
        id: Date.now(),
        message,
        tone,
      })
    },
    [],
  )

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

        const pendingLinkProvider =
          window.sessionStorage.getItem('verde-link-provider') as
            | 'google'
            | 'github'
            | null

        /*
         * A redirect result can come from either:
         * - signInWithRedirect()
         * - linkWithRedirect()
         *
         * Linking a provider must NOT replace the provider that originally
         * authenticated the current browser session.
         */
        if (result.operationType === 'link') {
          setUser(result.user)
          setConnectedProviders(getConnectedProviders(result.user))

          if (pendingLinkProvider) {
            const providerLabel =
              pendingLinkProvider === 'google' ? 'Google' : 'GitHub'

            showAuthNotice(
              `${providerLabel} account connected successfully.`,
              'success',
            )
          }

          window.sessionStorage.removeItem('verde-link-provider')

          await saveUserProfile(result.user)
          return
        }

        let loginProvider: LoginProvider | undefined

        if (result.providerId === 'google.com') {
          loginProvider = 'google'
        }

        if (result.providerId === 'github.com') {
          loginProvider = 'github'
        }

        if (loginProvider) {
          window.sessionStorage.setItem(
            'verde-login-provider',
            loginProvider,
          )
        }

        await saveUserProfile(
          result.user,
          loginProvider,
        )
      })
      .catch((error: any) => {
        const pendingLinkProvider =
          window.sessionStorage.getItem('verde-link-provider') as
            | 'google'
            | 'github'
            | null

        if (pendingLinkProvider) {
          const providerLabel =
            pendingLinkProvider === 'google' ? 'Google' : 'GitHub'

          if (
            error?.code === 'auth/credential-already-in-use' ||
            error?.code === 'auth/account-exists-with-different-credential' ||
            error?.code === 'auth/email-already-in-use'
          ) {
            showAuthNotice(
              `Unable to connect ${providerLabel}. That ${providerLabel} account is already linked to another Verde account.`,
              'error',
            )
          } else if (error?.code !== 'auth/popup-closed-by-user') {
            showAuthNotice(
              `Unable to connect ${providerLabel} account. Please try again.`,
              'error',
            )
          }
        }

        window.sessionStorage.removeItem('verde-link-provider')

        console.error(
          'OAuth redirect operation failed:',
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
        setConnectedProviders(getConnectedProviders(nextUser))
        setLoading(false)

        if (nextUser) {
          /*
           * Keep Firestore synchronized with Firebase Authentication.
           *
           * saveUserProfile() will preserve the real current login provider
           * when known, but it will also repair stale provider metadata when
           * Firebase Auth only has one linked method.
           */
          saveUserProfile(
            nextUser,
          ).catch(console.error)
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
   * Link Google to the currently signed-in Firebase account.
   */
  const linkGoogleAccount = async () => {
    const currentUser = firebaseAuth.currentUser

    if (!currentUser) {
      throw new Error('You must be signed in before linking Google.')
    }

    if (
      currentUser.providerData.some(
        (provider) => provider.providerId === 'google.com',
      )
    ) {
      throw new Error('Google is already connected to this account.')
    }

    const provider = new GoogleAuthProvider()

    provider.setCustomParameters({
      prompt: 'select_account',
    })

    try {
      const result = await linkWithPopup(
        currentUser,
        provider,
      )

      setUser(result.user)
      setConnectedProviders(getConnectedProviders(result.user))

      // Linking Google does not mean the current session was authenticated
      // with Google. Preserve the provider that actually signed the user in.
      await saveUserProfile(result.user)
    } catch (error: any) {
      if (error?.code === 'auth/popup-blocked') {
        window.sessionStorage.setItem(
          'verde-link-provider',
          'google',
        )

        await linkWithRedirect(
          currentUser,
          provider,
        )
        return
      }

      throw error
    }
  }

  /*
   * Link GitHub to the currently signed-in Firebase account.
   */
  const linkGithubAccount = async () => {
    const currentUser = firebaseAuth.currentUser

    if (!currentUser) {
      throw new Error('You must be signed in before linking GitHub.')
    }

    if (
      currentUser.providerData.some(
        (provider) => provider.providerId === 'github.com',
      )
    ) {
      throw new Error('GitHub is already connected to this account.')
    }

    const provider = new GithubAuthProvider()

    provider.addScope('user:email')

    provider.setCustomParameters({
      prompt: 'select_account',
    })

    try {
      const result = await linkWithPopup(
        currentUser,
        provider,
      )

      setUser(result.user)
      setConnectedProviders(getConnectedProviders(result.user))

      // Linking GitHub does not change the provider used for this session.
      await saveUserProfile(result.user)
    } catch (error: any) {
      if (error?.code === 'auth/popup-blocked') {
        window.sessionStorage.setItem(
          'verde-link-provider',
          'github',
        )

        await linkWithRedirect(
          currentUser,
          provider,
        )
        return
      }

      throw error
    }
  }

  /*
   * Link Email & Password to the currently signed-in Firebase account.
   */
  const linkPasswordAccount = async (password: string) => {
    const currentUser = firebaseAuth.currentUser

    if (!currentUser) {
      throw new Error('You must be signed in before adding a password.')
    }

    if (!currentUser.email) {
      throw new Error('This account does not have an email address to use for password sign-in.')
    }

    if (
      currentUser.providerData.some(
        (provider) => provider.providerId === 'password',
      )
    ) {
      throw new Error('Email & Password is already connected to this account.')
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.')
    }

    const credential = EmailAuthProvider.credential(
      currentUser.email,
      password,
    )

    const result = await linkWithCredential(
      currentUser,
      credential,
    )

    setUser(result.user)
    setConnectedProviders(getConnectedProviders(result.user))

    // Adding a password is an account-linking action. It must not overwrite
    // the provider that was actually used to authenticate this session.
    await saveUserProfile(result.user)
  }

  /*
   * Unlink one sign-in provider from the current Firebase account.
   *
   * Safety rule:
   * Never allow removal of the last remaining sign-in method.
   */
  const unlinkProvider = async (
    providerId: ProviderId,
  ) => {
    const currentUser = firebaseAuth.currentUser

    if (!currentUser) {
      throw new Error('You must be signed in before unlinking an account.')
    }

    const providerIds = Array.from(
      new Set(
        currentUser.providerData
          .map((provider) => provider.providerId)
          .filter(
            (id): id is ProviderId =>
              id === 'google.com' ||
              id === 'github.com' ||
              id === 'password',
          ),
      ),
    )

    if (!providerIds.includes(providerId)) {
      throw new Error('That sign-in method is not connected to this account.')
    }

    if (providerIds.length <= 1) {
      throw new Error(
        'You cannot unlink your only sign-in method. Connect another account first.',
      )
    }

    const updatedUser = await unlink(
      currentUser,
      providerId,
    )

    setUser(updatedUser)

    /*
     * Update the UI immediately after Firebase confirms the unlink.
     * Do not wait for a page refresh or for providerData to be observed again.
     */
    const remainingProviders = getConnectedProviders(updatedUser)

    setConnectedProviders(remainingProviders)

    /*
     * If the provider used for the current session was just removed,
     * stop showing it as the active provider on profile/settings pages.
     */
    const activeSessionProvider =
      window.sessionStorage.getItem(
        'verde-login-provider',
      )

    const removedProviderName =
      providerId === 'google.com'
        ? 'google'
        : providerId === 'github.com'
          ? 'github'
          : 'password'

    let nextLoginProvider:
      | LoginProvider
      | undefined

    if (
      activeSessionProvider ===
      removedProviderName
    ) {
      window.sessionStorage.removeItem(
        'verde-login-provider',
      )

      /*
       * If only one provider remains, use it as the active provider
       * so Firestore never keeps the disconnected provider.
       */
      if (
        remainingProviders.length === 1
      ) {
        nextLoginProvider =
          providerIdToLoginProvider(
            remainingProviders[0],
          )

        if (nextLoginProvider) {
          window.sessionStorage.setItem(
            'verde-login-provider',
            nextLoginProvider,
          )
        }
      }
    } else if (
      activeSessionProvider === 'google' ||
      activeSessionProvider === 'github' ||
      activeSessionProvider === 'password'
    ) {
      nextLoginProvider =
        activeSessionProvider
    }

    await saveUserProfile(
      updatedUser,
      nextLoginProvider,
    )
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

    /*
     * Normalize provider metadata using the same Firebase Auth mirror.
     */
    await saveUserProfile(
      result.user,
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
    setConnectedProviders([])

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
        connectedProviders,
        authNotice,
        clearAuthNotice,
        linkGoogleAccount,
        linkGithubAccount,
        linkPasswordAccount,
        unlinkProvider,
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