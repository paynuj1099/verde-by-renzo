'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

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

import {
  firebaseAuth,
  firestore,
} from '@/lib/firebase'

type LoginProvider =
  | 'google'
  | 'github'
  | 'password'

type ProviderId =
  | 'google.com'
  | 'github.com'
  | 'password'

type AuthNoticeTone =
  | 'success'
  | 'warning'
  | 'error'

type AuthNotice = {
  id: number
  message: string
  tone: AuthNoticeTone
}

type AuthContextValue = {
  user: User | null
  loading: boolean

  /*
   * Real Firebase Authentication custom claim:
   *
   * customClaims.admin === true
   */
  isAdmin: boolean

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
  linkPasswordAccount: (
    password: string,
  ) => Promise<void>

  unlinkProvider: (
    providerId: ProviderId,
  ) => Promise<void>

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

  resetPassword: (
    email: string,
  ) => Promise<void>

  logout: () => Promise<void>
}

const AuthContext =
  createContext<
    AuthContextValue | undefined
  >(undefined)

/*
 * Convert Firebase provider IDs to the
 * provider naming used by the application.
 */
function providerIdToLoginProvider(
  providerId: string,
): LoginProvider | undefined {
  if (providerId === 'google.com') {
    return 'google'
  }

  if (providerId === 'github.com') {
    return 'github'
  }

  if (providerId === 'password') {
    return 'password'
  }

  return undefined
}

function loginProviderToProviderId(
  provider: LoginProvider,
): ProviderId {
  if (provider === 'google') {
    return 'google.com'
  }

  if (provider === 'github') {
    return 'github.com'
  }

  return 'password'
}

/*
 * Firebase Authentication is the source of truth
 * for linked authentication providers.
 *
 * Firestore only mirrors that information so the
 * rest of the site can display it.
 *
 * IMPORTANT:
 *
 * This function DOES NOT decide whether the user
 * is an administrator.
 *
 * Administrator authorization comes from:
 *
 * Firebase Auth customClaims.admin === true
 */
async function saveUserProfile(
  user: User,
  loginProvider?: LoginProvider,
) {
  const providers = Array.from(
    new Set(
      user.providerData
        .map(
          (provider) =>
            provider.providerId,
        )
        .filter(
          (
            providerId,
          ): providerId is ProviderId =>
            providerId ===
              'google.com' ||
            providerId ===
              'github.com' ||
            providerId ===
              'password',
        ),
    ),
  )

  let resolvedLoginProvider =
    loginProvider

  /*
   * If the caller did not explicitly provide
   * the provider used for this login, try the
   * current browser session.
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
   * If only one authentication provider exists,
   * there is no ambiguity about the provider.
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
     * Mirror every currently connected Firebase
     * Authentication provider.
     */
    providers,

    updatedAt: serverTimestamp(),
  }

  if (resolvedLoginProvider) {
    /*
     * Keep provider for compatibility with
     * existing parts of the website.
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
    {
      merge: true,
    },
  )
}

export function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [
    user,
    setUser,
  ] = useState<User | null>(null)

  const [
    loading,
    setLoading,
  ] = useState(true)

  /*
   * Firebase Authentication custom claim.
   *
   * This is the client-side representation of:
   *
   * customClaims.admin === true
   */
  const [
    isAdmin,
    setIsAdmin,
  ] = useState(false)

  const [
    pendingGithubCredential,
    setPendingGithubCredential,
  ] =
    useState<AuthCredential | null>(
      null,
    )

  const [
    pendingProviderLink,
    setPendingProviderLink,
  ] =
    useState<'github' | null>(
      null,
    )

  const getConnectedProviders = (
    authUser: User | null,
  ): ProviderId[] =>
    authUser
      ? Array.from(
          new Set(
            authUser.providerData
              .map(
                (provider) =>
                  provider.providerId,
              )
              .filter(
                (
                  providerId,
                ): providerId is ProviderId =>
                  providerId ===
                    'google.com' ||
                  providerId ===
                    'github.com' ||
                  providerId ===
                    'password',
              ),
          ),
        )
      : []

  const [
    connectedProviders,
    setConnectedProviders,
  ] =
    useState<ProviderId[]>([])

  const [
    authNotice,
    setAuthNotice,
  ] =
    useState<AuthNotice | null>(
      null,
    )

  const clearAuthNotice =
    useCallback(() => {
      setAuthNotice(null)
    }, [])

  const showAuthNotice =
    useCallback(
      (
        message: string,
        tone: AuthNoticeTone =
          'error',
      ) => {
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
     */
    getRedirectResult(
      firebaseAuth,
    )
      .then(async (result) => {
        if (!result?.user) {
          return
        }

        const pendingLinkProvider =
          window.sessionStorage.getItem(
            'verde-link-provider',
          ) as
            | 'google'
            | 'github'
            | null

        /*
         * Linking another provider should not
         * replace the provider that originally
         * authenticated the current session.
         */
        if (
          result.operationType ===
          'link'
        ) {
          setUser(result.user)

          setConnectedProviders(
            getConnectedProviders(
              result.user,
            ),
          )

          if (
            pendingLinkProvider
          ) {
            const providerLabel =
              pendingLinkProvider ===
              'google'
                ? 'Google'
                : 'GitHub'

            showAuthNotice(
              `${providerLabel} account connected successfully.`,
              'success',
            )
          }

          window.sessionStorage.removeItem(
            'verde-link-provider',
          )

          await saveUserProfile(
            result.user,
          )

          return
        }

        let loginProvider:
          | LoginProvider
          | undefined

        if (
          result.providerId ===
          'google.com'
        ) {
          loginProvider =
            'google'
        }

        if (
          result.providerId ===
          'github.com'
        ) {
          loginProvider =
            'github'
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
          window.sessionStorage.getItem(
            'verde-link-provider',
          ) as
            | 'google'
            | 'github'
            | null

        if (
          pendingLinkProvider
        ) {
          const providerLabel =
            pendingLinkProvider ===
            'google'
              ? 'Google'
              : 'GitHub'

          if (
            error?.code ===
              'auth/credential-already-in-use' ||
            error?.code ===
              'auth/account-exists-with-different-credential' ||
            error?.code ===
              'auth/email-already-in-use'
          ) {
            showAuthNotice(
              `Unable to connect ${providerLabel}. That ${providerLabel} account is already linked to another Verde account.`,
              'error',
            )
          } else if (
            error?.code !==
            'auth/popup-closed-by-user'
          ) {
            showAuthNotice(
              `Unable to connect ${providerLabel} account. Please try again.`,
              'error',
            )
          }
        }

        window.sessionStorage.removeItem(
          'verde-link-provider',
        )

        console.error(
          'OAuth redirect operation failed:',
          error,
        )
      })

    /*
     * Listen for Firebase authentication state.
     *
     * This is also where we load the user's
     * Firebase custom claims.
     */
    return onAuthStateChanged(
      firebaseAuth,
      async (nextUser) => {
        setUser(nextUser)

        setConnectedProviders(
          getConnectedProviders(
            nextUser,
          ),
        )

        /*
         * Signed out.
         */
        if (!nextUser) {
          setIsAdmin(false)
          setLoading(false)
          return
        }

        try {
          /*
           * Force a fresh Firebase ID token.
           *
           * This is important when an administrator
           * has recently promoted this account because
           * an old token may not contain admin: true.
           */
          const tokenResult =
            await nextUser.getIdTokenResult(
              true,
            )

          const hasAdminClaim =
            tokenResult.claims
              .admin === true

          setIsAdmin(
            hasAdminClaim,
          )

          /*
           * Temporary debugging.
           *
           * You can remove these logs once everything
           * is confirmed working.
           */
          // console.log(
          //   'Firebase custom claims:',
          //   tokenResult.claims,
          // )

          // console.log(
          //   'Firebase admin claim:',
          //   hasAdminClaim,
          // )

          /*
           * Keep the Firestore customer profile
           * synchronized with Firebase Auth profile
           * and provider information.
           */
          await saveUserProfile(
            nextUser,
          )
        } catch (error) {
          console.error(
            'Unable to load Firebase authentication claims:',
            error,
          )

          setIsAdmin(false)
        } finally {
          setLoading(false)
        }
      },
    )
  }, [
    showAuthNotice,
  ])

  /*
   * Google Login
   */
  const signInWithGoogle =
    async () => {
      const provider =
        new GoogleAuthProvider()

      provider.setCustomParameters(
        {
          prompt:
            'select_account',
        },
      )

      try {
        const result =
          await signInWithPopup(
            firebaseAuth,
            provider,
          )

        /*
         * User explicitly authenticated
         * through Google.
         */
        await saveUserProfile(
          result.user,
          'google',
        )

        window.sessionStorage.setItem(
          'verde-login-provider',
          'google',
        )

        return true
      } catch (error: any) {
        if (
          error?.code ===
            'auth/popup-blocked' ||
          error?.code ===
            'auth/popup-closed-by-user'
        ) {
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
  const signInWithGithub =
    async () => {
      const provider =
        new GithubAuthProvider()

      provider.addScope(
        'user:email',
      )

      provider.setCustomParameters(
        {
          prompt:
            'select_account',
        },
      )

      try {
        const result =
          await signInWithPopup(
            firebaseAuth,
            provider,
          )

        /*
         * User explicitly authenticated
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
         * GitHub email already exists using
         * another Firebase provider.
         */
        if (
          error?.code ===
          'auth/account-exists-with-different-credential'
        ) {
          const githubCredential =
            GithubAuthProvider
              .credentialFromError(
                error,
              )

          if (
            !githubCredential
          ) {
            throw new Error(
              'Unable to retrieve the pending GitHub credential.',
            )
          }

          setPendingGithubCredential(
            githubCredential,
          )

          setPendingProviderLink(
            'github',
          )

          return false
        }

        if (
          error?.code ===
            'auth/popup-blocked' ||
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
   * Link pending GitHub credential to an
   * existing Google Firebase account.
   */
  const linkPendingGithubWithGoogle =
    async () => {
      if (
        !pendingGithubCredential
      ) {
        throw new Error(
          'No GitHub account is waiting to be linked.',
        )
      }

      const googleProvider =
        new GoogleAuthProvider()

      googleProvider.setCustomParameters(
        {
          prompt:
            'select_account',
        },
      )

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
         * The original action was GitHub login.
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

        setPendingGithubCredential(
          null,
        )

        setPendingProviderLink(
          null,
        )

        return true
      } catch (error: any) {
        console.error(
          'Unable to link GitHub account:',
          error,
        )

        throw error
      }
    }

  const clearPendingProviderLink =
    () => {
      setPendingGithubCredential(
        null,
      )

      setPendingProviderLink(
        null,
      )
    }

  /*
   * Link Google to currently authenticated
   * Firebase account.
   */
  const linkGoogleAccount =
    async () => {
      const currentUser =
        firebaseAuth.currentUser

      if (!currentUser) {
        throw new Error(
          'You must be signed in before linking Google.',
        )
      }

      if (
        currentUser.providerData.some(
          (provider) =>
            provider.providerId ===
            'google.com',
        )
      ) {
        throw new Error(
          'Google is already connected to this account.',
        )
      }

      const provider =
        new GoogleAuthProvider()

      provider.setCustomParameters(
        {
          prompt:
            'select_account',
        },
      )

      try {
        const result =
          await linkWithPopup(
            currentUser,
            provider,
          )

        setUser(
          result.user,
        )

        setConnectedProviders(
          getConnectedProviders(
            result.user,
          ),
        )

        /*
         * Linking Google does not mean the
         * current session was authenticated
         * using Google.
         */
        await saveUserProfile(
          result.user,
        )
      } catch (error: any) {
        if (
          error?.code ===
          'auth/popup-blocked'
        ) {
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
   * Link GitHub to currently authenticated
   * Firebase account.
   */
  const linkGithubAccount =
    async () => {
      const currentUser =
        firebaseAuth.currentUser

      if (!currentUser) {
        throw new Error(
          'You must be signed in before linking GitHub.',
        )
      }

      if (
        currentUser.providerData.some(
          (provider) =>
            provider.providerId ===
            'github.com',
        )
      ) {
        throw new Error(
          'GitHub is already connected to this account.',
        )
      }

      const provider =
        new GithubAuthProvider()

      provider.addScope(
        'user:email',
      )

      provider.setCustomParameters(
        {
          prompt:
            'select_account',
        },
      )

      try {
        const result =
          await linkWithPopup(
            currentUser,
            provider,
          )

        setUser(
          result.user,
        )

        setConnectedProviders(
          getConnectedProviders(
            result.user,
          ),
        )

        /*
         * Linking GitHub does not change the
         * provider that authenticated this session.
         */
        await saveUserProfile(
          result.user,
        )
      } catch (error: any) {
        if (
          error?.code ===
          'auth/popup-blocked'
        ) {
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
   * Link Email & Password to current account.
   */
  const linkPasswordAccount =
    async (
      password: string,
    ) => {
      const currentUser =
        firebaseAuth.currentUser

      if (!currentUser) {
        throw new Error(
          'You must be signed in before adding a password.',
        )
      }

      if (!currentUser.email) {
        throw new Error(
          'This account does not have an email address to use for password sign-in.',
        )
      }

      if (
        currentUser.providerData.some(
          (provider) =>
            provider.providerId ===
            'password',
        )
      ) {
        throw new Error(
          'Email & Password is already connected to this account.',
        )
      }

      if (
        password.length < 6
      ) {
        throw new Error(
          'Password must be at least 6 characters.',
        )
      }

      const credential =
        EmailAuthProvider.credential(
          currentUser.email,
          password,
        )

      const result =
        await linkWithCredential(
          currentUser,
          credential,
        )

      setUser(
        result.user,
      )

      setConnectedProviders(
        getConnectedProviders(
          result.user,
        ),
      )

      /*
       * Adding a password does not change the
       * provider used for the current session.
       */
      await saveUserProfile(
        result.user,
      )
    }

  /*
   * Unlink one authentication provider.
   *
   * Never allow removal of the final
   * authentication method.
   */
  const unlinkProvider =
    async (
      providerId: ProviderId,
    ) => {
      const currentUser =
        firebaseAuth.currentUser

      if (!currentUser) {
        throw new Error(
          'You must be signed in before unlinking an account.',
        )
      }

      const providerIds =
        Array.from(
          new Set(
            currentUser.providerData
              .map(
                (provider) =>
                  provider.providerId,
              )
              .filter(
                (
                  id,
                ): id is ProviderId =>
                  id ===
                    'google.com' ||
                  id ===
                    'github.com' ||
                  id ===
                    'password',
              ),
          ),
        )

      if (
        !providerIds.includes(
          providerId,
        )
      ) {
        throw new Error(
          'That sign-in method is not connected to this account.',
        )
      }

      if (
        providerIds.length <= 1
      ) {
        throw new Error(
          'You cannot unlink your only sign-in method. Connect another account first.',
        )
      }

      const updatedUser =
        await unlink(
          currentUser,
          providerId,
        )

      setUser(
        updatedUser,
      )

      /*
       * Immediately update UI providers.
       */
      const remainingProviders =
        getConnectedProviders(
          updatedUser,
        )

      setConnectedProviders(
        remainingProviders,
      )

      const activeSessionProvider =
        window.sessionStorage.getItem(
          'verde-login-provider',
        )

      const removedProviderName =
        providerId ===
        'google.com'
          ? 'google'
          : providerId ===
              'github.com'
            ? 'github'
            : 'password'

      let nextLoginProvider:
        | LoginProvider
        | undefined

      /*
       * If the active session provider was removed,
       * remove it from sessionStorage.
       */
      if (
        activeSessionProvider ===
        removedProviderName
      ) {
        window.sessionStorage.removeItem(
          'verde-login-provider',
        )

        /*
         * If one provider remains, use that as
         * the effective provider.
         */
        if (
          remainingProviders.length ===
          1
        ) {
          nextLoginProvider =
            providerIdToLoginProvider(
              remainingProviders[0],
            )

          if (
            nextLoginProvider
          ) {
            window.sessionStorage.setItem(
              'verde-login-provider',
              nextLoginProvider,
            )
          }
        }
      } else if (
        activeSessionProvider ===
          'google' ||
        activeSessionProvider ===
          'github' ||
        activeSessionProvider ===
          'password'
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
  const signInWithEmail =
    async (
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

      /*
       * Refresh custom claims immediately after
       * password login.
       */
      const tokenResult =
        await result.user.getIdTokenResult(
          true,
        )

      setIsAdmin(
        tokenResult.claims
          .admin === true,
      )
    }

  /*
   * Email/password Registration
   */
  const signUpWithEmail =
    async ({
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

      await updateProfile(
        result.user,
        {
          displayName: name,
        },
      )

      await setDoc(
        doc(
          firestore,
          'users',
          result.user.uid,
        ),
        {
          uid:
            result.user.uid,

          email,

          displayName:
            name,

          phone,

          photoURL:
            result.user
              .photoURL,

          /*
           * Provider used for this registration.
           */
          provider:
            'password',

          /*
           * All providers connected to the account.
           */
          providers: [
            'password',
          ],

          createdAt:
            serverTimestamp(),

          lastLoginAt:
            serverTimestamp(),
        },
        {
          merge: true,
        },
      )

      window.sessionStorage.setItem(
        'verde-login-provider',
        'password',
      )

      /*
       * Normalize provider information using
       * the same Firebase Auth mirror.
       */
      await saveUserProfile(
        result.user,
        'password',
      )

      /*
       * A newly registered customer should not
       * have administrator privileges.
       */
      const tokenResult =
        await result.user.getIdTokenResult(
          true,
        )

      setIsAdmin(
        tokenResult.claims
          .admin === true,
      )
    }

  /*
   * Password Reset
   */
  const resetPassword = (
    email: string,
  ) =>
    sendPasswordResetEmail(
      firebaseAuth,
      email,
    )

  /*
   * Logout
   */
  const logout =
    async () => {
      window.localStorage.removeItem(
        'verde-cart',
      )

      window.localStorage.removeItem(
        'verde-wishlist',
      )

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
            firebaseAuth
              .currentUser.uid,
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

      setPendingGithubCredential(
        null,
      )

      setPendingProviderLink(
        null,
      )

      setConnectedProviders(
        [],
      )

      /*
       * Remove admin state immediately.
       */
      setIsAdmin(false)

      await signOut(
        firebaseAuth,
      )
    }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,

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
  const context =
    useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider',
    )
  }

  return context
}