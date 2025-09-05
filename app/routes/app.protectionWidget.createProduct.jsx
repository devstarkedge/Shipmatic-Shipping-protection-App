import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  console.log("CreateProduct action called!");
  console.log("Request method:", request.method);
  console.log("Request URL:", request.url);
  await authenticate.admin(request);

  const formData = await request.formData();
  const widgetData = {
    selectedPricingOptions: JSON.parse(formData.get("selectedPricingOptions") || "[]"),
    isWidgetPublished: formData.get("isWidgetPublished") === "true",
    selectedWidgetOptions: JSON.parse(formData.get("selectedWidgetOptions") || "[]"),
    selectedVisiblityOptions: JSON.parse(formData.get("selectedVisiblityOptions") || "[]"),
    selectedButtonOptions: JSON.parse(formData.get("selectedButtonOptions") || "[]"),
    pricingValue: formData.get("pricingValue"),
    selectedIconIndex: parseInt(formData.get("selectedIconIndex") || "0"),
    iconSize: parseInt(formData.get("iconSize") || "40"),
    iconCornerRadius: parseInt(formData.get("iconCornerRadius") || "0"),
    widgetBorderSize: parseInt(formData.get("widgetBorderSize") || "0"),
    widgetCornerRadius: parseInt(formData.get("widgetCornerRadius") || "0"),
    widgetVerticalPadding: parseInt(formData.get("widgetVerticalPadding") || "0"),
    widgetHorizontalPadding: parseInt(formData.get("widgetHorizontalPadding") || "0"),
    colorStates: JSON.parse(formData.get("colorStates") || "{}"),
    addonTitle: formData.get("addonTitle"),
    enabledDescription: formData.get("enabledDescription"),
    disabledDescription: formData.get("disabledDescription"),
    minimumCharge: formData.get("minimumCharge"),
    incrementAmount: formData.get("incrementAmount"),
  };

  console.log("Received widget data:", widgetData);

  const { admin } = await authenticate.admin(request);

  try {
    // Calculate price based on pricing options
    let price = "0";
    if (widgetData.selectedPricingOptions.includes("percentage")) {
      price = widgetData.pricingValue || "0";
    } else if (widgetData.selectedPricingOptions.includes("fixed")) {
      price = widgetData.pricingValue || "0";
    }

    // Check if shipping protection product already exists
    const productTitle =  "Shipping Protections";
    const productDescription = widgetData.enabledDescription || "Protect your order from damage, loss, or theft.";

    const findRes = await admin.graphql(`#graphql
      query {
        products(first: 1, query: "title:${productTitle}") {
          edges {
            node {
              id
              title
              variants(first: 1) {
                edges {
                  node {
                    id
                    price
                  }
                }
              }
            }
          }
        }
      }`);

    const findJson = await findRes.json();
    let product, variant;

    if (findJson.data.products.edges.length > 0) {
      // Product exists, use it
      product = findJson.data.products.edges[0].node;
      variant = product.variants.edges[0].node;
      console.log("Found existing shipping protection product:", product.id);
    } else {
      // Create new product
      const createProductRes = await admin.graphql(`#graphql
        mutation {
          productCreate(input: {
            title: "${productTitle}",
            descriptionHtml: "${productDescription}",
            productType: "Shipping Protection",
            tags: ["shipping-protection", "shipmatic"]
          }) {
            product {
              id
              title
              variants(first: 1) {
                edges {
                  node {
                    id
                    price
                  }
                }
              }
            }
          }
        }`);

      const createProductJson = await createProductRes.json();

      if (createProductJson.errors) {
        throw new Error(createProductJson.errors[0].message);
      }

      product = createProductJson.data.productCreate.product;
      variant = product.variants.edges[0].node;
      console.log("Created new shipping protection product:", product.id);
    }

    // Update the variant price using GraphQL (bulk update)
    console.log("Updating variant price to:", price);
    console.log("Variant ID:", variant.id);
    console.log("Current variant price:", variant.price);

    const updateVariantRes = await admin.graphql(`#graphql
      mutation {
        productVariantsBulkUpdate(
          productId: "${product.id}",
          variants: [{ id: "${variant.id}", price: "${price}" }]
        ) {
          productVariants { id price }
          userErrors {
            field
            message
          }
        }
      }`);

    const updateVariantJson = await updateVariantRes.json();
    console.log("Variant update response:", JSON.stringify(updateVariantJson, null, 2));

    if (updateVariantJson.data.productVariantsBulkUpdate.userErrors.length > 0) {
      console.warn("Warning: Could not update variant price:", updateVariantJson.data.productVariantsBulkUpdate.userErrors[0].message);
      return {
        success: true,
        productId: product.id,
        variantId: variant.id,
        price: variant.price,
        title: product.title
      };
    }

    const updatedVariant = updateVariantJson.data.productVariantsBulkUpdate.productVariants[0];

    return {
      success: true,
      productId: product.id,
      variantId: updatedVariant.id,
      price: updatedVariant.price,
      title: product.title
    };
  } catch (error) {
    console.error("Error creating shipping protection product:", error);
    return { success: false, error: error.message };
  }
};
