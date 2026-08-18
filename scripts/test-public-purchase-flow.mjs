#!/usr/bin/env node

/**
 * E9 — Public purchase-flow smoke test.
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 STORE_SLUG=demo node scripts/test-public-purchase-flow.mjs
 *
 * The script intentionally requires a real running app + database and never
 * fabricates product/customer IDs. It validates the public endpoint contract
 * and creates a real test order only when TEST_PRODUCT_ID is provided.
 */

const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const storeSlug = process.env.STORE_SLUG;
const productId = process.env.TEST_PRODUCT_ID;
const variantId = process.env.TEST_VARIANT_ID || null;

if (!storeSlug || !productId) {
  console.error("E9 requires STORE_SLUG and TEST_PRODUCT_ID.");
  process.exit(2);
}

const payload = {
  customerName: "E2E Test Customer",
  customerPhone: `9677${Date.now().toString().slice(-8)}`,
  customerEmail: "e2e@example.test",
  shippingCity: "عدن",
  shippingArea: "اختبار",
  shippingAddress: "عنوان اختبار E9",
  shippingNotes: "حذف هذا الطلب بعد الاختبار",
  deliveryMethod: "DELIVERY",
  paymentMethod: "CASH_ON_DELIVERY",
  notes: "E9 automated purchase-flow test",
  items: [{ productId, variantId, quantity: 1 }],
};

const response = await fetch(`${baseUrl}/api/public/stores/${encodeURIComponent(storeSlug)}/orders`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

const data = await response.json().catch(() => null);
if (!response.ok || !data?.success || !data?.data?.order?.id || !data?.data?.order?.accessToken) {
  console.error("E9 FAILED", response.status, data);
  process.exit(1);
}

const order = data.data.order;
const confirmationUrl = `${baseUrl}/${storeSlug}/checkout/confirmation?order=${order.id}&token=${encodeURIComponent(order.accessToken)}`;
const confirmationResponse = await fetch(confirmationUrl);
if (!confirmationResponse.ok) {
  console.error("E9 FAILED: confirmation page is not accessible", confirmationResponse.status);
  process.exit(1);
}

if (process.env.STORE_OWNER_COOKIE) {
  const adminResponse = await fetch(`${baseUrl}/api/store/orders?limit=100`, {
    headers: { Cookie: process.env.STORE_OWNER_COOKIE },
  });
  const adminData = await adminResponse.json().catch(() => null);
  const visible = adminResponse.ok && adminData?.success && adminData.orders?.some((candidate) => candidate.id === order.id);
  if (!visible) {
    console.error("E9 FAILED: created order was not visible to store owner", adminResponse.status, adminData);
    process.exit(1);
  }
  console.log("E9 PASS: order visible to store owner API");
} else {
  console.log("E9 NOTE: STORE_OWNER_COOKIE not supplied; admin visibility was not live-tested.");
}

console.log(`E9 PASS: ${order.orderNumber} created; total=${order.totalAmount}`);
console.log(`Confirmation: ${confirmationUrl}`);
