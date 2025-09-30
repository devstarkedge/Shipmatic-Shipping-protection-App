import {
  BlockStack,
  Text,
  Card,
  RadioButton,
  TextField,
  Button,
  Icon,
  Badge,
} from "@shopify/polaris";
import { SearchIcon, XIcon } from "@shopify/polaris-icons";
import { useState, useCallback, useEffect, useRef } from "react";
import { useAppBridge, SaveBar } from "@shopify/app-bridge-react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";
import prisma from "../db.server";
import ProductTypeExclusionModal from "../components/ProductTypeExclusionModal";
import SkuExclusionModal from "../components/SkuExclusionModal";

export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  const response = await admin.graphql(`#graphql
    query {
      products(first: 250) {
        edges {
          node {
            productType
            variants(first: 3) {
              edges {
                node {
                  sku
                }
              }
            }
          }
        }
      }
    }`);

  const { data } = await response.json();

  const productTypes = data.products.edges
    .map((edge) => edge.node.productType)
    .filter((type) => type)
    .filter((type, index, arr) => arr.indexOf(type) === index);

  const skus = data.products.edges
    .map((edge) => edge.node.variants.edges[0]?.node.sku)
    .filter((sku) => sku)
    .filter((sku, index, arr) => arr.indexOf(sku) === index);

  const settings = await prisma.protection_settings.findUnique({
    where: { shop },
  });

  return { productTypes, skus, settings: settings || { fulfillmentRule: "first_item", productSKU: "Insure01", exclusionType: "product_type", exclusionValues: [] } };
}

export async function action({ request }) {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const fulfillmentRule = formData.get("fulfillmentRule");
  const productSKU = formData.get("productSKU");
  const exclusionType = formData.get("exclusionType");
  const exclusionValues = formData.get("exclusionValues");

  try {
    await prisma.protection_settings.upsert({
      where: { shop },
      update: {
        fulfillmentRule,
        productSKU,
        exclusionType,
        exclusionValues: JSON.parse(exclusionValues),
      },
      create: {
        shop,
        fulfillmentRule,
        productSKU,
        exclusionType,
        exclusionValues: JSON.parse(exclusionValues),
      },
    });

    return json({ success: true });
  } catch (error) {
    console.error("Error saving protection settings:", error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
}

export default function ProtectionSettings() {
  const shopify = useAppBridge();
  const { productTypes, skus, settings } = useLoaderData();

  const formattedProductTypes = productTypes.map((type) => ({
    id: type,
    label: type,
  }));
  const formattedSkus = skus.map((sku) => ({ id: sku, label: sku }));

  const [originalValues, setOriginalValues] = useState({
    fulfillmentRule: settings.fulfillmentRule,
    productSKU: settings.productSKU,
    exclusionType: settings.exclusionType,
    excludedProductTypes: settings.exclusionValues || [],
    excludedSkus: settings.exclusionValues || [],
  });

  const [fulfillmentRule, setFulfillmentRule] = useState(settings.fulfillmentRule);
  const [productSKU, setProductSKU] = useState(settings.productSKU);
  const [exclusionType, setExclusionType] = useState(settings.exclusionType);

  const [isDirty, setIsDirty] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [excludedProductTypes, setExcludedProductTypes] = useState(settings.exclusionValues || []);
  const [excludedSkus, setExcludedSkus] = useState(settings.exclusionValues || []);

  const fetcher = useFetcher();
  const saveBarShownRef = useRef(false);

  const handleSave = useCallback(() => {
    const exclusionValues =
      exclusionType === "product_type" ? excludedProductTypes : excludedSkus;
    const formData = new FormData();
    formData.append("fulfillmentRule", fulfillmentRule);
    formData.append("productSKU", productSKU);
    formData.append("exclusionType", exclusionType);
    formData.append("exclusionValues", JSON.stringify(exclusionValues));

    fetcher.submit(formData, { method: "post" });
    saveBarShownRef.current = false;
  }, [
    fulfillmentRule,
    productSKU,
    exclusionType,
    excludedProductTypes,
    excludedSkus,
    fetcher,
  ]);

  const handleRemoveExclusion = useCallback((idToRemove) => {
    if (exclusionType === "product_type") {
      setExcludedProductTypes((prev) => prev.filter((id) => id !== idToRemove));
    } else {
      setExcludedSkus((prev) => prev.filter((id) => id !== idToRemove));
    }
  }, [exclusionType]);

  const handleDiscard = useCallback(() => {
    console.log("discard");
    setFulfillmentRule(originalValues.fulfillmentRule);
    setProductSKU(originalValues.productSKU);
    setExclusionType(originalValues.exclusionType);
    setExcludedProductTypes(originalValues.excludedProductTypes || []);
    setExcludedSkus(originalValues.excludedSkus || []);
    setIsDirty(false);
    shopify.saveBar?.hide("protection-save-bar");
    saveBarShownRef.current = false;
  }, [originalValues, shopify]);

  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.success) {
        setOriginalValues({
          fulfillmentRule,
          productSKU,
          exclusionType,
          excludedProductTypes,
          excludedSkus,
        });
        setIsDirty(false);
        shopify.saveBar?.hide("protection-save-bar");
        saveBarShownRef.current = false;
      } else {
        console.error("Save failed:", fetcher.data.error);
      }
    }
  }, [
    fetcher.data,
    fulfillmentRule,
    productSKU,
    exclusionType,
    excludedProductTypes,
    excludedSkus,
    shopify,
  ]);

  useEffect(() => {
    const hasChanges =
      fulfillmentRule !== originalValues.fulfillmentRule ||
      productSKU !== originalValues.productSKU ||
      exclusionType !== originalValues.exclusionType ||
      JSON.stringify(excludedProductTypes) !==
      JSON.stringify(originalValues.excludedProductTypes || []) ||
      JSON.stringify(excludedSkus) !==
      JSON.stringify(originalValues.excludedSkus || []);

    setIsDirty(hasChanges);

    if (hasChanges && !saveBarShownRef.current) {
      shopify.saveBar?.show("protection-save-bar");
      saveBarShownRef.current = true;
    } else if (!hasChanges) {
      shopify.saveBar?.hide("protection-save-bar");
      saveBarShownRef.current = false;
    }
  }, [
    fulfillmentRule,
    productSKU,
    exclusionType,
    excludedProductTypes,
    excludedSkus,
    originalValues,
    shopify,
  ]);

  const handleBrowseClick = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleAddProductTypes = useCallback(
    (selectedTypes) => {
      setExcludedProductTypes(selectedTypes);
    },
    [],
  );

  const handleAddSkus = useCallback(
    (selectedSkus) => {
      setExcludedSkus(selectedSkus);
    },
    [],
  );

  return (
    <>
      {/* App Bridge SaveBar */}
      <SaveBar id="protection-save-bar" open={isDirty}>
        <button variant="primary" onClick={handleSave}>Save</button>
        <button onClick={handleDiscard}>Discard</button>
      </SaveBar>

      <BlockStack gap="600">
        {/* <Card>
          <BlockStack gap="400">
            <BlockStack gap="100">
              <Text as="h2" variant="headingMd">
                Fulfillment rules
              </Text>
              <Text as="p" tone="subdued">
                Choose when to mark the shipping protection product as
                fulfilled.
              </Text>
            </BlockStack>

            <BlockStack gap="100">
              <RadioButton
                label="When any of the order item is fulfilled"
                checked={fulfillmentRule === "first_item"}
                id="first_item"
                name="fulfillment_rule"
                onChange={() => setFulfillmentRule("first_item")}
              />
              <RadioButton
                label="When the entire order is fulfilled"
                checked={fulfillmentRule === "entire_order"}
                id="entire_order"
                name="fulfillment_rule"
                onChange={() => setFulfillmentRule("entire_order")}
              />
              <RadioButton
                label="Immediately after order is purchased"
                checked={fulfillmentRule === "immediately"}
                id="immediately"
                name="fulfillment_rule"
                onChange={() => setFulfillmentRule("immediately")}
              />
            </BlockStack>
          </BlockStack>
        </Card> */}

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Product SKU
            </Text>
            <TextField
              value={productSKU}
              onChange={(val) => setProductSKU(val)}
              showCharacterCount
              maxLength={255}
            />
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            <BlockStack gap="100">
              <Text as="h2" variant="headingMd">
                Exclusions
              </Text>

              <Text as="p" tone="subdued">
                Prevent widget display on specific products.
              </Text>
            </BlockStack>

            <BlockStack gap="100">
              <RadioButton
                label="Exclude by product type"
                checked={exclusionType === "product_type"}
                id="product_type"
                name="exclusion_type"
                onChange={() => setExclusionType("product_type")}
              />
              <RadioButton
                label="Exclude by SKU"
                checked={exclusionType === "sku"}
                id="sku"
                name="exclusion_type"
                onChange={() => setExclusionType("sku")}
              />
            </BlockStack>

            <div
              style={{
                display: "flex",
                gap: "7px",
                justifyContent: "space-between",
              }}
            >
              <div style={{ flexGrow: "1" }}>
                <TextField
                  value=""
                  onFocus={() => setIsModalOpen(true)}
                  placeholder={
                    exclusionType === "sku"
                      ? "Search specific SKUs"
                      : "Search specific product types"
                  }
                  prefix={<Icon source={SearchIcon} />}
                />
              </div>

              <Button onClick={handleBrowseClick}>Browse</Button>
            </div>

            {(() => {
              const currentExclusions = exclusionType === "product_type" ? excludedProductTypes : excludedSkus;
              const currentList = exclusionType === "product_type" ? formattedProductTypes : formattedSkus;
              if (currentExclusions.length > 0) {
                return (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", }}>
                    {currentExclusions.map((id) => {
                      const item = currentList.find((item) => item.id === id);
                      if (!item) return null;
                      return (
                        <Badge key={id} tone="subdued">
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", width: "100%" }}>
                            <Text variant="bodySm" fontWeight="medium">{item.label}</Text>
                            <div
                              style={{ marginLeft: "auto", cursor: "pointer" }}
                              onClick={() => handleRemoveExclusion(id)}
                            >
                              <Icon
                                source={XIcon}
                                tone="subdued"
                                style={{ width: "12px", height: "12px" }}
                              />
                            </div>
                          </div>
                        </Badge>
                      );
                    })}
                  </div>
                );
              }
              return null;
            })()}
          </BlockStack>
        </Card>
      </BlockStack>

      {/* Conditional Modal */}
      {exclusionType === "product_type" ? (
        <ProductTypeExclusionModal
          open={isModalOpen}
          onClose={handleModalClose}
          onAdd={handleAddProductTypes}
          initialSelectedTypes={excludedProductTypes}
          initialSearchValue=""
          productTypes={formattedProductTypes}
        />
      ) : (
        <SkuExclusionModal
          open={isModalOpen}
          onClose={handleModalClose}
          onAdd={handleAddSkus}
          initialSelectedSkus={excludedSkus}
          initialSearchValue=""
          skus={formattedSkus}
        />
      )}
    </>
  );
}
