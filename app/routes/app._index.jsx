import { useState } from "react";
import { useFetcher, json, useLoaderData, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  Popover,
  BlockStack,
  InlineStack,
  InlineGrid,
  Grid,
  LegacyCard,
  List,
  ActionList,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { MenuHorizontalIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import DateRangePicker from "../components/DateRangePicker";
import OrderData from "../components/Orderdata";
import Faq from "../components/Faq";
import SalesChart from "../components/Sale_Chart";
import styles from "./_index/styles.module.css";





export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");

  let dateFilter = "";
  if (start && end) {
    dateFilter = `, query: "created_at:>=${start} created_at:<=${end}"`;
  }

  const query = `
    query {
      orders(first: 50, sortKey: CREATED_AT, reverse: true${dateFilter}) {
        edges {
          node {
            currencyCode
            createdAt
            lineItems(first: 20) {
              edges {
                node {
                  title
                  quantity
                  variant { price }
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await (await admin.graphql(query)).json();

  // Filter orders with SP + another product
  const filtered = data.data.orders.edges
    .map(e => e.node)
    .filter(o => {
      const titles = o.lineItems.edges.map(li => li.node.title);
      const hasSP = titles.some(t => t.toLowerCase().includes("shipping protection"));
      const hasOther = titles.some(t => !t.toLowerCase().includes("shipping protection"));
      return hasSP && hasOther;
    });

  return json({ orders: filtered, start, end });
}




export default function Index() {
  const { orders, start, end } = useLoaderData();
  const navigate = useNavigate();



  const [active, setActive] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [disabled, setDisabled] = useState(false);



  const [active2, setActive2] = useState(false);
  const [hidden2, setHidden2] = useState(false);
  const [disabled2, setDisabled2] = useState(false);


  const toggleActive2 = () => setActive2((prev) => !prev);
  const toggleActive = () => setActive((prev) => !prev);



  const CheckIcon = ({ size = 28 }) => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 28 28"
        fill="none"
      >
        <rect
          opacity="0.33"
          width="28"
          height="28"
          rx="14"
          fill="url(#paint0_linear_8_170)"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M19.7293 10.1794C19.8041 10.2436 19.8656 10.3218 19.9101 10.4097C19.9547 10.4976 19.9815 10.5934 19.989 10.6917C19.9966 10.7899 19.9846 10.8887 19.954 10.9823C19.9233 11.076 19.8745 11.1627 19.8103 11.2374L13.8103 18.2374C13.743 18.3159 13.6603 18.3797 13.5672 18.4246C13.4741 18.4696 13.3728 18.4949 13.2695 18.4988C13.1662 18.5027 13.0632 18.4853 12.967 18.4475C12.8707 18.4098 12.7833 18.3526 12.7103 18.2794L9.21029 14.7794C9.07374 14.6379 8.99823 14.4484 9.00003 14.2518C9.00183 14.0551 9.0808 13.8671 9.21992 13.7281C9.35904 13.5891 9.54719 13.5103 9.74384 13.5087C9.94049 13.5071 10.1299 13.5828 10.2713 13.7194L13.1993 16.6464L18.6723 10.2614C18.8018 10.1106 18.9858 10.0174 19.184 10.0022C19.3822 9.98701 19.5783 10.0501 19.7293 10.1794Z"
          fill="white"
        />
        <defs>
          <linearGradient
            id="paint0_linear_8_170"
            x1="0.933333"
            y1="1.49333"
            x2="26.88"
            y2="26.32"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#CC62C7" />
            <stop offset="1" stopColor="#592BA8" />
          </linearGradient>
        </defs>
      </svg>
    );
  };





  return (
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
                Welcome to Shipmatic 👋
              </Text>
              <DateRangePicker onApply={({ startDate, endDate }) => {
                const start = startDate.toISOString().slice(0, 10);
                const end = endDate.toISOString().slice(0, 10);
                navigate(`?start=${start}&end=${end}`);
              }} />
            </div>

            <Card roundedAbove="sm">
              <InlineStack gap="400" blockAlign="center" align="space-between">
                {/* Left side: icon + text + stars */}
                <InlineStack gap="200" blockAlign="center">
                  {/* Icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="28"
                    height="28"
                    viewBox="0 0 28 28"
                    fill="none"
                  >
                    <rect
                      opacity="0.33"
                      width="28"
                      height="28"
                      rx="14"
                      fill="url(#paint0_linear_7_118)"
                    />
                    <path
                      d="M7 13.0793C7 16.4691 9.814 18.2752 11.8734 19.8924C12.6 20.4626 13.3 21 14 21C14.7 21 15.4 20.4633 16.1266 19.8917C18.1867 18.2759 21 16.4691 21 13.08C21 9.69094 17.15 7.2854 14 10.5448C10.85 7.2854 7 9.68955 7 13.0793Z"
                      fill="white"
                    />
                    <defs>
                      <linearGradient
                        id="paint0_linear_7_118"
                        x1="0.933333"
                        y1="1.49333"
                        x2="26.88"
                        y2="26.32"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#CC62C7" />
                        <stop offset="1" stopColor="#592BA8" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Text */}
                  <Text as="p">
                    Thanks for using Shipmatic. We’d love it if you could share
                    your experience with us.
                  </Text>

                 
                </InlineStack>

                {/* Right side: "..." menu */}
                <Popover
                  active={active}
                  activator={
                    <Button
                      icon={MenuHorizontalIcon}
                      onClick={toggleActive}
                      accessibilityLabel="More actions"
                    />
                  }
                  onClose={toggleActive}
                  autofocusTarget="first-node"
                >
                  <ActionList
                    items={[
                      { content: "Hide", onAction: () => setHidden(true) },
                      { content: "Disable", onAction: () => setDisabled(true) },
                    ]}
                  />
                </Popover>
              </InlineStack>
            </Card>

            <Card roundedAbove="sm">
              <InlineStack gap="400" blockAlign="center" align="space-between">
                <InlineStack gap="400">
                  <Text as="h4" variant="headingXl">Setup tutorial</Text>
                  <Card padding="300">
                    <Text as="h6" variant="headingXs">
                      1 / 3 completed
                    </Text>
                  </Card>
                </InlineStack>
                <InlineStack gap="400">
                  <Popover
                    active={active2}
                    activator={
                      <Button
                        icon={MenuHorizontalIcon}
                        onClick={toggleActive2}
                        accessibilityLabel="More actions"
                      />
                    }
                    onClose={toggleActive2}
                    autofocusTarget="first-node"
                  >
                    <ActionList
                      items={[
                        { content: "Test", onAction: () => setHidden2(true) },
                        { content: "Test2", onAction: () => setDisabled2(true) },
                      ]}
                    />
                  </Popover>

                </InlineStack>

              </InlineStack>


<div className={styles.outer_st}>
              <InlineGrid
                gap="400"
                columns={{ xs: 1, sm: 3, md: 3, lg: 3, xl: 3 }}
              >
                <div className={styles.outer_setup} >
                  <BlockStack gap="400">
                    <InlineStack gap="400">
                      <CheckIcon size={28} />
                      <Text>Enable app embed</Text>
                      <Text>
                        Please follow the 👉 help docs to enable app embed and complete setup.
                        This step won't affect your live store. Widget will not appear on your storefront until you've published it from our app.
                      </Text>
                      <Button>Enable app embed</Button>
                      <img src="https://cdn.shopify.com/s/files/1/0605/9891/1037/files/Vector.png" />


                    </InlineStack>
                  </BlockStack>
                </div>

                <div className={styles.outer_setup}>
                  <BlockStack gap="400">
                    <InlineStack gap="400">
                      <CheckIcon size={28} />
                      <Text>Enable app embed</Text>
                      <Text>
                        Publish shipping protection, and set any price and design that fits your brand.
                        View help docs
                      </Text>
                      <Button>Publish widget</Button>
                    </InlineStack>
                  </BlockStack>
                </div>

                <div className={styles.outer_setup}>
                  <BlockStack gap="400">
                    <InlineStack gap="400">
                      <CheckIcon size={28} />
                      <Text>Enable app embed</Text>
                      <List type="bullet">
                        <List.Item>You retain your protection fees. We are not an insurer.</List.Item>
                        <List.Item>With shipping protection widget enabled, your customers can buy protection for their orders.</List.Item>
                        <List.Item>Increase additional order revenue from today.</List.Item>
                      </List>
                    </InlineStack>
                  </BlockStack>
                </div>
              </InlineGrid>
</div>

            </Card>


            <Card roundedAbove="sm">
              <InlineGrid
                gap="400"
                columns={{ xs: 1, sm: 3, md: 3, lg: 3, xl: 3 }}
              >
                <div className={styles.sale_price_mp}>
                  <Text variant="headingSm" as="h6">Shipping protection sales</Text>

                  <OrderData orders={orders} type="total" />
                </div>
                <div className={styles.sale_price_mp}>
                  <Text variant="headingSm" as="h6">Insured orders</Text>
                  <OrderData orders={orders} type="count" />
                </div>
                <div className={styles.sale_price_mp}>
                  <Text variant="headingSm" as="h6">Refund amount</Text>
                  <Text variant="heading3xl" as="h2" >€0.00 EUR</Text>
                </div>

              </InlineGrid>

            </Card>

            <Card roundedAbove="sm">
<Text variant="headingSm" as="h6">Shipping protection sales (€)</Text>
<SalesChart orders={orders} start={start} end={end}/>

            </Card>

            <Card roundedAbove="sm" >    
                <InlineStack align="space-between" >
      <Text as="h2" variant="headingMd">
        FAQ
      </Text>
      <Button>Learn more</Button>
    </InlineStack>         
<Faq faq_heading="Shipping protection widget display exception" Faq_ans="Shipping protection widget <span>display</span> exception"/>
<Faq faq_heading="How does shipping protection program work?" Faq_ans="You have full  control over claims management, while shipping protection operates as a  digital product, allowing you to retain premiums."/>
<Faq faq_heading="Uninstalling the app" Faq_ans="This app won't add any codes to your store theme, simply uninstall it and remove the digital product from your product listing."/>             
            </Card>

                <Card roundedAbove="sm">   
                  <Text variant="headingSm" as="h6">Support</Text>
                  <InlineGrid
                gap="400"
                columns={{ xs: 1, sm: 3, md: 3, lg: 3, xl: 3 }}
              >
                <div className={styles.support_mp}>
                  <InlineStack gap="200">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
  <rect opacity="0.33" width="28" height="28" rx="14" fill="url(#paint0_linear_827_150)"/>
  <path d="M17.3615 15.5865C17.3615 16.1997 17.5357 16.4443 17.9915 16.4443C19.0072 16.4443 19.654 15.1484 19.654 12.9932C19.654 9.6991 17.2565 8.12213 14.2632 8.12213C11.184 8.12213 8.38323 10.1897 8.38323 14.0971C8.38323 17.8293 10.8332 19.8618 14.5957 19.8618C15.8732 19.8618 16.7307 19.7216 18.0425 19.2836L18.324 20.4568C17.029 20.8781 15.645 21 14.5782 21C9.64323 21 7 18.2841 7 14.0964C7 9.87359 10.0632 7 14.2807 7C18.6732 7 21 9.62829 21 12.8523C21 15.5857 20.1432 17.6708 17.4482 17.6708C16.2225 17.6708 15.4182 17.1802 15.3132 16.0931C14.9982 17.3021 14.1582 17.6708 13.02 17.6708C11.4975 17.6708 10.22 16.4961 10.22 14.1314C10.22 11.7484 11.3407 10.2766 13.3532 10.2766C14.4207 10.2766 15.0857 10.6971 15.3818 11.363L15.89 10.4343H17.36V15.5865H17.3615ZM15.2097 13.2736C15.2097 12.3106 14.4915 11.9069 13.8965 11.9069C13.249 11.9069 12.5322 12.4318 12.5322 13.9744C12.5322 15.201 13.0747 15.8843 13.8965 15.8843C14.474 15.8843 15.2097 15.5164 15.2097 14.5001V13.2736Z" fill="white"/>
  <defs>
    <linearGradient id="paint0_linear_827_150" x1="0.933333" y1="1.49333" x2="26.88" y2="26.32" gradientUnits="userSpaceOnUse">
      <stop stop-color="#CC62C7"/>
      <stop offset="1" stop-color="#592BA8"/>
    </linearGradient>
  </defs>
</svg>
<Text variant="headingSm" as="h6">Email support</Text>
                  </InlineStack>
<Text>Connect via email and we'll reply promptly.</Text>
        
                </div>
                 <div className={styles.support_mp}>
                  <InlineStack gap="200">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
  <rect opacity="0.33" width="28" height="28" rx="14" fill="url(#paint0_linear_827_159)"/>
  <path d="M14 8C17.85 8 21 10.3867 21 13.3333C21 16.28 17.85 18.6667 14 18.6667C13.132 18.6667 12.299 18.5467 11.529 18.3333C9.485 20 7 20 7 20C8.631 18.4467 8.89 17.4 8.925 17C7.735 16.0467 7 14.7533 7 13.3333C7 10.3867 10.15 8 14 8Z" fill="white"/>
  <defs>
    <linearGradient id="paint0_linear_827_159" x1="0.933333" y1="1.49333" x2="26.88" y2="26.32" gradientUnits="userSpaceOnUse">
      <stop stop-color="#CC62C7"/>
      <stop offset="1" stop-color="#592BA8"/>
    </linearGradient>
  </defs>
</svg>
<Text variant="headingSm" as="h6">Instant live chat</Text>
                  </InlineStack>
<Text>Get immediate assistance by chatting with our team.</Text>
        
                </div>
                <div className={styles.support_mp}>
                  <InlineStack gap="200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
  <rect opacity="0.33" width="28" height="28" rx="14" fill="url(#paint0_linear_827_168)"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M14.5 7V10.5378C14.5 10.8346 14.5 11.1237 14.5316 11.3617C14.5667 11.6298 14.6533 11.9357 14.9029 12.1898C15.1524 12.4439 15.4529 12.5321 15.7169 12.5678C15.9506 12.6 16.2339 12.6 16.5254 12.6H20V16.8C20 18.7796 20 19.7701 19.3957 20.3847C18.7921 21 17.8193 21 15.875 21H13.125C11.1807 21 10.2079 21 9.60431 20.3847C9 19.7701 9 18.7796 9 16.8V11.2C9 9.2204 9 8.2299 9.60431 7.6153C10.2079 7 11.1807 7 13.125 7H14.5ZM15.875 7.0035V10.5C15.875 10.85 15.8764 11.0418 15.8942 11.1748V11.1797L15.8998 11.1804C16.0304 11.1986 16.2188 11.2 16.5625 11.2H19.9966C19.9897 10.9116 19.967 10.7212 19.8955 10.5441C19.791 10.2872 19.5923 10.0842 19.1942 9.6796L17.3683 7.8204C16.9709 7.4158 16.7722 7.2128 16.5192 7.1064C16.3453 7.0329 16.1582 7.0105 15.875 7.0035ZM11.75 14.7C11.75 14.5143 11.8224 14.3363 11.9514 14.205C12.0803 14.0738 12.2552 14 12.4375 14H16.5625C16.7448 14 16.9197 14.0738 17.0486 14.205C17.1776 14.3363 17.25 14.5143 17.25 14.7C17.25 14.8857 17.1776 15.0637 17.0486 15.195C16.9197 15.3263 16.7448 15.4 16.5625 15.4H12.4375C12.2552 15.4 12.0803 15.3263 11.9514 15.195C11.8224 15.0637 11.75 14.8857 11.75 14.7ZM12.4375 16.8C12.2552 16.8 12.0803 16.8737 11.9514 17.005C11.8224 17.1363 11.75 17.3143 11.75 17.5C11.75 17.6857 11.8224 17.8637 11.9514 17.995C12.0803 18.1263 12.2552 18.2 12.4375 18.2H15.1875C15.3698 18.2 15.5447 18.1263 15.6736 17.995C15.8026 17.8637 15.875 17.6857 15.875 17.5C15.875 17.3143 15.8026 17.1363 15.6736 17.005C15.5447 16.8737 15.3698 16.8 15.1875 16.8H12.4375Z" fill="white"/>
  <defs>
    <linearGradient id="paint0_linear_827_168" x1="0.933333" y1="1.49333" x2="26.88" y2="26.32" gradientUnits="userSpaceOnUse">
      <stop stop-color="#CC62C7"/>
      <stop offset="1" stop-color="#592BA8"/>
    </linearGradient>
  </defs>
</svg>
<Text variant="headingSm" as="h6">Captain help center</Text>
                  </InlineStack>
<Text>Find solutions to your questions in Captain documents.</Text>
        
                </div>

              </InlineGrid>
                  </Card>

          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
