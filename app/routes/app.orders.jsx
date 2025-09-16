import React, { useState, useCallback } from "react";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  BlockStack,
  Card,
  InlineGrid,
  Button,
  Divider,
  DataTable,
  TextField,
  Icon,
  Popover,
  Checkbox,
  RadioButton,
  Link,
} from "@shopify/polaris";
import DateRangePicker from "../components/DateRangePicker";
import styles from "./_index/styles.module.css";

import {
  SearchIcon,
  SortIcon,
  CaretUpIcon,
  CaretDownIcon,
} from "@shopify/polaris-icons";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const query = `
    query getOrders($first: Int!) {
      orders(first: $first, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id
            name
            createdAt
            displayFulfillmentStatus
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            customer {
              email
            }
            
            lineItems(first: 20) {
              edges {
                node {
                  title
                  quantity
                  originalTotalSet {
                    shopMoney {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const variables = { first: 50 };
  const response = await admin.graphql(query, { variables });
  const data = await response.json();

  // Only return orders that have BOTH "Shipping Protections" + another product
  const filteredOrders = data.data.orders.edges
    .map((edge) => edge.node)
    .filter((order) => {
      const titles = order.lineItems.edges.map((li) => li.node.title);
      const hasShippingProtection = titles.includes("Shipping Protections");
      const hasOtherProduct = titles.some((t) => t !== "Shipping Protections");
      return hasShippingProtection && hasOtherProduct;
    });

  return json({ orders: filteredOrders });
};

const predefinedRanges = [
  { label: "Today", days: 0 },
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 60 days", days: 60 },
  { label: "Last 90 days", days: 90 },
  { label: "Last 120 days", days: 120 },
  { label: "Custom", days: null },
];

const fulfillmentStatusOptions = [
  { label: "Fulfilled", value: "fulfilled", count: 5 },
  { label: "Partially fulfilled", value: "partially_fulfilled", count: 0 },
  { label: "Unfulfilled", value: "unfulfilled", count: 2 },
  { label: "Scheduled", value: "scheduled", count: 0 },
  { label: "On hold", value: "on_hold", count: 0 },
];

const sortOptions = [
  { label: "Order number", value: "order_number" },
  { label: "Protection fee", value: "protection_fee" },
  { label: "Order paid", value: "order_paid" },
];

export default function OrdersPage() {
  const { orders } = useLoaderData();

  const handleApply = ({ startDate, endDate, selectedRange }) => {
    console.log("Applied date range:", { startDate, endDate, selectedRange });
  };

  const fulfillmentDisplay = (status) =>
    status?.replaceAll("_", " ").toLowerCase() || "Unfulfilled";

  const [fulfillmentPopoverActive, setFulfillmentPopoverActive] =
    useState(false);
  const [sortPopoverActive, setSortPopoverActive] = useState(false);

  const [selectedFulfillmentStatuses, setSelectedFulfillmentStatuses] =
    useState([]);
  const [selectedSortOption, setSelectedSortOption] = useState("order_number");
  const [sortDirection, setSortDirection] = useState("ascending");
  const [searchQuery, setSearchQuery] = useState("");

  const toggleFulfillmentPopoverActive = useCallback(
    () => setFulfillmentPopoverActive((active) => !active),
    [],
  );

  const toggleSortPopoverActive = useCallback(
    () => setSortPopoverActive((active) => !active),
    [],
  );

  const handleFulfillmentStatusChange = useCallback((value) => {
    setSelectedFulfillmentStatuses((prev) => {
      if (prev.includes(value)) {
        return prev.filter((status) => status !== value);
      } else {
        return [...prev, value];
      }
    });
  }, []);

  const handleSortOptionChange = useCallback(
    (value) => setSelectedSortOption(value),
    [],
  );

  const handleSortDirectionChange = useCallback(
    (value) => setSortDirection(value),
    [],
  );

  // Filter and sort orders based on searchQuery, selectedFulfillmentStatuses, selectedSortOption, and sortDirection
  const filteredOrders = orders.filter((order) => {
    // Filter by search query (order name or email)
    const searchLower = searchQuery.toLowerCase();
    const orderNameMatch = order.name.toLowerCase().includes(searchLower);
    const emailMatch = order.customer?.email?.toLowerCase().includes(searchLower);
    if (searchQuery && !(orderNameMatch || emailMatch)) {
      return false;
    }

    // Filter by fulfillment status if any selected
    if (
      selectedFulfillmentStatuses.length > 0 &&
      !selectedFulfillmentStatuses.includes(order.displayFulfillmentStatus)
    ) {
      return false;
    }

    return true;
  });

  // Sorting function helpers
  const getProtectionFee = (order) => {
    const protectionItem = order.lineItems.edges.find(
      (li) => li.node.title === "Shipping Protections",
    );
    return protectionItem
      ? parseFloat(protectionItem.node.originalTotalSet.shopMoney.amount)
      : 0;
  };

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let aVal, bVal;
    switch (selectedSortOption) {
      case "order_number":
        aVal = a.name;
        bVal = b.name;
        break;
      case "protection_fee":
        aVal = getProtectionFee(a);
        bVal = getProtectionFee(b);
        break;
      case "order_paid":
        aVal = parseFloat(a.totalPriceSet.shopMoney.amount);
        bVal = parseFloat(b.totalPriceSet.shopMoney.amount);
        break;
      default:
        return 0;
    }
    if (sortDirection === "ascending") {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    }
  });

  const rows = sortedOrders.map((order) => {
    // Find the price of the "Shipping Protections" product in line items
    const protectionItem = order.lineItems.edges.find(
      (li) => li.node.title === "Shipping Protections",
    );
    const protectionPrice = protectionItem
      ? `${protectionItem.node.originalTotalSet.shopMoney.amount} ${protectionItem.node.originalTotalSet.shopMoney.currencyCode}`
      : "N/A";

    return [
      <Link
        key={order.id}
        url={`https://admin.shopify.com/orders/${order.id.split("/").pop()}`}
        external
        removeUnderline
        style={{ color: "#CC62C7" }}
      >
        {order.name}
      </Link>,

      order.customer?.email || "N/A",
      protectionPrice,
      `${order.totalPriceSet.shopMoney.amount} ${order.totalPriceSet.shopMoney.currencyCode}`,
      <span
        style={{
          color: "#CC62C7",
          backgroundColor: "#FFEAFE",
          padding: "2px 8px",
          borderRadius: "5px",
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          width: "fit-content",
        }}
      >
        Protected
      </span>,

      <span
        style={{
          backgroundColor: "#FFF",
          padding: "2px 8px",
          borderRadius: "5px",
          border: "1px solid #EAEAEA",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "fit-content",
        }}
      >
        {fulfillmentDisplay(order.displayFulfillmentStatus) || "N/A"}
      </span>,

      new Date(order.createdAt).toLocaleDateString(),
      <Link
        key={`action-${order.id}`}
        url="#"
        removeUnderline
        style={{ color: "#CC62C7", cursor: "pointer" }}
      >
        File claim
      </Link>,
    ];
  });

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

              <Card padding="0">
                {/* <div
                  style={{ display: "flex", gap: "5px", paddingBottom: "15px" }}
                >
                  <Button variant="tertiary">All ({orders.length})</Button>
                  <Button variant="tertiary">Protected (1)</Button>
                </div>

                <Divider /> */}

                <div
                  className={styles.filters}
                >
                  <TextField
                    label="Tagged with"
                    fullWidth
                    autoComplete="off"
                    labelHidden
                    prefix={<Icon source={SearchIcon} />}
                    placeholder="Search orders number or email"
                    value={searchQuery}
                    onChange={setSearchQuery}
                  />

                  <Popover
                    active={fulfillmentPopoverActive}
                    activator={
                      <Button
                        textAlign="left"
                        fullWidth
                        size="large"
                        disclosure={fulfillmentPopoverActive ? "up" : "down"}
                        onClick={toggleFulfillmentPopoverActive}
                      >
                        Fulfillment status
                      </Button>
                    }
                    onClose={toggleFulfillmentPopoverActive}
                  >
                    <div style={{ padding: "10px", width: "220px" }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        {fulfillmentStatusOptions.map(
                          ({ label, value, count }) => (
                            <Checkbox
                              key={value}
                              label={`${label} (${count})`}
                              checked={selectedFulfillmentStatuses.includes(
                                value,
                              )}
                              onChange={() =>
                                handleFulfillmentStatusChange(value)
                              }
                            />
                          ),
                        )}
                        <Button
                          plain
                          onClick={() => setSelectedFulfillmentStatuses([])}
                          style={{ marginTop: "10px" }}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  </Popover>

                  <Popover
                    active={sortPopoverActive}
                    activator={
                      <Button
                        icon={SortIcon}
                        size="large"
                        iconPosition="after"
                        onClick={toggleSortPopoverActive}
                      />
                    }
                    onClose={toggleSortPopoverActive}
                  >
                    <div style={{ padding: "10px", width: "220px" }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        <Text variant="headingMd" as="h3">
                          Sort by
                        </Text>
                        {sortOptions.map(({ label, value }) => (
                          <RadioButton
                            key={value}
                            label={label}
                            checked={selectedSortOption === value}
                            id={value}
                            name="sortOption"
                            onChange={() => handleSortOptionChange(value)}
                          />
                        ))}

                        <div
                          onClick={() => handleSortDirectionChange("ascending")}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "20px 1fr",
                            alignItems: "center",
                            cursor: "pointer",
                            fontWeight:
                              sortDirection === "ascending" ? "bold" : "normal",
                            padding: "4px 0",
                            columnGap: "8px",
                            background:
                              sortDirection === "ascending"
                                ? "linear-gradient(134deg, #faeff9 4.31%, #efeaf7 95.02%)"
                                : "transparent",
                            borderRadius: "4px",
                            paddingLeft: "8px",
                          }}
                        >
                          <Icon source={CaretUpIcon} />
                          <span>Ascending</span>
                        </div>
                        <div
                          onClick={() =>
                            handleSortDirectionChange("descending")
                          }
                          style={{
                            display: "grid",
                            gridTemplateColumns: "20px 1fr",
                            alignItems: "center",
                            cursor: "pointer",
                            fontWeight:
                              sortDirection === "descending"
                                ? "bold"
                                : "normal",
                            padding: "4px 0",
                            columnGap: "8px",
                            background:
                              sortDirection === "descending"
                                ? "linear-gradient(134deg, #faeff9 4.31%, #efeaf7 95.02%)"
                                : "transparent",
                            borderRadius: "4px",
                            paddingLeft: "8px",
                          }}
                        >
                          <Icon source={CaretDownIcon} />
                          <span>Descending</span>
                        </div>
                      </div>
                    </div>
                  </Popover>
                </div>

                <DataTable
                  columnContentTypes={[
                    "text",
                    "text",
                    "text",
                    "text",
                    "text",
                    "text",
                    "text",
                    "text",
                  ]}
                  headings={[
                    "Order No.",
                    "Email",
                    "Protection fee",
                    "Order paid",
                    "Protection status",
                    "Fulfillment status",
                    "Date",
                    "Action",
                  ]}
                  rows={rows}
                  verticalAlignment="middle"
                />
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </Page>
    </div>
  );
}
