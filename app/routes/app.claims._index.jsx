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
  DataTable,
  TextField,
  Icon,
  Popover,
  Checkbox,
  RadioButton,
  EmptyState,
  Spinner,
} from "@shopify/polaris";

import DateRangePicker from "../components/DateRangePicker";
import styles from "./_index/styles.module.css";

import {
  SearchIcon,
  SortIcon,
  CaretUpIcon,
  CaretDownIcon,
} from "@shopify/polaris-icons";
import { Toast } from "@shopify/polaris";

import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const url = new URL(request.url);
  const startDateParam = url.searchParams.get("startDate");
  const endDateParam = url.searchParams.get("endDate");

  let whereClause = { shop: shop };

  if (startDateParam && endDateParam) {
    const now = new Date();
    const defaultEndDate = now.toISOString().split("T")[0];
    const defaultStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const startDate = startDateParam || defaultStartDate;
    const endDate = endDateParam || defaultEndDate;

   
    const endDateTime = endDateParam ? new Date(endDate) : new Date();
    endDateTime.setHours(23, 59, 59, 999); 

    whereClause = {
      shop: shop,
      createdAt: {
        gte: new Date(startDate),
        lte: endDateTime,
      },
    };
  }

  console.log("Shop:", shop);
  console.log("Where clause:", JSON.stringify(whereClause, null, 2));

  const claims = await prisma.claim.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    take: 100,
    skip: 0,
  });

  console.log("Claims found:", claims.length);
  console.log("Claims data:", claims);

  let claimPortalSettings = null;
  try {
    claimPortalSettings = await prisma.claim_portal_settings.findUnique({
      where: { shop },
    });
  } catch (error) {
    console.warn("Claim portal settings not found:", error.message);
  }

  const days = claimPortalSettings?.days ? parseInt(claimPortalSettings.days) : 45;
  const now = new Date();

  const expiredClaims = claims.filter(claim =>
    claim.status !== 'expired' &&
    new Date(claim.createdAt.getTime() + days * 24 * 60 * 60 * 1000) < now
  );

  if (expiredClaims.length > 0) {
    await prisma.claim.updateMany({
      where: {
        id: { in: expiredClaims.map(c => c.id) },
        shop,
      },
      data: { status: 'expired' },
    });

    const updatedClaims = await prisma.claim.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 100,
      skip: 0,
    });
    claims.length = 0;
    claims.push(...updatedClaims);
  }

  const orderIds = [...new Set(claims.map((claim) => claim.orderId))];

  let ordersMap = {};
  if (orderIds.length > 0) {
    const { admin } = await authenticate.admin(request);

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
      query: `id:${orderIds.map((id) => id).join(" OR id:")}`,
    };

    const response = await admin.graphql(query, { variables });
    const data = await response.json();

    // Create a map of order ID to order data
    ordersMap = data.data.orders.edges.reduce((map, edge) => {
      const orderId = edge.node.id.split("/").pop();
      map[orderId] = edge.node;
      return map;
    }, {});
  }

  return json({
    claims: claims,
    ordersMap: ordersMap,
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

export default function ClaimsPage() {
  const { claims, ordersMap } = useLoaderData();
  const navigate = useNavigate();
  const navigation = useNavigation();

  const aggregateDataByDate = (startDateParam, endDateParam) => {
    const dateMap = {};

    claims.forEach((claim) => {
      const date = new Date(claim.createdAt).toISOString().slice(0, 10);
      if (!dateMap[date]) {
        dateMap[date] = { count: 0, totalSettlement: 0, claimsCount: 0 };
      }

      let settlementValue = 0;
      if (claim.items && typeof claim.items === "object") {
        settlementValue = claim.items.settlementValue || 0;
      }

      dateMap[date].count += 1;
      dateMap[date].totalSettlement += settlementValue;
      dateMap[date].claimsCount += 1;
    });

    const now = new Date();
    const defaultStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const defaultEndDate = new Date();

    const startDate = startDateParam
      ? new Date(startDateParam)
      : Object.keys(dateMap).length > 0
        ? new Date(
            Math.min(
              new Date(Object.keys(dateMap).sort()[0]),
              defaultStartDate,
            ),
          )
        : defaultStartDate;
    const endDate = endDateParam
      ? new Date(endDateParam)
      : Object.keys(dateMap).length > 0
        ? new Date(
            Math.max(
              new Date(Object.keys(dateMap).sort().slice(-1)[0]),
              defaultEndDate,
            ),
          )
        : defaultEndDate;

    const allDates = [];
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const isoDate = d.toISOString().slice(0, 10);
      allDates.push(isoDate);
      if (!dateMap[isoDate]) {
        dateMap[isoDate] = { count: 0, totalSettlement: 0, claimsCount: 0 };
      }
    }

    return allDates.map((date) => {
      const data = dateMap[date];
      return {
        date,
        claimsCount: data.count,
        avgSettlement:
          data.claimsCount > 0 ? data.totalSettlement / data.claimsCount : 0,
      };
    });
  };

  const url =
    typeof window !== "undefined" ? new URL(window.location.href) : null;
  const startDateParam = url ? url.searchParams.get("startDate") : null;
  const endDateParam = url ? url.searchParams.get("endDate") : null;

  const graphData = aggregateDataByDate(startDateParam, endDateParam);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedSolutions, setSelectedSolutions] = useState([]);
  const [statusPopoverActive, setStatusPopoverActive] = useState(false);
  const [sortPopoverActive, setSortPopoverActive] = useState(false);
  const [solutionPopoverActive, setSolutionPopoverActive] = useState(false);
  const [selectedSortOption, setSelectedSortOption] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("descending");
  const [currentPage, setCurrentPage] = useState(1);

  const [pageSize, setPageSize] = useState(10);
  const [toastActive, setToastActive] = useState(false);
  const [toastContent, setToastContent] = useState("");
  const [toastError, setToastError] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const currentFirst = url.searchParams.get("first")
        ? parseInt(url.searchParams.get("first"))
        : 10;
      setPageSize(currentFirst);

      // Check for success parameter from claim creation
      const success = url.searchParams.get("success") === "true";
      if (success) {
        setToastContent("Claim submitted successfully!");
        setToastError(false);
        setToastActive(true);
      }
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatuses, selectedSolutions]);

  const handleApply = ({ startDate, endDate, selectedRange }) => {
    console.log("Applied date range:", { startDate, endDate, selectedRange });

    const params = new URLSearchParams(window.location.search);
    params.set("startDate", startDate.toISOString().slice(0, 10));
    params.set("endDate", endDate.toISOString().slice(0, 10));
    navigate(`?${params.toString()}`, { replace: true });
  };

  const statusOptions = [
    { value: "pending", label: "Pending review" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "settled", label: "Settled" },
    { value: "expired", label: "Expired" },
  ];

  const solutionOptions = [
    { value: "refund", label: "Refund" },
    { value: "reorder", label: "Reorder" },
  ];

  const sortOptions = [
    { label: "Created date", value: "created_at" },
    { label: "Order ID", value: "order_id" },
    { label: "Settlement value", value: "settlement_value" },
  ];

  const filteredClaims = claims.filter((claim) => {
    const searchLower = searchQuery.toLowerCase();
    const orderIdMatch = claim.orderId.toLowerCase().includes(searchLower);
    const methodMatch = claim.method?.toLowerCase().includes(searchLower);
    if (searchQuery && !(orderIdMatch || methodMatch)) {
      return false;
    }

    if (
      selectedStatuses.length > 0 &&
      !selectedStatuses.includes(claim.status)
    ) {
      return false;
    }

    if (
      selectedSolutions.length > 0 &&
      !selectedSolutions.includes(claim.method || "")
    ) {
      return false;
    }

    return true;
  });

  const statusCounts = filteredClaims.reduce((acc, claim) => {
    acc[claim.status] = (acc[claim.status] || 0) + 1;
    return acc;
  }, {});

  const statusFilterOptions = statusOptions.map(({ value, label }) => {
    const count = statusCounts[value] || 0;
    return { value, label, count };
  });

  const solutionCounts = filteredClaims.reduce((acc, claim) => {
    const method = claim.method || "";
    if (method) {
      acc[method] = (acc[method] || 0) + 1;
    }
    return acc;
  }, {});

  const solutionFilterOptions = solutionOptions.map(({ value, label }) => {
    const count = solutionCounts[value] || 0;
    return { value, label, count };
  });

  const toggleStatusPopoverActive = useCallback(
    () => setStatusPopoverActive((active) => !active),
    [],
  );

  const toggleSolutionPopoverActive = useCallback(
    () => setSolutionPopoverActive((active) => !active),
    [],
  );

  const toggleSortPopoverActive = useCallback(
    () => setSortPopoverActive((active) => !active),
    [],
  );

  const handleStatusChange = useCallback((value) => {
    setSelectedStatuses((prev) => {
      if (prev.includes(value)) {
        return prev.filter((status) => status !== value);
      } else {
        return [...prev, value];
      }
    });
  }, []);

  const handleSolutionChange = useCallback((value) => {
    setSelectedSolutions((prev) => {
      if (prev.includes(value)) {
        return prev.filter((solution) => solution !== value);
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

  const sortedClaims = [...filteredClaims].sort((a, b) => {
    let aVal, bVal;
    switch (selectedSortOption) {
      case "created_at":
        aVal = new Date(a.createdAt);
        bVal = new Date(b.createdAt);
        break;
      case "order_id":
        aVal = a.orderId;
        bVal = b.orderId;
        break;
      case "status":
        aVal = a.status;
        bVal = b.status;
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
  const pagedClaims = sortedClaims.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(sortedClaims.length / pageSize);

  const rows = pagedClaims.map((claim) => {
    const order = ordersMap[claim.orderId];
    const orderName = order ? order.name : claim.orderId;
    const customerEmail = order ? order.customer?.email : "N/A";

    let settlementValue = "N/A";
    if (claim.items && typeof claim.items === "object") {
      settlementValue = claim.items.settlementValue || "N/A";
      if (settlementValue !== "N/A" && order) {
        settlementValue = `${settlementValue} ${order.totalPriceSet?.shopMoney?.currencyCode || "USD"}`;
      }
    }

    const getStatusBadge = (status) => {
      const statusColors = {
        approved: { color: "#008000", bg: "#E8F5E8" },
        rejected: { color: "#CC62C7", bg: "#FFEAFE" },
        settled: { color: "#000080", bg: "#E8E8FF" },
        expired: { color: "#FF0000", bg: "#FFE8E8" },
      };

      const statusConfig = statusColors[status] || {
        color: "#666",
        bg: "#F5F5F5",
      };

      return (
        <span
          style={{
            color: statusConfig.color,
            backgroundColor: statusConfig.bg,
            padding: "2px 8px",
            borderRadius: "5px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            width: "fit-content",
          }}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      );
    };

    return [
      // Claim ID column
      <span
        key={`claim-id-${claim.id}`}
        style={{
          fontFamily: "monospace",
          fontSize: "12px",
          color: "#666",
        }}
      >
        {claim.id}
      </span>,

      // Order column
      <button
        key={`order-${claim.id}`}
        onClick={() => navigate(`/app/order/${claim.orderId}`)}
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
        {orderName}
      </button>,

      getStatusBadge(claim.status),

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
       { claim.method || "N/A"}
      </span>,

      customerEmail,

      settlementValue,

      new Date(claim.createdAt).toLocaleDateString(),

      <button
        key={`action-${claim.id}`}
        onClick={() => navigate(`/app/claims/${claim.id}`)}
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
        Manage claim
      </button>,
    ];
  });

  console.log("claims", claims);

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
                  Claims
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
                  columns={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }}
                >
                  <div className={styles.card}>
                    <BlockStack gap="400">
                      <Text as="h2" variant="headingMd" fontWeight="bold">
                        Total claims
                      </Text>

                      <Text as="h2" variant="headingMd" fontWeight="bold">
                        {claims.length}
                      </Text>
                    </BlockStack>
                  </div>

                  <div className={styles.card}>
                    <BlockStack gap="400">
                      <Text as="h2" variant="headingMd" fontWeight="bold">
                        Pending review
                      </Text>

                      <Text as="h2" variant="headingMd" fontWeight="bold">
                        {
                          claims.filter((claim) => claim.status === "pending")
                            .length
                        }
                      </Text>
                    </BlockStack>
                  </div>

                  <div className={styles.card}>
                    <BlockStack gap="400">
                      <Text as="h2" variant="headingMd" fontWeight="bold">
                        Average value
                      </Text>

                      <Text as="h2" variant="headingMd" fontWeight="bold">
                        {
                          claims.filter((claim) => claim.status === "approved")
                            .length
                        }
                      </Text>
                    </BlockStack>
                  </div>

                  <div className={styles.card}>
                    <BlockStack gap="400">
                      <Text as="h2" variant="headingMd" fontWeight="bold">
                        Top reason
                      </Text>

                      <Text as="h2" variant="headingMd" fontWeight="bold">
                        {(() => {
                          const totalSettlement = claims.reduce(
                            (sum, claim) => {
                              if (
                                claim.items &&
                                typeof claim.items === "object" &&
                                claim.items.settlementValue
                              ) {
                                return (
                                  sum + parseFloat(claim.items.settlementValue)
                                );
                              }
                              return sum;
                            },
                            0,
                          );

                          if (totalSettlement === 0) return "N/A";

                          const currencyCode =
                            ordersMap[Object.keys(ordersMap)[0]]?.totalPriceSet
                              ?.shopMoney?.currencyCode || "USD";
                          return `${totalSettlement.toFixed(2)} ${currencyCode}`;
                        })()}
                      </Text>
                    </BlockStack>
                  </div>
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
                    placeholder="Search claims by order ID or method"
                    value={searchQuery}
                    onChange={setSearchQuery}
                  />

                  <Popover
                    active={statusPopoverActive}
                    activator={
                      <Button
                        textAlign="left"
                        fullWidth
                        size="large"
                        disclosure={statusPopoverActive ? "up" : "down"}
                        onClick={toggleStatusPopoverActive}
                      >
                        Claim status
                      </Button>
                    }
                    onClose={toggleStatusPopoverActive}
                  >
                    <div style={{ padding: "10px", width: "220px" }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        {statusFilterOptions.map(({ label, value, count }) => (
                          <Checkbox
                            key={value}
                            label={`${label} (${count})`}
                            checked={selectedStatuses.includes(value)}
                            onChange={() => handleStatusChange(value)}
                          />
                        ))}
                        <Button
                          plain
                          onClick={() => setSelectedStatuses([])}
                          style={{ marginTop: "10px" }}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  </Popover>

                  <Popover
                    active={solutionPopoverActive}
                    activator={
                      <Button
                        textAlign="left"
                        fullWidth
                        size="large"
                        disclosure={solutionPopoverActive ? "up" : "down"}
                        onClick={toggleSolutionPopoverActive}
                      >
                        Request Solution
                      </Button>
                    }
                    onClose={toggleSolutionPopoverActive}
                  >
                    <div style={{ padding: "10px", width: "220px" }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        {solutionFilterOptions.map(
                          ({ label, value, count }) => (
                            <Checkbox
                              key={value}
                              label={`${label} (${count})`}
                              checked={selectedSolutions.includes(value)}
                              onChange={() => handleSolutionChange(value)}
                            />
                          ),
                        )}
                        <Button
                          plain
                          onClick={() => setSelectedSolutions([])}
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
                    <Spinner accessibilityLabel="Loading claims" size="large" />
                    <Text>Loading claims...</Text>
                  </div>
                ) : sortedClaims.length === 0 ? (
                  <EmptyState
                    heading="No claims found"
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>
                      No claims match the current filters. Try adjusting your
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
                      "text",
                    ]}
                    headings={[
                      "Claim ID",
                      "Order No.",
                      "Claim Status",
                      "Method",
                      "Email",

                      "Settlement value",

                      "Date",
                      "Action",
                    ]}
                    rows={rows}
                    verticalAlignment="middle"
                    pagination={{
                      hasNext: currentPage * pageSize < sortedClaims.length,
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

      {toastActive && (
        <Toast
          content={toastContent}
          error={toastError}
          onDismiss={() => setToastActive(false)}
        />
      )}
    </div>
  );
}
