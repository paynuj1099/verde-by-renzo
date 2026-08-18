'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import type { Product } from '@/data/products'
import { firestore } from '@/lib/firebase'
import { setCatalogProducts } from '@/lib/productCatalog'

type ProductContextValue = { products: Product[]; loading: boolean }
const ProductContext = createContext<ProductContextValue>({ products: [], loading: true })

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => onSnapshot(collection(firestore, 'products'), (snapshot) => {
    const cloudProducts = snapshot.docs
      .map((item) => item.data() as Product & { active?: boolean })
      .filter((product) => product.active !== false && typeof product.id === 'number')
      .sort((a, b) => a.id - b.id)
    setCatalogProducts(cloudProducts)
    setProducts(cloudProducts)
    setLoading(false)
  }, (error) => {
    console.error('Unable to load Firestore products:', error)
    setCatalogProducts([])
    setProducts([])
    setLoading(false)
  }), [])

  return <ProductContext.Provider value={{ products, loading }}>{children}</ProductContext.Provider>
}

export function useProducts() {
  return useContext(ProductContext)
}
