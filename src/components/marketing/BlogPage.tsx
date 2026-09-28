"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";

import type { BlogCategoryFilter } from "@/lib/marketing/blog-content";
import {
  blogPageCopy,
  blogPosts,
  filterBlogPosts,
} from "@/lib/marketing/blog-content";
import {
  featuresGridContainer,
  featuresPageReveal,
} from "@/lib/marketing/marketing-motion";
import { cn } from "@/lib/utils";

import { BlogCategoryFilters } from "./BlogCategoryFilters";
import { BlogPostCard } from "./BlogPostCard";
import { MarketingHeader } from "./MarketingHeader";

export function BlogPage() {
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<BlogCategoryFilter>("all");

  const visiblePosts = useMemo(
    () => filterBlogPosts(blogPosts, category, query),
    [category, query],
  );

  return (
    <div className="landing-page relative min-h-svh overflow-x-hidden bg-black text-white">
      <MarketingHeader
        blogSearch={{ value: query, onChange: setQuery }}
        primaryCtaLabel="Get Started"
      />

      <main id="main-content" className="relative z-10 pb-16 pt-2 sm:pb-20">
        <motion.header
          className="mx-auto max-w-3xl px-[var(--mv-page-padding-x)] pt-12 text-center sm:pt-14 lg:pt-16"
          variants={featuresPageReveal}
          initial="hidden"
          animate="show"
          custom={reduceMotion}
        >
          <p className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-[0.65rem] font-medium tracking-[0.22em] text-white/55 uppercase">
            {blogPageCopy.eyebrow}
          </p>
          <h1
            className={cn(
              "font-editorial mt-6 text-balance text-[1.85rem] leading-[1.12] font-normal tracking-[-0.02em] text-white",
              "sm:text-[2.25rem] lg:text-[2.65rem]",
            )}
          >
            {blogPageCopy.headline}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-[0.875rem] leading-relaxed text-white/45 sm:text-[0.9375rem] lg:mt-6">
            {blogPageCopy.subhead}
          </p>
        </motion.header>

        <motion.div
          className="mx-auto mt-8 max-w-6xl px-[var(--mv-page-padding-x)] sm:mt-10 lg:px-[max(2.5rem,6vw)]"
          variants={featuresPageReveal}
          initial="hidden"
          animate="show"
          custom={reduceMotion}
        >
          <BlogCategoryFilters value={category} onChange={setCategory} />
        </motion.div>

        <motion.ul
          className="mx-auto mt-8 grid max-w-6xl list-none grid-cols-1 gap-5 px-[var(--mv-page-padding-x)] sm:mt-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5 lg:px-[max(2.5rem,6vw)]"
          variants={featuresGridContainer}
          initial="hidden"
          animate="show"
          custom={reduceMotion}
          key={`${category}-${query}`}
        >
          {visiblePosts.map((post) => (
            <BlogPostCard key={post.id} post={post} />
          ))}
        </motion.ul>

        {visiblePosts.length === 0 ? (
          <p className="mx-auto mt-10 max-w-md px-[var(--mv-page-padding-x)] text-center text-[0.875rem] text-white/45">
            No posts match your search. Try another category or keyword.
          </p>
        ) : null}
      </main>
    </div>
  );
}
