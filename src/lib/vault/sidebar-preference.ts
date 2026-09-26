export const VAULT_SIDEBAR_COLLAPSED_KEY = "mindvault-sidebar-collapsed";

/** Default: collapsed icon rail. */
export function readVaultSidebarCollapsed(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    const stored = window.localStorage.getItem(VAULT_SIDEBAR_COLLAPSED_KEY);
    if (stored === "false") {
      return false;
    }
    if (stored === "true") {
      return true;
    }
  } catch {
    // ignore
  }

  return true;
}

export function writeVaultSidebarCollapsed(collapsed: boolean) {
  try {
    window.localStorage.setItem(VAULT_SIDEBAR_COLLAPSED_KEY, String(collapsed));
  } catch {
    // ignore
  }
}
