'use client'

import { notFound, useParams } from 'next/navigation'
import BlogArticle from '@/components/BlogArticle'
import { useBlogs } from '@/context/BlogContext'

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const { posts, loading } = useBlogs()
  if (loading) return <main className="min-h-screen bg-white pt-36"><p className="container text-center text-gray-500">Loading article...</p></main>
  const post = posts.find((item) => item.slug === slug)
  if (!post) notFound()
  return <BlogArticle post={post} />
}
