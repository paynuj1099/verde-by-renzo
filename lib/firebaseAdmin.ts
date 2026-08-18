import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

export function getAdminAuth() {
  const existingApp = getApps()[0]
  if (existingApp) return getAuth(existingApp)

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  const credential = serviceAccountJson
    ? cert(JSON.parse(serviceAccountJson))
    : applicationDefault()

  return getAuth(initializeApp({
    credential,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  }))
}
