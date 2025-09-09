import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;

export async function createOrUpdateProduct(request, title, price, imageUrl) {
  const { admin, session } = await authenticate.admin(request);

  // Find existing product by title
  const findRes = await admin.graphql(`#graphql
    query {
      products(first: 1, query: "title: ${title}") {
        edges { node { id title variants(first: 1) { edges { node { id price } } } } }
      }
    }`);
  const findJson = await findRes.json();
  const existingProduct = findJson.data.products.edges[0]?.node;

  let productId, variantId;

  if (existingProduct) {
    productId = existingProduct.id;
    variantId = existingProduct.variants.edges[0].node.id;
  } else {
    // Create new product
    const createRes = await admin.graphql(`#graphql
      mutation {
        productCreate(input: {title: "${title}"}) {
          product { id variants(first: 1) { edges { node { id } } } }
        }
      }`);
    const createJson = await createRes.json();
    productId = createJson.data.productCreate.product.id;
    variantId = createJson.data.productCreate.product.variants.edges[0].node.id;
  }

  // Update price
  const updatePriceRes = await admin.graphql(`#graphql
    mutation {
      productVariantsBulkUpdate(
        productId: "${productId}",
        variants: [{ id: "${variantId}", price: "${price}" }]
      ) {
        productVariants { id price }
      }
    }`);
  const updatePriceJson = await updatePriceRes.json();

  // Update image if provided
  if (imageUrl) {
    const updateImageRes = await admin.graphql(`#graphql
      mutation {
        productUpdate(input: {
          id: "${productId}",
          images: [{ src: "${imageUrl}" }]
        }) {
          product { id images { edges { node { src } } } }
        }
      }`);
    const updateImageJson = await updateImageRes.json();
  }

  // Save to database
  await prisma.product.upsert({
    where: { id: productId },
    update: {
      title: title,
      price: updatePriceJson.data.productVariantsBulkUpdate.productVariants[0].price,
      variantId: variantId,
      imageUrl: imageUrl || null,
      published: false,
    },
    create: {
      id: productId,
      shop: session.shop,
      title: title,
      price: updatePriceJson.data.productVariantsBulkUpdate.productVariants[0].price,
      variantId: variantId,
      imageUrl: imageUrl || null,
      published: false,
    },
  });

  return {
    productId,
    price: updatePriceJson.data.productVariantsBulkUpdate.productVariants[0].price
  };
}
