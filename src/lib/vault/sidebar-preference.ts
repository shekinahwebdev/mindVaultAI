export const VAULT_SIDEBAR_COLLAPSED_KEY = "mindvault-sidebar-collapsed";

const sidebarListeners = new Set<() => void>();

/** SSR / hydration snapshot — must match server-rendered sidebar. */
export function getServerVaultSidebarCollapsed(): boolean {
  return true;
}

/** Default: collapsed icon rail. */
export function readVaultSidebarCollapsed(): boolean {
  if (typeof window === "undefined") {
    return getServerVaultSidebarCollapsed();
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

function notifyVaultSidebarCollapsed() {
  for (const listener of sidebarListeners) {
    listener();
  }
}

export function subscribeVaultSidebarCollapsed(onStoreChange: () => void) {
  sidebarListeners.add(onStoreChange);
  return () => {
    sidebarListeners.delete(onStoreChange);
  };
}

export function setVaultSidebarCollapsed(collapsed: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(VAULT_SIDEBAR_COLLAPSED_KEY, String(collapsed));
  } catch {
    // ignore
  }

  notifyVaultSidebarCollapsed();
}

/** @deprecated Prefer setVaultSidebarCollapsed */
export function writeVaultSidebarCollapsed(collapsed: boolean) {
  setVaultSidebarCollapsed(collapsed);
}

export function toggleVaultSidebarCollapsed() {
  setVaultSidebarCollapsed(!readVaultSidebarCollapsed());
}
