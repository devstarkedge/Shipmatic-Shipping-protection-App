import { useFetcher } from "@remix-run/react";
import { Page, Button, Text } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
 
export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};


 
export const action = async ({ request, title }) => {

    const title = "Akshay";
  const { admin } = await authenticate.admin(request);
 
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
   
    const createRes = await admin.graphql(`#graphql
      mutation {
        productCreate(input: {title: "Akshay"}) {
          product { id variants(first: 1) { edges { node { id } } } }
        }
      }`);
    const createJson = await createRes.json();
    productId = createJson.data.productCreate.product.id;
    variantId = createJson.data.productCreate.product.variants.edges[0].node.id;
  }
 
 
  const updateRes = await admin.graphql(`#graphql
    mutation {
      productVariantsBulkUpdate(
        productId: "${productId}",
        variants: [{ id: "${variantId}", price: "150.00" }]
      ) {
        productVariants { id price }
      }
    }`);
  const updateJson = await updateRes.json();
 
  return { productId, price: updateJson.data.productVariantsBulkUpdate.productVariants[0].price };
};
 
export default function Index() {
  const fetcher = useFetcher();
  const isLoading = fetcher.state !== "idle";
 
  return (
    <Page title="Create/Update Product">
      <Button primary onClick={() => fetcher.submit({}, { method: "POST" })} loading={isLoading}>
        Create/Update
      </Button>
 
      {fetcher.data && (
        <Text as="p" variant="bodyMd" tone="success">
          Product saved! <br />
          ID: {fetcher.data.productId.replace("gid://shopify/Product/", "")} <br />
          Price: ${fetcher.data.price}
        </Text>
      )}
    </Page>
  );
}