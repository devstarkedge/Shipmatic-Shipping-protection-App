import React, { useState } from "react";
import { useNavigate, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  TextField,
  Thumbnail,
  Badge,
  Thumbnail as PolarisThumbnail,
  Button as PolarisButton,
  Divider,
} from "@shopify/polaris";
import AutocompleteMultiSelect from "../components/AutocompleteMultiSelect";
// import refund from "";
import { ArrowLeftIcon, UploadIcon } from "@shopify/polaris-icons";


const REASON_OPTIONS = [
  { label: "Damaged", value: "damaged" },
  { label: "Wrong item", value: "wrong_item" },
  { label: "Missing item", value: "missing_item" },
  { label: "Other", value: "other" },
];

export async function loader({ request, params }) {
  const { orderId } = params;
  const { admin } = await authenticate.admin(request);

  let globalOrderId = orderId;
  if (!orderId.startsWith("gid://")) {
    globalOrderId = `gid://shopify/Order/${orderId}`;
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

  if (!data.data.order) {
    throw new Response("Order not found", { status: 404 });
  }

  const items = data.data.order.lineItems.edges
    .map(({ node }) => ({
      id: node.id,
      title: node.title,
      sku: node.sku,
      price: parseFloat(node.originalTotalSet.presentmentMoney.amount),
      currency: node.originalTotalSet.presentmentMoney.currencyCode,
      maxQuantity: node.quantity,
      image: node.image ? node.image.originalSrc : "",
    }))
    .filter((item) => item.title !== "Shipping Protections");

  const order = {
    id: data.data.order.id,
    name: data.data.order.name,
    createdAt: data.data.order.createdAt,
    displayFulfillmentStatus: data.data.order.displayFulfillmentStatus,
    totalPrice: data.data.order.totalPriceSet.shopMoney.amount,
    currency: data.data.order.totalPriceSet.shopMoney.currencyCode,
    customer: data.data.order.customer,
    items,
  };

  return json({ order });
}

export default function ClaimPage() {
  const { order } = useLoaderData();
  console.log("Rendering order items:", order.items);
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState({});
  const [selectedReasons, setSelectedReasons] = useState({});
  const [notes, setNotes] = useState({});
  const [proofFiles, setProofFiles] = useState({});
  const [step, setStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState("");

  const handleQuantityChange = (itemId, delta) => {
    setSelectedItems((prev) => {
      const currentQty = prev[itemId] || 0;
      const newQty = Math.min(
        Math.max(currentQty + delta, 0),
        order.items.find((item) => item.id === itemId).maxQuantity,
      );
      return { ...prev, [itemId]: newQty };
    });
  };

  const handleNotesChange = (itemId, value) => {
    setNotes((prev) => ({ ...prev, [itemId]: value }));
  };

  const handleProofFileChange = (itemId, files) => {
    setProofFiles((prev) => ({ ...prev, [itemId]: files }));
  };

  const validSelection = Object.values(selectedItems).some((qty) => qty > 0);

  const claimData = Object.entries(selectedItems)
    .filter(([_, qty]) => qty > 0)
    .map(([itemId, qty]) => ({
      itemId,
      quantity: qty,
      reasons: selectedReasons[itemId] || [],
      notes: notes[itemId] || "",
      proofFiles: proofFiles[itemId] || [],
    }));

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
              onClick={() => navigate(-1)}
              variant="tertiary"
              icon={ArrowLeftIcon}
            ></Button>
            <Text variant="headingLg" as="h2" style={{ marginTop: "1rem" }}>
              File claim for {order.name}
            </Text>
          </div>

          {step === 1 && (
            <Card sectioned>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "20px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                        backgroundColor: "#F1F1F1",
                        border: "1px solid #E6E6E6",
                        borderRadius: "5px",
                        boxShadow: "0 2px 6px 0 rgba(0, 0, 0, 0.05)",
                        padding: "20px",
                      }}
                    >
                      <Thumbnail
                        source={item.image}
                        alt={item.title}
                        size="large"
                        transparent
                      />
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                        }}
                      >
                        <Text variant="bodyMd" fontWeight="semibold">
                          {item.title}
                        </Text>

                        <div>
                          <Badge>{item.sku || "No SKU"}</Badge>
                        </div>

                        <Text variant="bodyMd" fontWeight="semibold" as="p">
                          {item.price.toFixed(2)} {item.currency}
                        </Text>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          backgroundColor: "#FFF",
                          border: "1px solid #E2E2E2",
                          borderRadius: "5px",
                          padding: "4px",
                        }}
                      >
                        <Button
                          disabled={
                            !selectedItems[item.id] ||
                            selectedItems[item.id] <= 0
                          }
                          onClick={() => handleQuantityChange(item.id, -1)}
                          plain
                          size="micro"
                        >
                          -
                        </Button>
                        <div style={{ minWidth: "40px", textAlign: "center" }}>
                          <Text>
                            {selectedItems[item.id] || 0} / {item.maxQuantity}
                          </Text>
                        </div>
                        <Button
                          disabled={selectedItems[item.id] >= item.maxQuantity}
                          onClick={() => handleQuantityChange(item.id, 1)}
                          plain
                          size="micro"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                    {selectedItems[item.id] > 0 && (
                      <>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem",
                          }}
                        >
                          <Text variant="bodyMd" fontWeight="semibold">
                            Reason
                          </Text>
                          <AutocompleteMultiSelect
                            options={REASON_OPTIONS}
                            placeholder="Select reason"
                            selectedOptions={selectedReasons[item.id] || []}
                            onSelect={(selected) =>
                              setSelectedReasons((prev) => ({
                                ...prev,
                                [item.id]: selected,
                              }))
                            }
                          />
                        </div>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem",
                          }}
                        >
                          <Text variant="bodyMd" fontWeight="semibold">
                            Notes (optional)
                          </Text>
                          <TextField
                            multiline
                            maxLength={500}
                            value={notes[item.id] || ""}
                            onChange={(value) =>
                              handleNotesChange(item.id, value)
                            }
                            placeholder="Add any notes here"
                            showCharacterCount
                          />
                        </div>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem",
                          }}
                        >
                          <Text variant="bodyMd" fontWeight="semibold">
                            Proof (optional)
                          </Text>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                            }}
                          >
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={(e) => {
                                const files = Array.from(e.target.files);
                                handleProofFileChange(item.id, [
                                  ...(proofFiles[item.id] || []),
                                  ...files,
                                ]);
                                e.target.value = null;
                              }}
                              style={{ display: "none" }}
                              id={`proof-upload-${item.id}`}
                            />
                            <button
                              onClick={() =>
                                document
                                  .getElementById(`proof-upload-${item.id}`)
                                  .click()
                              }
                              style={{
                                width: "48px",
                                height: "48px",
                                border: "2px dashed #C4C4C4",
                                borderRadius: "8px",
                                backgroundColor: "transparent",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                cursor: "pointer",
                              }}
                              aria-label="Upload proof"
                            >
                              <UploadIcon />
                            </button>
                            {proofFiles[item.id] &&
                              proofFiles[item.id].length > 0 && (
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "8px",
                                    flexWrap: "nowrap",
                                    alignItems: "center",
                                  }}
                                >
                                  {proofFiles[item.id].map((file, index) => {
                                    const fileUrl = URL.createObjectURL(file);
                                    return (
                                      <div
                                        key={index}
                                        style={{
                                          position: "relative",
                                          width: "48px",
                                          height: "48px",
                                          overflow: "hidden",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                      >
                                        <PolarisThumbnail
                                          size="large"
                                          alt={file.name}
                                          source={fileUrl}
                                          style={{
                                            width: "48px",
                                            height: "48px",
                                            objectFit: "cover",
                                          }}
                                        />
                                        <button
                                          onClick={() => {
                                            const newFiles = (
                                              proofFiles[item.id] || []
                                            ).filter(
                                              (f) => f.name !== file.name,
                                            );
                                            handleProofFileChange(
                                              item.id,
                                              newFiles,
                                            );
                                          }}
                                          style={{
                                            position: "absolute",
                                            top: "0px",
                                            right: "0px",
                                            backgroundColor: "#fff",
                                            borderRadius: "50%",
                                            border: "1px solid #D1D5DB",
                                            width: "20px",
                                            height: "20px",
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            cursor: "pointer",
                                            padding: 0,
                                          }}
                                          aria-label={`Remove ${file.name}`}
                                        >
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={2}
                                            stroke="currentColor"
                                            style={{
                                              width: "14px",
                                              height: "14px",
                                              color: "#6B7280",
                                            }}
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              d="M6 18L18 6M6 6l12 12"
                                            />
                                          </svg>
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {validSelection && (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      primary
                      disabled={!validSelection}
                      onClick={() => setStep(2)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {step === 2 && (
            <Card sectioned padding="0">
              <div style={{ padding: "20px 0px 15px 17px" }}>
                <Text variant="headingMd" as="h3">
                  Select method to submit
                </Text>
              </div>

              <Divider />

              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  padding: "20px 17px",
                }}
              >
                <div
                  style={{
                    border: selectedMethod === "reorder" ? "1px solid #EBCEED" : "1px solid #E6E6E6",
                    borderRadius: "5px",
                    padding: "1rem",
                    cursor: "pointer",
                    display: "flex",
                    flex: "1",
                    alignItems: "center",

                    backgroundColor: selectedMethod === "reorder" ? "#F3ECF7" : undefined,
                  }}
                  onClick={() => setSelectedMethod("reorder")}
                >
                  <div
                    style={{
                      marginRight: "1rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "50px",
                      height: "50px",
                      borderRadius: "5px",
                      background: "linear-gradient(134deg, #EFDEF2 4.31%, #E3D9EF 95.02%)",
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="20"
                      viewBox="0 0 15 20"
                      fill="none"
                    >
                      <path
                        d="M13.0233 8.83721H1.86047C1.36704 8.83721 0.893822 9.03322 0.544918 9.38213C0.196013 9.73103 0 10.2042 0 10.6977V18.1395C0 18.633 0.196013 19.1062 0.544918 19.4551C0.893822 19.804 1.36704 20 1.86047 20H13.0233C13.5167 20 13.9899 19.804 14.3388 19.4551C14.6877 19.1062 14.8837 18.633 14.8837 18.1395V10.6977C14.8837 10.2042 14.6877 9.73103 14.3388 9.38213C13.9899 9.03322 13.5167 8.83721 13.0233 8.83721ZM13.0233 18.1395H1.86047V14.4186H13.0233V18.1395ZM13.0233 12.5581H1.86047V10.6977H13.0233V12.5581ZM12.093 3.25581V7.90698H10.6977V4.65116H5.46977L7.72093 6.91163L6.73488 7.90698L2.7907 3.95349L6.73488 0L7.72093 0.995349L5.46977 3.25581H12.093Z"
                        fill="#CC62C7"
                      />
                    </svg>
                  </div>
                  <div>
                    <Text variant="bodyMd" fontWeight="semibold">
                      Reorder
                    </Text>
                    <Text variant="bodySm" color="subdued">
                      Reordering same item(s). This will create a new order.
                    </Text>
                  </div>
                </div>
                <div
                  style={{
                    border: selectedMethod === "refund" ? "1px solid #EBCEED" : "1px solid #E6E6E6",
                    borderRadius: "5px",
                    padding: "1rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    flex: "1",
                    backgroundColor: selectedMethod === "refund" ? "#F3ECF7" : undefined,

                  }}
                  onClick={() => setSelectedMethod("refund")}
                >
                  <div
                    style={{
                      marginRight: "1rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "50px",
                      height: "50px",
                      borderRadius: "5px",
                      background:
                        "linear-gradient(134deg, #EFDEF2 4.31%, #E3D9EF 95.02%)",
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="20"
                      viewBox="0 0 15 20"
                      fill="none"
                    >
                      <path
                        d="M13.0233 8.83721H1.86047C1.36704 8.83721 0.893822 9.03322 0.544918 9.38213C0.196013 9.73103 0 10.2042 0 10.6977V18.1395C0 18.633 0.196013 19.1062 0.544918 19.4551C0.893822 19.804 1.36704 20 1.86047 20H13.0233C13.5167 20 13.9899 19.804 14.3388 19.4551C14.6877 19.1062 14.8837 18.633 14.8837 18.1395V10.6977C14.8837 10.2042 14.6877 9.73103 14.3388 9.38213C13.9899 9.03322 13.5167 8.83721 13.0233 8.83721ZM13.0233 18.1395H1.86047V14.4186H13.0233V18.1395ZM13.0233 12.5581H1.86047V10.6977H13.0233V12.5581ZM12.093 3.25581V7.90698H10.6977V4.65116H5.46977L7.72093 6.91163L6.73488 7.90698L2.7907 3.95349L6.73488 0L7.72093 0.995349L5.46977 3.25581H12.093Z"
                        fill="#CC62C7"
                      />
                    </svg>
                  </div>
                  <div>
                    <Text variant="bodyMd" fontWeight="semibold">
                      Refund
                    </Text>
                    <Text variant="bodySm" color="subdued">
                      Payment will be refunded to original payment method.
                    </Text>
                  </div>
                </div>
              </div>

              <Divider/>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  padding: "20px 12px 20px 0px",
                  gap: "1rem",
                }}
              >
                <Button onClick={() => setStep(1)}>Previous</Button>
                <Button
                  primary
                  disabled={!selectedMethod}
                  onClick={() =>
                    alert(`Submitted with method: ${selectedMethod} , ${JSON.stringify(claimData)}`)
                  }
                >
                  Submit
                </Button>
              </div>
            </Card>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}
