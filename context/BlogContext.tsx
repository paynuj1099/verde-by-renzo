'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { firestore } from '@/lib/firebase'

export type BlogPostRecord = {
  id: string
  slug: string
  title: string
  excerpt: string
  category: string
  imageUrl?: string
  imageFileId?: string
  imageAssetId?: string
  date: string
  publishedAt: string
  readTime: string
  featured: boolean
  published: boolean
  content: string
}

const BlogContext = createContext<{ posts: BlogPostRecord[]; loading: boolean }>({ posts: [], loading: true })

export function BlogProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<BlogPostRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => onSnapshot(query(collection(firestore, 'blogs'), where('published', '==', true)), (snapshot) => {
    const records = snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as BlogPostRecord))
      .filter((post) => post.published !== false)
      .sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''))
    setPosts(records)
    setLoading(false)
  }, (error) => {
    console.error('Unable to load blog posts:', error)
    setPosts([])
    setLoading(false)
  }), [])

  return <BlogContext.Provider value={{ posts, loading }}>{children}</BlogContext.Provider>
}

export const useBlogs = () => useContext(BlogContext)
