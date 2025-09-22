import {
  Page,
  Layout,
  BlockStack,
  Text,
  Card,
  RadioButton,
  TextField,
  Button,
  OptionList,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import styles from "./_index/styles.module.css";

export default function settings() {
  const [fulfillmentRule, setFulfillmentRule] = useState("first_item");

  const [productSKU, setProductSKU] = useState("Insure01");

  const [exclusionType, setExclusionType] = useState("product_type");
  const [searchValue, setSearchValue] = useState("");
  const [selected, setSelected] = useState(["claim_page"]);

  const handleFulfillmentRuleChange = useCallback(
    (_checked, newValue) => setFulfillmentRule(newValue),
    [],
  );

  const handleProductSKUChange = useCallback(
    (value) => setProductSKU(value),
    [],
  );

  const handleExclusionTypeChange = useCallback(
    (_checked, newValue) => setExclusionType(newValue),
    [],
  );

  const handleSearchChange = useCallback((value) => setSearchValue(value), []);

  return (
    <Page title="Settings">
      <Layout>
        {/* Sidebar Options */}
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <OptionList
                title=""
                titleHidden
                options={[
                  {
                    label: "Claim page",
                    value: "claim_page",
                  },
                  {
                    label: "Claim portal preference",
                    value: "claim_portal_preference",
                  },
                  {
                    label: "Notification",
                    value: "notification",
                  },
                  {
                    label: "Language preference",
                    value: "language_preference",
                  },
                  {
                    label: "Feedback",
                    value: "feedback",
                  },
                ]}
                selected={selected}
                onChange={setSelected}
              />
            </BlockStack>
          </Card>
        </Layout.Section>
        

        {/* Main Content */}
        <Layout.Section variant="twoThird">
          <BlockStack gap="600">
            <Card>
              <BlockStack gap="400">
                <div>
                  <Text as="h2" variant="headingMd">
                    Fulfillment rules
                  </Text>
                  <Text as="p" tone="subdued">
                    Choose when to mark the shipping protection product as
                    fulfilled.
                  </Text>
                </div>

                <BlockStack gap="200">
                  <RadioButton
                    label="When the first order item is fulfilled"
                    checked={fulfillmentRule === "first_item"}
                    id="first_item"
                    name="fulfillment_rule"
                    onChange={handleFulfillmentRuleChange}
                  />
                  <RadioButton
                    label="When the entire order is fulfilled"
                    checked={fulfillmentRule === "entire_order"}
                    id="entire_order"
                    name="fulfillment_rule"
                    onChange={handleFulfillmentRuleChange}
                  />
                  <RadioButton
                    label="Immediately after order is purchased"
                    checked={fulfillmentRule === "immediately"}
                    id="immediately"
                    name="fulfillment_rule"
                    onChange={handleFulfillmentRuleChange}
                  />
                </BlockStack>
              </BlockStack>
            </Card>

            {/* Product SKU Section */}
            <Card>
              <BlockStack gap="400">
                <div>
                  <Text as="h2" variant="headingMd">
                    Product SKU
                  </Text>
                  <Text as="p" tone="subdued">
                    Edit the shipping protection product SKU.
                  </Text>
                </div>

                <TextField
                  label=""
                  labelHidden
                  value={productSKU}
                  onChange={handleProductSKUChange}
                  maxLength={255}
                  showCharacterCount
                />
              </BlockStack>
            </Card>

            {/* Exclusions Section */}
            <Card>
              <BlockStack gap="400">
                <div>
                  <Text as="h2" variant="headingMd">
                    Exclusions
                  </Text>
                  <Text as="p" tone="subdued">
                    Prevent widget display on specific products.
                  </Text>
                </div>

                <BlockStack gap="300">
                  <RadioButton
                    label="Exclude by product type"
                    checked={exclusionType === "product_type"}
                    id="product_type"
                    name="exclusion_type"
                    onChange={handleExclusionTypeChange}
                  />
                  <RadioButton
                    label="Exclude by SKU"
                    checked={exclusionType === "sku"}
                    id="sku"
                    name="exclusion_type"
                    onChange={handleExclusionTypeChange}
                  />

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{flexGrow: "1"}}>
                      <TextField
                        label=""
                        labelHidden
                        fullWidth
                        value={searchValue}
                        onChange={handleSearchChange}
                        placeholder="Search specific product types"
                      />
                    </div>
                    <Button size="medium">Browse</Button>
                  </div>
                </BlockStack>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
