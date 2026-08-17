import Image from 'next/image'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
} from 'lucide-react'

import type {
  BlogPost,
} from '@/lib/blog'

interface BlogArticleProps {
  post: BlogPost
}

export default function BlogArticle({
  post,
}: BlogArticleProps) {
  return (
    <main className="min-h-screen bg-white pt-28 pb-16 sm:pt-32 lg:pt-36">

      {/* ======================= */}
      {/* ARTICLE HEADER */}
      {/* ======================= */}

      <div className="container">

        {/* BACK */}
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-forest-600"
        >
          <ArrowLeft size={17} />
          Back to Journal
        </Link>

        {/* TITLE AREA */}
        <header className="mx-auto mb-10 max-w-4xl text-center">

          {/* CATEGORY */}
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-forest-600">
            {post.category}
          </p>

          {/* TITLE */}
          <h1 className="mb-6 font-serif text-4xl font-bold leading-tight text-forest-900 sm:text-5xl lg:text-6xl">
            {post.title}
          </h1>

          {/* EXCERPT */}
          <p className="mx-auto mb-7 max-w-2xl text-lg leading-8 text-gray-600">
            {post.excerpt}
          </p>

          {/* META */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-gray-500">

            <span className="flex items-center gap-2">
              <CalendarDays size={16} />
              {post.date}
            </span>

            <span className="flex items-center gap-2">
              <Clock3 size={16} />
              {post.readTime}
            </span>

            <span>
              VERDE Editorial
            </span>

          </div>

        </header>

        {/* ======================= */}
        {/* FEATURE IMAGE */}
        {/* ======================= */}

        <div className="relative mx-auto mb-14 aspect-[16/9] max-w-6xl overflow-hidden rounded-2xl bg-gray-100">

          <Image
            src={post.image}
            alt={post.title}
            fill
            priority
            className="object-cover object-center"
            sizes="(max-width: 1280px) 100vw, 1200px"
          />

        </div>

      </div>

      {/* ======================= */}
      {/* MARKDOWN CONTENT */}
      {/* ======================= */}

      <article className="container">

        <div className="mx-auto max-w-3xl">

          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="mt-12 mb-6 font-serif text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">
                  {children}
                </h1>
              ),

              h2: ({ children }) => (
                <h2 className="mt-12 mb-5 font-serif text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
                  {children}
                </h2>
              ),

              h3: ({ children }) => (
                <h3 className="mt-10 mb-4 font-serif text-xl font-semibold leading-tight text-gray-900 sm:text-2xl">
                  {children}
                </h3>
              ),

              p: ({ children }) => (
                <p className="mb-6 text-base leading-8 text-gray-600 sm:text-[17px]">
                  {children}
                </p>
              ),

              ul: ({ children }) => (
                <ul className="mb-7 list-disc space-y-3 pl-6 text-gray-600">
                  {children}
                </ul>
              ),

              ol: ({ children }) => (
                <ol className="mb-7 list-decimal space-y-3 pl-6 text-gray-600">
                  {children}
                </ol>
              ),

              li: ({ children }) => (
                <li className="pl-1 leading-7">
                  {children}
                </li>
              ),

              strong: ({ children }) => (
                <strong className="font-semibold text-gray-900">
                  {children}
                </strong>
              ),

              em: ({ children }) => (
                <em className="italic text-gray-700">
                  {children}
                </em>
              ),

              blockquote: ({ children }) => (
                <blockquote className="my-9 border-l-4 border-gold-400 bg-[#f8f7f3] px-6 py-5 font-serif text-lg leading-8 text-gray-700">
                  {children}
                </blockquote>
              ),

              hr: () => (
                <hr className="my-12 border-gray-200" />
              ),

              a: ({
                href,
                children,
              }) => (
                <a
                  href={href}
                  className="font-medium text-forest-600 underline decoration-forest-200 underline-offset-4 transition-colors hover:text-forest-700"
                >
                  {children}
                </a>
              ),
            }}
          >
            {post.content}
          </ReactMarkdown>

          {/* ======================= */}
          {/* ARTICLE CTA */}
          {/* ======================= */}

          <div className="mt-14 border-t border-gray-200 pt-10">

            <div className="rounded-2xl bg-forest-50 p-7 sm:p-9">

              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold-500">
                VERDE by Renzo
              </p>

              <h2 className="mb-3 font-serif text-2xl font-bold text-forest-900 sm:text-3xl">
                Explore the Collection
              </h2>

              <p className="mb-6 max-w-xl leading-7 text-gray-600">
                Discover golf apparel and accessories
                designed with the same attention to
                understated style and thoughtful details.
              </p>

              <Link
                href="/shop"
                className="inline-flex items-center gap-2 font-semibold text-forest-600 transition-colors hover:text-forest-700"
              >
                Shop VERDE

                <ArrowRight size={17} />
              </Link>

            </div>

          </div>

          {/* ======================= */}
          {/* BACK TO JOURNAL */}
          {/* ======================= */}

          <div className="mt-10 text-center">

            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition-colors hover:text-forest-600"
            >
              <ArrowLeft size={16} />

              Back to The Verde Journal
            </Link>

          </div>

        </div>

      </article>

    </main>
  )
}