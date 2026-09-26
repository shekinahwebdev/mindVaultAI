import { Suspense } from "react";

import { SearchView } from "@/components/vault/search/SearchView";

export default function VaultSearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchView />
    </Suspense>
  );
}
