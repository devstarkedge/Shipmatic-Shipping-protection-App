import { useState, useEffect, useCallback } from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import {
  Card,
  Layout,
  Text,
  Badge,
  BlockStack,
  Divider,
  TextField,
} from "@shopify/polaris";
import { useAppBridge, SaveBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import styles from "./_index/styles.module.css";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const settings = await prisma.notification_settings.findUnique({
    where: { shop },
  });

  return {
    settings: {
      ...settings,
      shop,
      senderName: settings?.senderName || "wisdom-app-setup",
   
    }
  };
}



export default function GeneralSettings() {

  return (
    <>
     

      <Layout>
        <Layout.Section>

          <BlockStack gap="400">
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h2" >
                  App Settings
                </Text>

                <BlockStack gap="100">
                  <Text>
                    
                  </Text>
                  
                </BlockStack>

              </BlockStack>



            </Card>

         

        </BlockStack>

      </Layout.Section>
    </Layout>
    </>
  );
}
