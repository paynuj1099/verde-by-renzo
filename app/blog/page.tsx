import Image from 'next/image'
import Link from 'next/link'

import {
  ArrowRight,
  CalendarDays,
  Clock3,
  PenTool,
  ShoppingBag,
} from 'lucide-react'

import {
  getAllBlogPosts,
} from '@/lib/blog'

import BlogNewsletter from '@/components/BlogNewsletter'

export default function BlogPage() {
  const blogPosts =
    getAllBlogPosts()

  /*
   * ============================
   * EMPTY STATE
   * ============================
   *
   * If content/blog has no
   * Markdown files, show this.
   */
  if (
    blogPosts.length === 0
  ) {
    return (
      <main className="min-h-screen bg-white pt-36 pb-16">

        <div className="container">

          {/* PAGE HEADER */}
          <div className="mb-12 text-center lg:mb-16">

            <h1 className="mb-4 font-serif text-4xl font-bold text-forest-900 lg:text-5xl">
              The Verde Journal
            </h1>

            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Stories, insights, and inspiration from the
              world of Verde by Renzo
            </p>

          </div>

          {/* EMPTY STATE */}
          <div className="flex flex-col items-center justify-center py-20 lg:py-32">

            <div className="relative mb-8">

              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-forest-50">

                <PenTool
                  size={64}
                  className="text-forest-300"
                  strokeWidth={1.5}
                />

              </div>

            </div>

            <h2 className="mb-4 font-serif text-2xl font-bold text-gray-900 lg:text-3xl">
              No Articles Yet
            </h2>

            <p className="mb-8 max-w-md text-center text-gray-600">
              We&apos;re working on creating amazing content
              for you. Check back soon for stories, style
              guides, and insights from Verde by Renzo.
            </p>

            <Link
              href="/shop"
              className="rounded-lg bg-forest-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-forest-700"
            >
              Browse Our Collection
            </Link>

          </div>

        </div>

      </main>
    )
  }

  /*
   * Use the post marked:
   *
   * featured: true
   *
   * Otherwise use newest post.
   */
  const featuredPost =
    blogPosts.find(
      (post) =>
        post.featured
    ) ||
    blogPosts[0]

  /*
   * Don't repeat the featured
   * post in Latest Stories.
   */
  const remainingPosts =
    blogPosts.filter(
      (post) =>
        post.slug !==
        featuredPost.slug
    )

  return (
    <main className="min-h-screen bg-white pt-36 pb-16">

      <div className="container">

        {/* ======================= */}
        {/* PAGE HEADER */}
        {/* ======================= */}

        <div className="mb-12 text-center lg:mb-16">

          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-gold-500">
            Stories · Style · Golf
          </p>

          <h1 className="mb-4 font-serif text-4xl font-bold text-forest-900 lg:text-5xl">
            The Verde Journal
          </h1>

          <p className="mx-auto max-w-2xl text-lg leading-8 text-gray-600">
            Stories, insights, style guides, and inspiration
            from the world of Verde by Renzo.
          </p>

        </div>

        {/* ======================= */}
        {/* FEATURED ARTICLE */}
        {/* ======================= */}

        <section className="mb-16">

          <Link
            href={`/blog/${featuredPost.slug}`}
            className="group grid overflow-hidden rounded-2xl border border-gray-200 bg-[#f8f7f3] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl lg:grid-cols-2"
          >

            {/* IMAGE */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 lg:aspect-auto lg:min-h-[520px]">

              <Image
                src={
                  featuredPost.image
                }
                alt={
                  featuredPost.title
                }
                fill
                priority
                className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />

            </div>

            {/* CONTENT */}
            <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">

              <div className="mb-5 flex flex-wrap items-center gap-3">

                <span className="rounded-full bg-forest-600 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white">
                  Featured
                </span>

                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
                  {
                    featuredPost.category
                  }
                </span>

              </div>

              <h2 className="mb-5 font-serif text-3xl leading-tight text-gray-900 sm:text-4xl lg:text-5xl">
                {
                  featuredPost.title
                }
              </h2>

              <p className="mb-7 max-w-xl leading-7 text-gray-600">
                {
                  featuredPost.excerpt
                }
              </p>

              {/* META */}
              <div className="mb-8 flex flex-wrap items-center gap-5 text-sm text-gray-500">

                <span className="flex items-center gap-2">

                  <CalendarDays
                    size={16}
                  />

                  {
                    featuredPost.date
                  }

                </span>

                <span className="flex items-center gap-2">

                  <Clock3
                    size={16}
                  />

                  {
                    featuredPost.readTime
                  }

                </span>

              </div>

              <span className="inline-flex items-center gap-2 font-semibold text-forest-600">

                Read Article

                <ArrowRight
                  size={18}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />

              </span>

            </div>

          </Link>

        </section>

        {/* ======================= */}
        {/* LATEST STORIES */}
        {/* ======================= */}

        <section>

          <div className="mb-8 flex items-end justify-between border-b border-gray-200 pb-5">

            <div>

              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold-500">
                Explore
              </p>

              <h2 className="font-serif text-3xl font-bold text-gray-900">
                Latest Stories
              </h2>

            </div>

            <span className="hidden text-sm text-gray-500 sm:block">

              {
                blogPosts.length
              }{' '}

              {blogPosts.length === 1
                ? 'article'
                : 'articles'}

            </span>

          </div>

          {/* ARTICLE GRID */}
          <div className="grid gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">

            {remainingPosts.map(
              (post) => (
                <article
                  key={
                    post.slug
                  }
                  className="group"
                >

                  <Link
                    href={`/blog/${post.slug}`}
                    className="block"
                  >

                    {/* IMAGE */}
                    <div className="relative mb-5 aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">

                      <Image
                        src={
                          post.image
                        }
                        alt={
                          post.title
                        }
                        fill
                        className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />

                      {/* CATEGORY */}
                      <span className="absolute top-4 left-4 rounded-full bg-white/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-forest-700 shadow-sm backdrop-blur-sm">
                        {
                          post.category
                        }
                      </span>

                    </div>

                    {/* META */}
                    <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">

                      <span className="flex items-center gap-1.5">

                        <CalendarDays
                          size={14}
                        />

                        {
                          post.date
                        }

                      </span>

                      <span className="flex items-center gap-1.5">

                        <Clock3
                          size={14}
                        />

                        {
                          post.readTime
                        }

                      </span>

                    </div>

                    {/* TITLE */}
                    <h3 className="mb-3 font-serif text-2xl leading-snug text-gray-900 transition-colors group-hover:text-forest-600">

                      {
                        post.title
                      }

                    </h3>

                    {/* EXCERPT */}
                    <p className="mb-4 line-clamp-3 text-sm leading-6 text-gray-600">

                      {
                        post.excerpt
                      }

                    </p>

                    {/* READ ARTICLE */}
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-forest-600">

                      Read Article

                      <ArrowRight
                        size={16}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      />

                    </span>

                  </Link>

                </article>
              )
            )}

          </div>

        </section>

        {/* ======================= */}
        {/* SHOP CTA */}
        {/* ======================= */}

        <section className="mt-20 overflow-hidden rounded-2xl bg-forest-50 px-6 py-12 text-center sm:px-10 lg:py-16">

          <ShoppingBag
            size={28}
            className="mx-auto mb-4 text-forest-600"
          />

          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-gold-500">
            The VERDE Collection
          </p>

          <h2 className="mb-4 font-serif text-3xl font-bold text-forest-900 sm:text-4xl">

            Designed for the Course.
            <br />
            Made for Everywhere.

          </h2>

          <p className="mx-auto mb-8 max-w-xl leading-7 text-gray-600">
            Explore premium golf apparel and accessories
            designed around understated style, practical
            performance, and thoughtful details.
          </p>

          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-lg bg-forest-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-forest-700"
          >

            Browse Our Collection

            <ArrowRight
              size={17}
            />

          </Link>

        </section>

        {/* ======================= */}
        {/* NEWSLETTER */}
        {/* ======================= */}

        <BlogNewsletter />

      </div>

    </main>
  )
}