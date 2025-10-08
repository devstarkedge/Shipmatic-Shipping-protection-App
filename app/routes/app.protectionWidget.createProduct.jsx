import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }) => {
  console.log("CreateProduct action called!");
  console.log("Request method:", request.method);
  console.log("Request URL:", request.url);
  await authenticate.admin(request);

  const formData = await request.formData();
  const widgetData = {
    selectedPricingOptions: JSON.parse(
      formData.get("selectedPricingOptions") || "[]",
    ),
    isWidgetPublished: formData.get("isWidgetPublished") === "true",
    selectedWidgetOptions: JSON.parse(
      formData.get("selectedWidgetOptions") || "[]",
    ),
    selectedVisiblityOptions: JSON.parse(
      formData.get("selectedVisiblityOptions") || "[]",
    ),
    selectedButtonOptions: JSON.parse(
      formData.get("selectedButtonOptions") || "[]",
    ),
    pricingValue: formData.get("pricingValue"),
    selectedIconIndex: parseInt(formData.get("selectedIconIndex") || "0"),
    iconSize: parseInt(formData.get("iconSize") || "40"),
    iconCornerRadius: parseInt(formData.get("iconCornerRadius") || "0"),
    widgetBorderSize: parseInt(formData.get("widgetBorderSize") || "0"),
    widgetCornerRadius: parseInt(formData.get("widgetCornerRadius") || "0"),
    widgetVerticalPadding: parseInt(
      formData.get("widgetVerticalPadding") || "0",
    ),
    widgetHorizontalPadding: parseInt(
      formData.get("widgetHorizontalPadding") || "0",
    ),
    colorStates: JSON.parse(formData.get("colorStates") || "{}"),
    tiers: JSON.parse(formData.get("tiers") || "{}"),
    addonTitle: formData.get("addonTitle"),
    enabledDescription: formData.get("enabledDescription"),
    disabledDescription: formData.get("disabledDescription"),
    minimumCharge: formData.get("minimumCharge"),
    incrementAmount: formData.get("incrementAmount"),
  };

  console.log("Received widget data:", widgetData);

  const { admin, session } = await authenticate.admin(request);

  // Get selected icon URL from widgetIcons array
  const widgetIcons = [
    "https://2766624.fs1.hubspotusercontent-na1.net/hubfs/2766624/Shipmatic/icon1.png",
    "https://2766624.fs1.hubspotusercontent-na1.net/hubfs/2766624/Shipmatic/icon2.png",
    "https://2766624.fs1.hubspotusercontent-na1.net/hubfs/2766624/Shipmatic/icon3.png",
    "https://2766624.fs1.hubspotusercontent-na1.net/hubfs/2766624/Shipmatic/icon4.png",
  ];
  const selectedIconUrl =
    widgetIcons[widgetData.selectedIconIndex] || widgetIcons[0];

  try {
    // Calculate price based on pricing options
    let price = "0";
    if (widgetData.selectedPricingOptions.includes("percentage")) {
      price = widgetData.pricingValue || "0";
    } else if (widgetData.selectedPricingOptions.includes("fixed")) {
      price = widgetData.pricingValue || "0";
    }

    // Check if shipping protection product already exists
    const productTitle = "Shipping Protections";
    const productDescription =
      widgetData.enabledDescription ||
      "Protect your order from damage, loss, or theft.";

    const findRes = await admin.graphql(`#graphql
      query {
        products(first: 1, query: "title:${productTitle}") {
          edges {
            node {
              id
              title
              media(first: 10) {
                edges {
                  node {
                    id
                    ... on MediaImage {
                      image {
                        url
                      }
                    }
                  }
                }
              }
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

      // Delete existing images
      for (const mediaEdge of product.media.edges) {
        const mediaId = mediaEdge.node.id;
        console.log("Deleting existing product media:", mediaId);
        await admin.graphql(`#graphql
          mutation {
            productDeleteMedia(
              productId: "${product.id}",
              mediaIds: ["${mediaId}"]
            ) {
              deletedMediaIds
              userErrors {
                field
                message
              }
            }
          }`);
      }
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
    console.log(
      "Variant update response:",
      JSON.stringify(updateVariantJson, null, 2),
    );

    if (
      updateVariantJson.data.productVariantsBulkUpdate.userErrors.length > 0
    ) {
      console.warn(
        "Warning: Could not update variant price:",
        updateVariantJson.data.productVariantsBulkUpdate.userErrors[0].message,
      );
      return {
        success: true,
        productId: product.id,
        variantId: variant.id,
        price: variant.price,
        title: product.title,
      };
    }

    const updatedVariant =
      updateVariantJson.data.productVariantsBulkUpdate.productVariants[0];

    // Add new product image
    console.log("Adding new product image from URL:", selectedIconUrl);
    const addImageRes = await admin.graphql(`#graphql
      mutation {
        productCreateMedia(
          productId: "${product.id}",
          media: {
            originalSource: "${selectedIconUrl}",
            mediaContentType: IMAGE
          }
        ) {
          media {
            id
            ... on MediaImage {
              image {
                url
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }`);

    const addImageJson = await addImageRes.json();
    if (addImageJson.data.productCreateMedia.userErrors.length > 0) {
      console.warn(
        "Warning: Could not add product image:",
        addImageJson.data.productCreateMedia.userErrors[0].message,
      );
    } else {
      console.log(
        "Added new product image:",
        addImageJson.data.productCreateMedia.media.id,
      );
    }
    // Get the publication ID for the Online Store
    const publicationsRes = await admin.graphql(`#graphql
      query {
        publications(first: 10) {
          edges {
            node {
              id
              name
            }
          }
        }
      }`);

    const publicationsJson = await publicationsRes.json();
    const onlineStorePublication =
      publicationsJson.data.publications.edges.find(
        (edge) => edge.node.name === "Online Store",
      );

    if (!onlineStorePublication) {
      console.error("Could not find Online Store publication");
      return {
        success: true,
        productId: product.id,
        variantId: updatedVariant.id,
        price: updatedVariant.price,
        title: product.title,
        published: false,
      };
    }

    const publicationId = onlineStorePublication.node.id;
    console.log("Publishing to publication:", publicationId);

    // Attempt to publish the product
    const publishRes = await admin.graphql(`#graphql
      mutation {
        productPublish(input: {
          id: "${product.id}",
          productPublications: [
            { publicationId: "${publicationId}" }
          ]
        }) {
          product {
            id
            title
          }
          userErrors {
            field
            message
          }
        }
      }`);

    const publishJson = await publishRes.json();
    const publishData = publishJson.data.productPublish;

    let published = false;
    if (publishData.userErrors.length > 0) {
      // Check if the error is because the product is already published
      const alreadyPublishedError = publishData.userErrors.some(
        (error) =>
          error.message.includes("already published") ||
          error.message.includes("is already published"),
      );

      if (alreadyPublishedError) {
        console.log("Product is already published");
        published = true;
      } else {
        console.error("Publish failed:", publishData.userErrors);
      }
    } else {
      console.log("Product published:", publishData.product.id);
      published = true;
    }

    // Save to database
    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        title: product.title,
        description: productDescription,
        price: updatedVariant.price,
        variantId: updatedVariant.id,
        imageUrl: selectedIconUrl,
        published: published,
        selectedPricingOptions: JSON.stringify(
          widgetData.selectedPricingOptions,
        ),
        isWidgetPublished: widgetData.isWidgetPublished,
        selectedWidgetOptions: JSON.stringify(widgetData.selectedWidgetOptions),
        selectedVisiblityOptions: JSON.stringify(
          widgetData.selectedVisiblityOptions,
        ),
        selectedButtonOptions: JSON.stringify(widgetData.selectedButtonOptions),
        pricingValue: widgetData.pricingValue,
        selectedIconIndex: widgetData.selectedIconIndex,
        iconSize: widgetData.iconSize,
        iconCornerRadius: widgetData.iconCornerRadius,
        widgetBorderSize: widgetData.widgetBorderSize,
        widgetCornerRadius: widgetData.widgetCornerRadius,
        widgetVerticalPadding: widgetData.widgetVerticalPadding,
        widgetHorizontalPadding: widgetData.widgetHorizontalPadding,
        colorStates: JSON.stringify(widgetData.colorStates),
        addonTitle: widgetData.addonTitle,
        enabledDescription: widgetData.enabledDescription,
        disabledDescription: widgetData.disabledDescription,
        minimumCharge: widgetData.minimumCharge,
        incrementAmount: widgetData.incrementAmount,
        fixedAdvanceSettings: JSON.stringify(widgetData.tiers),

      },
      create: {
        id: product.id,
        shop: session.shop,
        title: product.title,
        description: productDescription,
        price: updatedVariant.price,
        variantId: updatedVariant.id,
        imageUrl: selectedIconUrl,
        published: published,
        selectedPricingOptions: JSON.stringify(
          widgetData.selectedPricingOptions,
        ),
        isWidgetPublished: widgetData.isWidgetPublished,
        selectedWidgetOptions: JSON.stringify(widgetData.selectedWidgetOptions),
        selectedVisiblityOptions: JSON.stringify(
          widgetData.selectedVisiblityOptions,
        ),
        selectedButtonOptions: JSON.stringify(widgetData.selectedButtonOptions),
        pricingValue: widgetData.pricingValue,
        selectedIconIndex: widgetData.selectedIconIndex,
        iconSize: widgetData.iconSize,
        iconCornerRadius: widgetData.iconCornerRadius,
        widgetBorderSize: widgetData.widgetBorderSize,
        widgetCornerRadius: widgetData.widgetCornerRadius,
        widgetVerticalPadding: widgetData.widgetVerticalPadding,
        widgetHorizontalPadding: widgetData.widgetHorizontalPadding,
        colorStates: JSON.stringify(widgetData.colorStates),
        addonTitle: widgetData.addonTitle,
        enabledDescription: widgetData.enabledDescription,
        disabledDescription: widgetData.disabledDescription,
        minimumCharge: widgetData.minimumCharge,
        incrementAmount: widgetData.incrementAmount,
        fixedAdvanceSettings: JSON.stringify(widgetData.tiers),
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      productId: product.id,
      variantId: updatedVariant.id,
      price: updatedVariant.price,
      title: product.title,
      published: published,
    };
  } catch (error) {
    console.error("Error creating shipping protection product:", error);
    return { success: false, error: error.message };
  }
};
