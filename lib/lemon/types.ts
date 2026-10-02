/**
 * Type definitions for Lemon Squeezy Integration (21.01)
 */

export type LemonPlanId = "COMPANY" | "FREELANCER" | "AGENCY" | "PLATINUM";
export type LemonBillingCycle = "monthly" | "yearly";

export interface LemonCustomData {
  user_id?: string;
  userId?: string;
  brand_id?: string;
  brandId?: string;
  plan_id?: string;
  planId?: string;
  billing_cycle?: LemonBillingCycle;
  billingCycle?: LemonBillingCycle;
}

export interface LemonWebhookMeta {
  event_name:
    | "order_created"
    | "subscription_created"
    | "subscription_updated"
    | "subscription_cancelled"
    | "subscription_resumed"
    | "subscription_expired"
    | "subscription_paused"
    | "subscription_unpaused";
  custom_data?: LemonCustomData;
}

export interface LemonWebhookAttributes {
  store_id: number;
  customer_id: number;
  identifier?: string;
  order_number?: number;
  user_name?: string;
  user_email?: string;
  currency?: string;
  total?: number;
  status?: string;
  product_name?: string;
  variant_name?: string;
  variant_id?: number;
  created_at?: string;
  updated_at?: string;
  ends_at?: string | null;
  renews_at?: string | null;
  urls?: {
    update_payment_method?: string;
    customer_portal?: string;
  };
  first_order_item?: {
    order_id: number;
    price_id: number;
    product_id: number;
    variant_id: number;
    product_name: string;
    variant_name: string;
    price: number;
  };
}

export interface LemonWebhookPayload {
  meta: LemonWebhookMeta;
  data: {
    id: string;
    type: string;
    attributes: LemonWebhookAttributes;
    relationships?: Record<string, unknown>;
  };
}
