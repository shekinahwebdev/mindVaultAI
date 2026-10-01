import type { AskVaultResult } from "@/lib/rag/types";

export type AskVaultBilling = {
  beforeGenerativeCall: (userId: string) => Promise<AskVaultResult | null>;
  afterGenerativeSuccess: (userId: string) => Promise<void>;
};
