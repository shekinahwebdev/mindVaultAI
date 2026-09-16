export const routes = {
  home: "/",
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
