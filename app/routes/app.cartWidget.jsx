import { json } from "@remix-run/node";
import prisma from "../db.server";

export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");

    // CORS headers for proxy requests
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    if (!shop) {
      return json(
        { success: false, error: "Missing shop parameter" },
        { status: 400, headers }
      );
    }

    // Fetch product/widget config for this shop from DB
    const product = await prisma.product.findFirst({
      where: { shop },
    });

    if (!product) {
      return json(
        { success: false, error: "No widget data found for this shop" },
        { status: 404, headers }
      );
    }

    const widget = {
      id: product.id,
      title: product.title,
      description: product.description,
      disabledDescription: product.disabledDescription,
      variantId: product.variantId,
      pricingValue: product.pricingValue,
      selectedPricingOptions: product.selectedPricingOptions
        ? JSON.parse(product.selectedPricingOptions)
        : [],
      selectedVisiblityOptions: product.selectedVisiblityOptions
        ? JSON.parse(product.selectedVisiblityOptions)
        : [],
      selectedButtonOptions: product.selectedButtonOptions
        ? JSON.parse(product.selectedButtonOptions)
        : [],
      minimumCharge: product.minimumCharge,
      incrementAmount: product.incrementAmount,
      widgetBorderSize: product.widgetBorderSize,
      widgetCornerRadius: product.widgetCornerRadius,
      widgetVerticalPadding: product.widgetVerticalPadding,
      widgetHorizontalPadding: product.widgetHorizontalPadding,
      iconSize: product.iconSize,
      iconCornerRadius: product.iconCornerRadius,
      colorStates: product.colorStates ? JSON.parse(product.colorStates) : {},
      imageUrl: product.imageUrl,
      isWidgetPublished: product.isWidgetPublished,
      addonTitle: product.addonTitle,
      enabledDescription: product.enabledDescription,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    return json({ success: true, widget }, { headers });
  } catch (err) {
    console.error("cartWidget loader error:", err);
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    };
    return json(
      { success: false, error: "Failed to load widget" },
      { status: 500, headers }
    );
  }
}

// Handle OPTIONS requests (CORS preflight)
export async function action({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}
