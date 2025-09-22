import React, { useState, useEffect } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  BlockStack,
  Card,
  InlineGrid,
  Button,
  Badge,
  Thumbnail,
  Divider,
} from "@shopify/polaris";
import { ArrowLeftIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request, params }) => {
  const { claimId } = params;
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Fetch claim details
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
  });

  if (!claim) {
    throw new Response("Claim not found", { status: 404 });
  }

  // Fetch order details from Shopify
  const { admin } = await authenticate.admin(request);
  let globalOrderId = claim.orderId;

  if (!claim.orderId.startsWith("gid://")) {
    globalOrderId = `gid://shopify/Order/${claim.orderId}`;
  }

  const query = `#graphql
    {
      order(id: "${globalOrderId}") {
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
          displayName
        }
        shippingAddress {
          address1
          address2
          city
          province
          zip
          country
        }
        lineItems(first: 20) {
          edges {
            node {
              id
              title
              sku
              originalTotalSet {
                presentmentMoney {
                  amount
                  currencyCode
                }
              }
              quantity
              image {
                originalSrc
                altText
              }
            }
          }
        }
      }
    }
  `;

  const response = await admin.graphql(query);
  const data = await response.json();

  if (!data.data || data.errors) {
    console.error("GraphQL errors or missing data:", data.errors || data);
    throw new Response("Order not found or GraphQL error", { status: 404 });
  }

  const order = data.data.order;

  return json({
    claim: {
      ...claim,
      order: order,
    },
  });
};

export default function ClaimDetailPage() {
  const { claim } = useLoaderData();
  const navigate = useNavigate();

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: { color: "#666", bg: "#F5F5F5" },
      approved: { color: "#008000", bg: "#E8F5E8" },
      rejected: { color: "#CC62C7", bg: "#FFEAFE" },
      settled: { color: "#000080", bg: "#E8E8FF" },
    };

    const statusConfig = statusColors[status] || {
      color: "#666",
      bg: "#F5F5F5",
    };

    return (
      <Badge
        tone={
          status === "approved"
            ? "success"
            : status === "rejected"
              ? "critical"
              : status === "settled"
                ? "info"
                : "default"
        }
      >
        {status.charAt(0).toUpperCase() + status.slice(1)} review
      </Badge>
    );
  };

  const formatAddress = (address) => {
    if (!address) return "N/A";
    const parts = [
      address.address1,
      address.address2,
      address.city,
      address.province,
      address.zip,
      address.country,
    ].filter(Boolean);
    return parts.join(", ");
  };

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "1rem",
            }}
          >
            <Button
              onClick={() => navigate("/app/claims")}
              variant="tertiary"
              icon={ArrowLeftIcon}
            />
            <Text variant="headingLg" as="h2">
              Claim {claim.id}
            </Text>
            {getStatusBadge(claim.status)}
          </div>

          <InlineGrid
            columns={{ xs: 1, md: ["twoThirds", "oneThird"] }}
            gap="400"
          >
            {/* Items Section */}
            <Card padding="0">
              <BlockStack gap="400">
                <div style={{ padding: "20px 20px 0px 17px" }}>
                  <Text variant="headingMd" as="h3" fontWeight="semibold">
                    Items
                  </Text>
                </div>

                <Divider />

                {claim.items &&
                  Object.entries(claim.items).map(([itemId, itemData]) => {
                    const orderItem = claim.order?.lineItems?.edges?.find(
                      (edge) => edge.node.id === itemId,
                    )?.node;

                    return (
                      <div key={itemId} style={{ padding: "0px 17px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "start",
                            gap: "16px",
                            padding: "20px",
                            backgroundColor: "#F1F1F1",
                            borderRadius: "5px",
                            border: "1px solid #E6E6E6",
                          }}
                        >
                          <Thumbnail
                            source={orderItem?.image?.originalSrc || ""}
                            alt={orderItem?.title || "Product image"}
                            size="large"
                          />

                          <div style={{ flex: 1 }}>
                            <Text variant="bodyMd" fontWeight="semibold">
                              {orderItem?.title || "Unknown Product"}
                            </Text>

                            <div style={{ marginTop: "4px" }}>
                              <Badge variant="default">
                                {orderItem?.sku || "No SKU"}
                              </Badge>
                            </div>

                            <div style={{ marginTop: "4px" }}>
                              <Text variant="bodyMd" fontWeight="semibold">
                                Reason:{" "}
                                {itemData.reasons?.[0] || "Not specified"}
                              </Text>
                            </div>

                            <div style={{ marginTop: "4px" }}>
                              <Thumbnail
                                source={orderItem?.image?.originalSrc || ""}
                                alt={orderItem?.title || "Product image"}
                              />
                            </div>
                          </div>

                          <div
                            style={{
                              borderRadius: "5px",
                              background: "#FFF",
                              width: "115px",
                              height: "28px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text
                              variant="bodyMd"
                              fontWeight="semibold"
                              style={{ marginTop: "8px" }}
                            >
                              ₹
                              {orderItem?.originalTotalSet?.presentmentMoney
                                ?.amount || "0.00"}{" "}
                              {orderItem?.originalTotalSet?.presentmentMoney
                                ?.currencyCode || "INR"}{" "}
                              x {itemData.quantity || 1}
                            </Text>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                <Divider />

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "12px",
                    padding: "0px 17px 20px 0px",
                  }}
                >
                  <Button variant="secondary">Decline</Button>
                  <Button variant="primary">Approve order</Button>
                </div>
              </BlockStack>
            </Card>

            <Card padding="0">
              <BlockStack gap="400">
                <div style={{ padding: "20px 0px 0px 17px" }}>
                  <Text variant="headingMd" as="h3" fontWeight="semibold">
                    General information
                  </Text>
                </div>

                <Divider />

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    padding: "0px 17px 0px 17px",
                  }}
                >
                  <BlockStack gap="300">
                    <div>
                      <Text variant="bodyMd" fontWeight="semibold">
                        Order No.
                      </Text>
                      <div style={{ marginTop: "4px" }}>
                        <button
                          key={claim.id}
                          onClick={() =>
                            navigate(`/app/order/${order.id.split("/").pop()}`)
                          }
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
                          {claim.order?.name || claim.orderId}
                        </button>
                      </div>
                    </div>

                    <Divider />

                    <div>
                      <Text variant="bodyMd" fontWeight="semibold">
                        Customer name
                      </Text>
                      <Text
                        variant="bodyMd"
                        color="subdued"
                        style={{ marginTop: "4px" }}
                      >
                        {claim.order?.customer?.displayName || "N/A"}
                      </Text>
                    </div>

                    <Divider />

                    <div>
                      <Text variant="bodyMd" fontWeight="semibold">
                        Customer contact
                      </Text>
                      <Text
                        variant="bodyMd"
                        color="subdued"
                        style={{ marginTop: "4px" }}
                      >
                        {claim.order?.customer?.email || "N/A"}
                      </Text>
                    </div>

                    <Divider />

                    <div>
                      <Text variant="bodyMd" fontWeight="semibold">
                        Shipping address
                      </Text>
                      <Text
                        variant="bodyMd"
                        color="subdued"
                        style={{ marginTop: "4px" }}
                      >
                        {formatAddress(claim.order?.shippingAddress)}
                      </Text>
                    </div>
                  </BlockStack>
                </div>
              </BlockStack>
            </Card>
          </InlineGrid>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
