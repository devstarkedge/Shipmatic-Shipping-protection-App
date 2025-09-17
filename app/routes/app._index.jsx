import { useState } from "react";
import { useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  Popover,
  BlockStack,
  InlineStack,
  ActionList, 
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { MenuHorizontalIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import DateRangePicker from "../components/DateRangePicker";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function Index() {
  const [rating, setRating] = useState(0);


  const [active, setActive] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [disabled, setDisabled] = useState(false);

  const handleRating = (value) => {
    setRating(value);
  };

  const toggleActive = () => setActive((prev) => !prev);

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
              <DateRangePicker />
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

                  {/* ⭐ Stars */}
                  <InlineStack gap="100">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        onClick={() => handleRating(star)}
                        style={{
                          cursor: "pointer",
                          color: rating >= star ? "#FFD700" : "#CCCCCC",
                          fontSize: "24px",
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </InlineStack>
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
   <Text as="h2" variant="headingMd">Setup tutorial</Text>
<Card>
      <Text as="h2" variant="headingMd">
        1 / 3 completed
      </Text>
    </Card>
    </InlineStack>
<InlineStack gap="400">
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
                        { content: "Test", onAction: () => setHidden(true) },
                        { content: "Test2", onAction: () => setDisabled(true) },
                      ]}
                    />
                  </Popover>

    </InlineStack>

   </InlineStack>
</Card>


          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
