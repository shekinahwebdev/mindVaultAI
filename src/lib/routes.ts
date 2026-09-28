export const routes = {
  home: "/",
  /** @deprecated Use overview — /features redirects here */
  features: "/features",
  overview: "/overview",
  blog: "/blog",
  pricing: "/pricing",
  /** Legacy — redirects to onboarding start. */
  intro: "/intro",
  onboarding: {
    base: "/onboarding",
    start: "/onboarding/1",
    step: (n: number) => `/onboarding/${n}`,
  },
  signUp: "/sign-up",
  signIn: "/sign-in",
  create: "/sign-up",
  vault: "/vault",
} as const;

export const vaultRoutes = {
  dashboard: "/vault",
  notes: "/vault/notes",
  categories: "/vault/categories",
  search: "/vault/search",
  chat: "/vault/chat",
  settings: "/vault/settings",
  subscription: "/vault/subscription",
  capture: "/vault/capture",
} as const;
