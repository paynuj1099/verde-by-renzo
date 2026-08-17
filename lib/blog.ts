import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

/*
 * ============================
 * TYPES
 * ============================
 */

export type BlogPostMeta = {
  slug: string
  title: string
  excerpt: string
  category: string
  image: string
  date: string
  publishedAt: string
  readTime: string
  featured: boolean
}

export type BlogPost = BlogPostMeta & {
  content: string
}

/*
 * ============================
 * BLOG DIRECTORY
 * ============================
 *
 * Reads:
 *
 * content/
 * └── blog/
 *     ├── article-1.md
 *     ├── article-2.md
 *     └── ...
 */

const BLOG_DIRECTORY = path.join(
  process.cwd(),
  'content',
  'blog'
)

/*
 * ============================
 * GET MARKDOWN FILES
 * ============================
 */

function getBlogFiles(): string[] {
  /*
   * Prevent errors if the
   * content/blog folder
   * does not exist yet.
   */
  if (
    !fs.existsSync(
      BLOG_DIRECTORY
    )
  ) {
    return []
  }

  return fs
    .readdirSync(
      BLOG_DIRECTORY
    )
    .filter(
      (file) =>
        file.endsWith('.md')
    )
}

/*
 * ============================
 * PARSE ONE MARKDOWN FILE
 * ============================
 */

function parseBlogFile(
  filename: string
): BlogPost {
  const fullPath =
    path.join(
      BLOG_DIRECTORY,
      filename
    )

  /*
   * Read .md file.
   */
  const fileContents =
    fs.readFileSync(
      fullPath,
      'utf8'
    )

  /*
   * gray-matter separates:
   *
   * ---
   * title:
   * category:
   * etc.
   * ---
   *
   * from the Markdown body.
   */
  const {
    data,
    content,
  } = matter(
    fileContents
  )

  /*
   * Filename becomes slug
   * automatically.
   *
   * Example:
   *
   * performance-meets-everyday-style.md
   *
   * becomes:
   *
   * performance-meets-everyday-style
   */
  const filenameSlug =
    filename.replace(
      /\.md$/,
      ''
    )

  return {
    /*
     * You may optionally add
     * "slug" inside front matter.
     *
     * Otherwise filename is used.
     */
    slug:
      typeof data.slug ===
        'string' &&
      data.slug.trim()
        ? data.slug.trim()
        : filenameSlug,

    title:
      typeof data.title ===
      'string'
        ? data.title
        : 'Untitled Article',

    excerpt:
      typeof data.excerpt ===
      'string'
        ? data.excerpt
        : '',

    category:
      typeof data.category ===
      'string'
        ? data.category
        : 'Journal',

    image:
      typeof data.image ===
      'string'
        ? data.image
        : '/images/performance-polo-green.png',

    date:
      typeof data.date ===
      'string'
        ? data.date
        : '',

    publishedAt:
      typeof data.publishedAt ===
      'string'
        ? data.publishedAt
        : '',

    readTime:
      typeof data.readTime ===
      'string'
        ? data.readTime
        : '3 min read',

    featured:
      data.featured === true,

    content,
  }
}

/*
 * ============================
 * GET ALL BLOG POSTS
 * ============================
 */

export function getAllBlogPosts(): BlogPost[] {
  const files =
    getBlogFiles()

  const posts =
    files.map(
      (
        filename
      ) =>
        parseBlogFile(
          filename
        )
    )

  /*
   * Sort newest article first.
   *
   * Uses:
   * publishedAt: "2026-08-18"
   */
  return posts.sort(
    (
      a,
      b
    ) => {
      const dateA =
        a.publishedAt
          ? new Date(
              a.publishedAt
            ).getTime()
          : 0

      const dateB =
        b.publishedAt
          ? new Date(
              b.publishedAt
            ).getTime()
          : 0

      return (
        dateB -
        dateA
      )
    }
  )
}

/*
 * ============================
 * GET ONE BLOG POST
 * ============================
 *
 * Used by:
 *
 * app/blog/[slug]/page.tsx
 */

export function getBlogPostBySlug(
  slug: string
): BlogPost | null {
  const posts =
    getAllBlogPosts()

  const post =
    posts.find(
      (
        item
      ) =>
        item.slug ===
        slug
    )

  return (
    post ||
    null
  )
}

/*
 * ============================
 * GET FEATURED POST
 * ============================
 */

export function getFeaturedBlogPost(): BlogPost | null {
  const posts =
    getAllBlogPosts()

  const featured =
    posts.find(
      (
        post
      ) =>
        post.featured
    )

  /*
   * If none is marked featured,
   * use newest post.
   */
  return (
    featured ||
    posts[0] ||
    null
  )
}

/*
 * ============================
 * GET RELATED POSTS
 * ============================
 */

export function getRelatedBlogPosts(
  currentSlug: string,
  limit = 3
): BlogPost[] {
  const posts =
    getAllBlogPosts()

  const currentPost =
    posts.find(
      (
        post
      ) =>
        post.slug ===
        currentSlug
    )

  if (!currentPost) {
    return []
  }

  /*
   * First try posts from
   * the same category.
   */
  const sameCategory =
    posts.filter(
      (
        post
      ) =>
        post.slug !==
          currentSlug &&
        post.category ===
          currentPost.category
    )

  /*
   * Then fill remaining slots
   * with other articles.
   */
  const otherPosts =
    posts.filter(
      (
        post
      ) =>
        post.slug !==
          currentSlug &&
        post.category !==
          currentPost.category
    )

  return [
    ...sameCategory,
    ...otherPosts,
  ].slice(
    0,
    limit
  )
}