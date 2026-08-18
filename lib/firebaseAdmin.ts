import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
const credential = serviceAccountJson
  ? cert(JSON.parse(serviceAccountJson))
  : applicationDefault()

const adminApp = getApps()[0] || initializeApp({
  credential,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
})

export const adminAuth = getAuth(adminApp)
