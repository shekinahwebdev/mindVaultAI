"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

import type { BlogPost } from "@/lib/marketing/blog-content";
import { formatBlogDate } from "@/lib/marketing/blog-content";
import { featuresGridItem } from "@/lib/marketing/marketing-motion";
import { cn } from "@/lib/utils";

type BlogPostCardProps = {
  post: BlogPost;
};

export function BlogPostCard({ post }: BlogPostCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.li variants={featuresGridItem} custom={reduceMotion} className="min-w-0 list-none">
      <article
        className={cn(
          "group flex h-full flex-col overflow-hidden rounded-[0.875rem]",
          "border border-white/[0.08] bg-white/[0.03] transition-colors duration-300",
          "hover:border-white/[0.12] hover:bg-white/[0.045]",
        )}
      >
        <div className="relative aspect-[16/10] overflow-hidden border-b border-white/[0.06]">
          <Image
            src={post.imageSrc}
            alt=""
            fill
            unoptimized
            className={cn(
              "object-cover grayscale contrast-[1.08] transition duration-500 group-hover:scale-[1.02]",
              post.imageClassName,
            )}
            sizes="(min-width: 1024px) 380px, 90vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/15" />
          <span className="absolute bottom-3 left-3 rounded-md border border-white/15 bg-black/55 px-2 py-0.5 text-[0.625rem] font-medium tracking-[0.14em] text-white/80 uppercase backdrop-blur-sm">
            {post.categoryLabel}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <h2 className="text-[0.9375rem] font-semibold leading-snug tracking-[-0.01em] text-white sm:text-[1rem]">
            {post.title}
          </h2>
          <p className="mt-2 line-clamp-3 flex-1 text-[0.8125rem] leading-relaxed text-white/45 sm:text-[0.875rem]">
            {post.excerpt}
          </p>
          <p className="mt-4 text-[0.75rem] text-white/35">
            {formatBlogDate(post.publishedAt)} · {post.readMinutes} min read
          </p>
        </div>
      </article>
    </motion.li>
  );
}
