import React, { useState, useCallback, useEffect } from "react";

import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, useNavigation } from "@remix-run/react";
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
  EmptyState,
  Spinner,
  Scrollable,
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

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { authenticate } from "../shopify.server";

const fulfillmentStatusLabels = {
  fulfilled: "Fulfilled",
  partially_fulfilled: "Partially fulfilled",
  unfulfilled: "Unfulfilled",
  scheduled: "Scheduled",
  on_hold: "On hold",
};

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const startDateParam = url.searchParams.get("startDate");
  const endDateParam = url.searchParams.get("endDate");

  const now = new Date();
  const defaultEndDate = now.toISOString().split("T")[0];
  const defaultStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const startDate = startDateParam || defaultStartDate;
  const endDate = endDateParam || defaultEndDate;

  const query = `
    query getOrders($query: String!) {
      orders(first: 250, sortKey: CREATED_AT, reverse: true, query: $query) {
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

  const variables = {
    query: `created_at:>='${startDate}' AND created_at:<='${endDate}'`,
  };

  const response = await admin.graphql(query, { variables });
  const data = await response.json();
  console.log("GraphQL response data:", data);

  const filteredOrders = data.data.orders.edges
    .map((edge) => edge.node)
    .filter((order) => {
      const titles = order.lineItems.edges.map((li) => li.node.title);
      const hasShippingProtection = titles.includes("Shipping Protections");
      const hasOtherProduct = titles.some((t) => t !== "Shipping Protections");
      return hasShippingProtection && hasOtherProduct;
    });

  return json({
    orders: filteredOrders,
  });
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

const sortOptions = [
  { label: "Order number", value: "order_number" },
  { label: "Protection fee", value: "protection_fee" },
  { label: "Order paid", value: "order_paid" },
];

export default function OrdersPage() {
  const { orders } = useLoaderData();
  const navigate = useNavigate();
  const navigation = useNavigation();

  const aggregateDataByDate = (startDateParam, endDateParam) => {
    const dateMap = {};

    orders.forEach((order) => {
      const date = new Date(order.createdAt).toISOString().slice(0, 10);
      if (!dateMap[date]) {
        dateMap[date] = { count: 0, totalProtection: 0, ordersCount: 0 };
      }
      const protectionItem = order.lineItems.edges.find(
        (li) => li.node.title === "Shipping Protections",
      );
      const protectionAmount = protectionItem
        ? parseFloat(protectionItem.node.originalTotalSet.shopMoney.amount)
        : 0;

      dateMap[date].count += 1;
      dateMap[date].totalProtection += protectionAmount;
      dateMap[date].ordersCount += 1;
    });

    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(Object.keys(dateMap).sort()[0]);
    const endDate = endDateParam
      ? new Date(endDateParam)
      : new Date(Object.keys(dateMap).sort().slice(-1)[0]);

    const allDates = [];
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const isoDate = d.toISOString().slice(0, 10);
      allDates.push(isoDate);
      if (!dateMap[isoDate]) {
        dateMap[isoDate] = { count: 0, totalProtection: 0, ordersCount: 0 };
      }
    }

    return allDates.map((date) => {
      const data = dateMap[date];
      return {
        date,
        protectedOrders: data.count,
        avgProtection:
          data.ordersCount > 0 ? data.totalProtection / data.ordersCount : 0,
      };
    });
  };

  const url =
    typeof window !== "undefined" ? new URL(window.location.href) : null;
  const startDateParam = url ? url.searchParams.get("startDate") : null;
  const endDateParam = url ? url.searchParams.get("endDate") : null;

  const graphData = aggregateDataByDate(startDateParam, endDateParam);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFulfillmentStatuses, setSelectedFulfillmentStatuses] =
    useState([]);
  const [fulfillmentPopoverActive, setFulfillmentPopoverActive] =
    useState(false);
  const [sortPopoverActive, setSortPopoverActive] = useState(false);
  const [selectedSortOption, setSelectedSortOption] = useState("order_number");
  const [sortDirection, setSortDirection] = useState("descending");
  const [currentPage, setCurrentPage] = useState(1);

  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const currentFirst = url.searchParams.get("first")
        ? parseInt(url.searchParams.get("first"))
        : 10;
      setPageSize(currentFirst);
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFulfillmentStatuses]);

  const handleApply = ({ startDate, endDate, selectedRange }) => {
    console.log("Applied date range:", { startDate, endDate, selectedRange });

    const params = new URLSearchParams(window.location.search);
    params.set("startDate", startDate.toISOString().slice(0, 10));
    params.set("endDate", endDate.toISOString().slice(0, 10));
    navigate(`?${params.toString()}`, { replace: true });
  };

  const fulfillmentDisplay = (status) =>
    status?.replace(/_/g, " ").toLowerCase() || "Unfulfilled";

  const filteredOrders = orders.filter((order) => {
    const searchLower = searchQuery.toLowerCase();
    const orderNameMatch = order.name.toLowerCase().includes(searchLower);
    const emailMatch = order.customer?.email
      ?.toLowerCase()
      .includes(searchLower);
    if (searchQuery && !(orderNameMatch || emailMatch)) {
      return false;
    }

    const orderStatus =
      order.displayFulfillmentStatus?.toLowerCase() || "unfulfilled";

    if (
      selectedFulfillmentStatuses.length > 0 &&
      !selectedFulfillmentStatuses.includes(orderStatus)
    ) {
      return false;
    }

    return true;
  });

  let fulfillmentStatusCounts = {};
  if (filteredOrders) {
    fulfillmentStatusCounts = filteredOrders.reduce((acc, order) => {
      const statusKey =
        order.displayFulfillmentStatus?.toLowerCase() || "unfulfilled";
      if (fulfillmentStatusLabels.hasOwnProperty(statusKey)) {
        acc[statusKey] = (acc[statusKey] || 0) + 1;
      }
      return acc;
    }, {});
  }

  const fulfillmentStatusOptions = Object.entries(fulfillmentStatusLabels).map(
    ([value, label]) => {
      const count = filteredOrders.filter(
        (order) =>
          (order.displayFulfillmentStatus?.toLowerCase() || "unfulfilled") ===
          value,
      ).length;

      return { value, label, count };
    },
  );

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

  const startIndex = (currentPage - 1) * pageSize;
  const pagedOrders = sortedOrders.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(sortedOrders.length / pageSize);

  const rows = pagedOrders.map((order) => {
    const protectionItem = order.lineItems.edges.find(
      (li) => li.node.title === "Shipping Protections",
    );
    const protectionPrice = protectionItem
      ? `${protectionItem.node.originalTotalSet.shopMoney.amount} ${protectionItem.node.originalTotalSet.shopMoney.currencyCode}`
      : "N/A";

    return [
      <button
        key={order.id}
        onClick={() => navigate(`/app/order/${order.id.split("/").pop()}`)}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          margin: 0,
          color: "#CC62C7",
          cursor: "pointer",
          textDecoration: "underline",
          font: "inherit",
        }}
      >
        {order.name}
      </button>,

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
      <button
        key={`action-${order.id}`}
        onClick={() => navigate(`/app/order/${order.id.split("/").pop()}`)}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          margin: 0,
          color: "#CC62C7",
          cursor: "pointer",
          font: "inherit",
        }}
      >
        File claim
      </button>,
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
                  columns={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2 }}
                >
                  <div className={styles.card}>
                    <BlockStack gap="400">
                      <Text as="h2" variant="headingMd" fontWeight="bold">
                        Protected orders
                      </Text>

                      <div
                        style={{
                          alignItems: "end",
                          minHeight: "40px",
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text as="h2" variant="headingMd" fontWeight="bold">
                          {orders.length}
                        </Text>
                        <div style={{ width: 200, height: 40 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={graphData}>
                              <XAxis dataKey="date" hide />
                              <YAxis hide domain={["dataMin", "dataMax"]} />
                              <Tooltip />
                              <Area
                                type="natural"
                                dataKey="protectedOrders"
                                stroke="#CC62C7"
                                fill="#CC62C7"
                                fillOpacity={0.3}
                                strokeWidth={2}
                                dot={false}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </BlockStack>
                  </div>

                  <div className={styles.card}>
                    <BlockStack gap="400">
                      <Text as="h2" variant="headingMd" fontWeight="bold">
                        Average protection paid
                      </Text>

                      <div
                        style={{
                          alignItems: "center",
                          minHeight: "40px",
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text as="h2" variant="headingMd" fontWeight="bold">
                          {(() => {
                            if (orders.length === 0) return "N/A";
                            const totalProtection = orders.reduce(
                              (sum, order) => {
                                const protectionItem =
                                  order.lineItems.edges.find(
                                    (li) =>
                                      li.node.title === "Shipping Protections",
                                  );
                                const amount = protectionItem
                                  ? parseFloat(
                                      protectionItem.node.originalTotalSet
                                        .shopMoney.amount,
                                    )
                                  : 0;
                                return sum + amount;
                              },
                              0,
                            );
                            const avgProtection =
                              totalProtection / orders.length;
                            const currencyCode =
                              orders[0].lineItems.edges[0]?.node
                                .originalTotalSet.shopMoney.currencyCode || "";
                            return `${avgProtection.toFixed(2)} ${currencyCode}`;
                          })()}
                        </Text>
                        <div style={{ width: 150, height: 40 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={graphData}>
                              <XAxis dataKey="date" hide />
                              <YAxis hide domain={["dataMin", "dataMax"]} />
                              <Tooltip />
                              <Area
                                type="natural"
                                dataKey="avgProtection"
                                stroke="#CC62C7"
                                fill="#CC62C7"
                                fillOpacity={0.3}
                                strokeWidth={2}
                                dot={false}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </BlockStack>
                  </div>

                  {/* <div className={styles.card}>
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
                  </div> */}
                </InlineGrid>
              </Card>

              <Card padding="0">
                <div className={styles.filters}>
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

                {navigation.state === "loading" ? (
                  <div style={{ padding: "20px", textAlign: "center" }}>
                    <Spinner accessibilityLabel="Loading orders" size="large" />
                    <Text>Loading orders...</Text>
                  </div>
                ) : sortedOrders.length === 0 ? (
                  <EmptyState
                    heading="No orders found"
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>
                      No orders match the current filters. Try adjusting your
                      search or date range.
                    </p>
                  </EmptyState>
                ) : (
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
                    pagination={{
                      hasNext: currentPage * pageSize < sortedOrders.length,
                      hasPrevious: currentPage > 1,
                      onNext: () => setCurrentPage(currentPage + 1),
                      onPrevious: () => setCurrentPage(currentPage - 1),
                    }}
                  />
                )}
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </Page>
    </div>
  );
}
