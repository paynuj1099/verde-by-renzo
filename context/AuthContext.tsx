'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { firebaseAuth, firestore } from '@/lib/firebase'

type AuthContextValue = {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<boolean>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (details: { name: string; email: string; phone: string; password: string }) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function saveUserProfile(user: User) {
  await setDoc(doc(firestore, 'users', user.uid), {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    provider: 'google',
    lastLoginAt: serverTimestamp(),
  }, { merge: true })
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRedirectResult(firebaseAuth).then((result) => {
      if (result?.user) return saveUserProfile(result.user)
    }).catch((error) => console.error('Google sign-in failed:', error))

    return onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)
      if (nextUser) saveUserProfile(nextUser).catch(console.error)
    })
  }, [])

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })

    try {
      const result = await signInWithPopup(firebaseAuth, provider)
      await saveUserProfile(result.user)
      return true
    } catch (error: any) {
      if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/popup-closed-by-user') {
        await signInWithRedirect(firebaseAuth, provider)
        return false
      }

      throw error
    }
  }
  const signInWithEmail = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(firebaseAuth, email, password)
    await saveUserProfile(result.user)
  }
  const signUpWithEmail = async ({ name, email, phone, password }: { name: string; email: string; phone: string; password: string }) => {
    const result = await createUserWithEmailAndPassword(firebaseAuth, email, password)
    await updateProfile(result.user, { displayName: name })
    await setDoc(doc(firestore, 'users', result.user.uid), {
      uid: result.user.uid,
      email,
      displayName: name,
      phone,
      provider: 'password',
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    }, { merge: true })
  }
  const resetPassword = (email: string) => sendPasswordResetEmail(firebaseAuth, email)
  const logout = async () => {
    window.localStorage.removeItem('verde-cart')
    window.localStorage.removeItem('verde-wishlist')
    const deviceId = window.localStorage.getItem('verde-device-id')
    if (firebaseAuth.currentUser && deviceId) {
      await deleteDoc(
        doc(firestore, 'users', firebaseAuth.currentUser.uid, 'devices', deviceId),
      ).catch((error) => console.error('Unable to remove signed-out device:', error))
    }
    await signOut(firebaseAuth)
  }

  return <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
