import type { Metadata } from "next";

import { BlogPage } from "@/components/marketing/BlogPage";
import { brand } from "@/lib/brand";
import { blogPageCopy } from "@/lib/marketing/blog-content";

export const metadata: Metadata = {
  title: `Blog — ${brand.name}`,
  description: blogPageCopy.subhead,
};

export default function BlogRoutePage() {
  return <BlogPage />;
}
