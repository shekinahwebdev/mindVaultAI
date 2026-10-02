export type PaystackApiResponse<T> =
  | { status: true; message: string; data: T }
  | { status: false; message: string; data?: unknown };

export type PaystackInitializeData = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

export type PaystackVerifyTransactionData = {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  domain?: string;
  paid_at?: string;
  customer?: {
    email?: string;
    customer_code?: string;
  };
  plan?: string | number | null;
  plan_object?: { plan_code?: string; name?: string } | null;
  metadata?: Record<string, unknown> | string | null;
  authorization?: { authorization_code?: string };
};

export type PaystackWebhookEvent = {
  event: string;
  data: Record<string, unknown>;
};

export type PaystackSubscriptionPayload = {
  subscription_code?: string;
  email_token?: string;
  customer?: { customer_code?: string; email?: string };
  plan?: { plan_code?: string; name?: string };
  next_payment_date?: string;
  status?: string;
};
