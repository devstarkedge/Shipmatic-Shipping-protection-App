import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  LegacyCard,
  BlockStack,
  Text,
  Badge,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  try {
    // Check if this is an API request (has shop parameter) or a page request
    const url = new URL(request.url);
    const shop = url.searchParams.get('shop');

    if (shop) {
      // This is an API request from the extension
      const product = await prisma.product.findFirst({
        where: {
          shop: shop,
        },
      });

      if (!product) {
        return json({
          success: false,
          error: "No shipping protection product found for this shop"
        }, { status: 404 });
      }

      return json({
        success: true,
        data: {
          id: product.id,
          title: product.title,
          description: product.description,
          price: product.price,
          variantId: product.variantId,
          imageUrl: product.imageUrl,
          published: product.published,
          selectedPricingOptions: product.selectedPricingOptions ? JSON.parse(product.selectedPricingOptions) : [],
          isWidgetPublished: product.isWidgetPublished,
          selectedWidgetOptions: product.selectedWidgetOptions ? JSON.parse(product.selectedWidgetOptions) : [],
          selectedVisiblityOptions: product.selectedVisiblityOptions ? JSON.parse(product.selectedVisiblityOptions) : [],
          selectedButtonOptions: product.selectedButtonOptions ? JSON.parse(product.selectedButtonOptions) : [],
          pricingValue: product.pricingValue,
          selectedIconIndex: product.selectedIconIndex,
          iconSize: product.iconSize,
          iconCornerRadius: product.iconCornerRadius,
          widgetBorderSize: product.widgetBorderSize,
          widgetCornerRadius: product.widgetCornerRadius,
          widgetVerticalPadding: product.widgetVerticalPadding,
          widgetHorizontalPadding: product.widgetHorizontalPadding,
          colorStates: product.colorStates ? JSON.parse(product.colorStates) : {},
          addonTitle: product.addonTitle,
          enabledDescription: product.enabledDescription,
          disabledDescription: product.disabledDescription,
          minimumCharge: product.minimumCharge,
          incrementAmount: product.incrementAmount,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        }
      });
    } else {
      // This is a page request from admin panel
      await authenticate.admin(request);
      const { session } = await authenticate.admin(request);

      const product = await prisma.product.findFirst({
        where: {
          shop: session.shop,
        },
      });

      return json({ product });
    }
  } catch (error) {
    console.error("Error fetching product data:", error);
    return json({
      success: false,
      error: "Failed to fetch product data"
    }, { status: 500 });
  }
};


