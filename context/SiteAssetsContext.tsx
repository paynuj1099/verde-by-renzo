'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { firestore } from '@/lib/firebase'

type SiteAssetsContextValue = {
  assets: Record<string, string>
  loading: boolean
  getAsset: (id: string) => string
}

const SiteAssetsContext = createContext<SiteAssetsContextValue>({ assets: {}, loading: true, getAsset: () => '' })

export function SiteAssetsProvider({ children }: { children: React.ReactNode }) {
  const [assets, setAssets] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => onSnapshot(collection(firestore, 'siteAssets'), (snapshot) => {
    setAssets(Object.fromEntries(snapshot.docs.map((document) => [document.id, String(document.data().url || '')])))
    setLoading(false)
  }, (error) => {
    console.error('Unable to load site assets:', error)
    setLoading(false)
  }), [])

  const getAsset = (id: string) => assets[id] || ''
  return <SiteAssetsContext.Provider value={{ assets, loading, getAsset }}>{children}</SiteAssetsContext.Provider>
}

export function useSiteAssets() {
  return useContext(SiteAssetsContext)
}
