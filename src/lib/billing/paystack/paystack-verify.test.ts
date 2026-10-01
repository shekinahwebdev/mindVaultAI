import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";

import { verifyPaystackWebhookSignature } from "./paystack-signature";

describe("verifyPaystackWebhookSignature", () => {
  it("accepts valid HMAC SHA512 hex signature", () => {
    const secret = "sk_test_example";
    const body = '{"event":"charge.success","data":{"reference":"abc"}}';
    const signature = createHmac("sha512", secret).update(body).digest("hex");
    assert.equal(verifyPaystackWebhookSignature(body, signature, secret), true);
  });

  it("rejects tampered body", () => {
    const secret = "sk_test_example";
    const body = '{"event":"charge.success","data":{"reference":"abc"}}';
    const signature = createHmac("sha512", secret).update(body).digest("hex");
    assert.equal(
      verifyPaystackWebhookSignature(body + " ", signature, secret),
      false,
    );
  });

  it("rejects missing signature", () => {
    assert.equal(verifyPaystackWebhookSignature("{}", null, "sk_test_x"), false);
  });
});
