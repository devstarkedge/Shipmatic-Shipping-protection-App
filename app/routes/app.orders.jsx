import React from "react";
import {
  Page,
  Layout,
  Text,
  BlockStack,
  Card,
  InlineGrid,
  Button,
  Divider
} from "@shopify/polaris";
import DateRangePicker from "../components/DateRangePicker";
import styles from "./_index/styles.module.css";

const predefinedRanges = [
  { label: "Today", days: 0 },
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 60 days", days: 60 },
  { label: "Last 90 days", days: 90 },
  { label: "Last 120 days", days: 120 },
  { label: "Custom", days: null },
];

export default function OrdersPage() {
  const handleApply = ({ startDate, endDate, selectedRange }) => {
    // Implement apply logic here, e.g., filter orders by date range
    console.log("Applied date range:", { startDate, endDate, selectedRange });
  };

  return (
    <div className={styles.protectionWidget}>
      <Page>
        <Layout>
          <Layout.Section>
            <BlockStack gap="400">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text as="h2" variant="headingLg">
                  Orders
                </Text>

                <DateRangePicker
                  onApply={handleApply}
                  initialRange={predefinedRanges[3]}
                  predefinedRanges={predefinedRanges}
                />
              </div>

              <Card roundedAbove="sm">
                <InlineGrid
                  gap="400"
                  columns={{ xs: 1, sm: 2, md: 3, lg: 3, xl: 3 }}
                >
                  <div className={styles.card}>
                    <BlockStack gap="400">
                      <Text as="h2" variant="headingMd" fontWeight="bold">
                        Protected orders
                      </Text>

                      <InlineGrid>
                        <Text as="h2" variant="headingMd" fontWeight="bold">
                          8
                        </Text>
                      </InlineGrid>
                    </BlockStack>
                  </div>

                  <div className={styles.card}>
                    <BlockStack gap="400">
                      <Text as="h2" variant="headingMd" fontWeight="bold">
                        Average protection paid
                      </Text>

                      <InlineGrid>
                        <Text as="h2" variant="headingMd" fontWeight="bold">
                          €20.00 EUR
                        </Text>
                      </InlineGrid>
                    </BlockStack>
                  </div>

                  <div className={styles.card}>
                    <BlockStack gap="400">
                      <Text as="h2" variant="headingMd" fontWeight="bold">
                        Orders with protection
                      </Text>

                      <InlineGrid>
                        <Text as="h2" variant="headingMd" fontWeight="bold">
                          50%
                        </Text>
                      </InlineGrid>
                    </BlockStack>
                  </div>
                </InlineGrid>
              </Card>

              <Card>
                <div style={{ display: "flex", gap: "5px", paddingBottom: "15px" }}>
                  <Button variant="tertiary">All (3)</Button>
                  <Button variant="tertiary">Protected (1)</Button>
                </div>

                  <Divider />
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </Page>
    </div>
  );
}
