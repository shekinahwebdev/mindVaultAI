import type { AskVaultBilling } from "./ask-vault-billing";

/** Test/dev helper — skips quota checks when ask-vault is run with injected deps. */
export const noopAskVaultBilling: AskVaultBilling = {
  beforeGenerativeCall: async () => null,
  afterGenerativeSuccess: async () => {},
};
