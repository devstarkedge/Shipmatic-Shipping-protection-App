// app/routes/apps.shipment.updatePrice.jsx
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export async function action({ request }) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  try {
    // ✅ Use public authentication for storefront calls
    const { session } = await authenticate.public.appProxy(request);
    const shop = session.shop;
    const accessToken = session.accessToken;

    const body = await request.json();
    let { product_id, variant_id, matchedPrice } = body;

    variant_id = variant_id?.split("/").pop();

    console.log("🔹 Received from storefront:", { product_id, variant_id, matchedPrice, shop });

    // ✅ Update the product variant price
    const response = await fetch(
      `https://${shop}/admin/api/2024-07/variants/${variant_id}.json`,
      {
        method: "PUT",
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          variant: { id: variant_id, price: matchedPrice },
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Shopify API Error:", result);
      return json({ success: false, error: result.errors }, { status: 400, headers });
    }

    console.log("✅ Price updated to:", result.variant?.price);
    return json({ success: true, variant: result.variant }, { headers });
  } catch (error) {
    console.error("❌ updatePrice failed:", error);
    return json({ success: false, error: error.message }, { status: 500, headers });
  }
}

export function loader() {
  return json({ message: "Method Not Allowed" }, { status: 405 });
}
