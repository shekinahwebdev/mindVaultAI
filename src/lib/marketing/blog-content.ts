export type BlogCategoryId =
  | "product"
  | "productivity"
  | "ai"
  | "study"
  | "career"
  | "personal"
  | "tutorials";

export type BlogCategoryFilter = "all" | BlogCategoryId;

export type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  category: BlogCategoryId;
  categoryLabel: string;
  publishedAt: string;
  readMinutes: number;
  imageSrc: string;
  imageClassName?: string;
};

export const blogPageCopy = {
  eyebrow: "Blog",
  headline: "Ideas, guides and insights.",
  subhead: "Learn, get inspired and make the most of your knowledge.",
  searchPlaceholder: "Search posts...",
} as const;

export const blogCategories: { id: BlogCategoryFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "product", label: "Product" },
  { id: "productivity", label: "Productivity" },
  { id: "ai", label: "AI" },
  { id: "study", label: "Study" },
  { id: "career", label: "Career" },
  { id: "personal", label: "Personal" },
  { id: "tutorials", label: "Tutorials" },
];

export const blogPosts: BlogPost[] = [
  {
    id: "second-brain",
    title: "How to build a second brain with MindVault",
    excerpt:
      "A practical guide to capturing ideas, organising knowledge and retrieving what matters when you need it.",
    category: "product",
    categoryLabel: "Product",
    publishedAt: "2026-09-20",
    readMinutes: 5,
    imageSrc: "/marketing/sign-in-hero-bg.png",
    imageClassName: "object-[center_35%]",
  },
  {
    id: "ai-with-notes",
    title: "10 practical ways to use AI with your notes",
    excerpt:
      "From smart summaries to semantic search — simple workflows that save time without adding complexity.",
    category: "ai",
    categoryLabel: "AI",
    publishedAt: "2026-09-18",
    readMinutes: 8,
    imageSrc: "/marketing/landing-cosmic-bg.png",
    imageClassName: "object-[center_40%]",
  },
  {
    id: "whats-new",
    title: "What's new in MindVault: AI Chat, better search and more",
    excerpt:
      "The latest improvements to capture, organisation and Ask MindVault — plus what's coming next.",
    category: "product",
    categoryLabel: "Product",
    publishedAt: "2026-08-30",
    readMinutes: 4,
    imageSrc: "/marketing/sign-in-hero-bg.png",
    imageClassName: "object-[center_55%]",
  },
  {
    id: "student-organisation",
    title: "How to stay organised as a student",
    excerpt:
      "Keep lectures, readings and assignments in one vault — with categories that adapt as your term progresses.",
    category: "productivity",
    categoryLabel: "Productivity",
    publishedAt: "2026-08-12",
    readMinutes: 6,
    imageSrc: "/marketing/landing-cosmic-bg.png",
    imageClassName: "object-[center_25%]",
  },
  {
    id: "building-in-public",
    title: "Building in public: lessons from my journey",
    excerpt:
      "What I learned sharing progress openly — and how documenting decisions in a vault kept me accountable.",
    category: "career",
    categoryLabel: "Career",
    publishedAt: "2026-07-22",
    readMinutes: 7,
    imageSrc: "/marketing/sign-in-hero-bg.png",
    imageClassName: "object-[center_20%]",
  },
  {
    id: "coding-with-mindvault",
    title: "Using MindVault for coding and development",
    excerpt:
      "Save snippets, link docs and search your stack — a lightweight workflow for day-to-day engineering.",
    category: "tutorials",
    categoryLabel: "Tutorials",
    publishedAt: "2026-07-08",
    readMinutes: 9,
    imageSrc: "/marketing/landing-cosmic-bg.png",
    imageClassName: "object-center",
  },
];

export function formatBlogDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${isoDate}T12:00:00`));
}

export function filterBlogPosts(
  posts: BlogPost[],
  category: BlogCategoryFilter,
  query: string,
): BlogPost[] {
  const normalizedQuery = query.trim().toLowerCase();

  return posts.filter((post) => {
    const matchesCategory = category === "all" || post.category === category;
    if (!matchesCategory) return false;
    if (!normalizedQuery) return true;

    const haystack = `${post.title} ${post.excerpt} ${post.categoryLabel}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}
