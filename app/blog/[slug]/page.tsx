import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import BlogArticle from '@/components/BlogArticle'

import {
  getAllBlogPosts,
  getBlogPostBySlug,
} from '@/lib/blog'

type BlogPostPageProps = {
  params: Promise<{
    slug: string
  }>
}

/*
 * Creates a route for every
 * Markdown article.
 */
export function generateStaticParams() {
  const posts = getAllBlogPosts()

  return posts.map((post) => ({
    slug: post.slug,
  }))
}

/*
 * SEO metadata is automatically
 * read from each .md file.
 */
export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params

  const post =
    getBlogPostBySlug(slug)

  if (!post) {
    return {
      title:
        'Article Not Found | The Verde Journal',
    }
  }

  return {
    title:
      `${post.title} | The Verde Journal`,

    description:
      post.excerpt,

    openGraph: {
      title:
        post.title,

      description:
        post.excerpt,

      images: [
        post.image,
      ],
    },
  }
}

/*
 * Reuse the same BlogArticle
 * layout for every Markdown file.
 */
export default async function BlogPostPage({
  params,
}: BlogPostPageProps) {
  const { slug } =
    await params

  const post =
    getBlogPostBySlug(
      slug
    )

  if (!post) {
    notFound()
  }

  return (
    <BlogArticle
      post={post}
    />
  )
}