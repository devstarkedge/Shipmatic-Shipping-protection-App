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
      senderEmail: settings?.senderEmail || "no-reply@captaintop.net",
      replyEmail: settings?.replyEmail || "shopifydevse@gmail.com",
      claimSubmitted: settings?.claimSubmitted !== undefined ? settings.claimSubmitted : true,
      claimApprovedRefunded: settings?.claimApprovedRefunded !== undefined ? settings.claimApprovedRefunded : true,
      claimApprovedReordered: settings?.claimApprovedReordered !== undefined ? settings.claimApprovedReordered : true,
      claimDeclined: settings?.claimDeclined !== undefined ? settings.claimDeclined : false,
    }
  };
}

export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const claimSubmitted = formData.get("claimSubmitted") === 'true';
  const claimApprovedRefunded = formData.get("claimApprovedRefunded") === 'true';
  const claimApprovedReordered = formData.get("claimApprovedReordered") === 'true';
  const claimDeclined = formData.get("claimDeclined") === 'true';

  try {
    await prisma.notification_settings.upsert({
      where: { shop },
      update: {
        claimSubmitted,
        claimApprovedRefunded,
        claimApprovedReordered,
        claimDeclined,
      },
      create: {
        shop,
        claimSubmitted,
        claimApprovedRefunded,
        claimApprovedReordered,
        claimDeclined,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating notification settings:", error);
    return { success: false, error: error.message };
  }
}

export default function NotificationSettings() {
  const shopify = useAppBridge();
  const { settings } = useLoaderData();
  const fetcher = useFetcher();

  const [claimSubmitted, setClaimSubmitted] = useState(settings.claimSubmitted);
  const [claimApprovedRefunded, setClaimApprovedRefunded] = useState(settings.claimApprovedRefunded);
  const [claimApprovedReordered, setClaimApprovedReordered] = useState(settings.claimApprovedReordered);
  const [claimDeclined, setClaimDeclined] = useState(settings.claimDeclined);
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSavedData, setLastSavedData] = useState(null);
  const [baselineSettings, setBaselineSettings] = useState({
    claimSubmitted: settings.claimSubmitted,
    claimApprovedRefunded: settings.claimApprovedRefunded,
    claimApprovedReordered: settings.claimApprovedReordered,
    claimDeclined: settings.claimDeclined,
  });

  useEffect(() => {
    if (!isDirty && !isSubmitting && !fetcher.state) {
      setClaimSubmitted(settings.claimSubmitted);
      setClaimApprovedRefunded(settings.claimApprovedRefunded);
      setClaimApprovedReordered(settings.claimApprovedReordered);
      setClaimDeclined(settings.claimDeclined);
      setBaselineSettings({
        claimSubmitted: settings.claimSubmitted,
        claimApprovedRefunded: settings.claimApprovedRefunded,
        claimApprovedReordered: settings.claimApprovedReordered,
        claimDeclined: settings.claimDeclined,
      });
    }
  }, [settings, isDirty, isSubmitting, fetcher.state]);

  useEffect(() => {
    const hasChanges =
      claimSubmitted !== baselineSettings.claimSubmitted ||
      claimApprovedRefunded !== baselineSettings.claimApprovedRefunded ||
      claimApprovedReordered !== baselineSettings.claimApprovedReordered ||
      claimDeclined !== baselineSettings.claimDeclined;

    setIsDirty(hasChanges);

    if (hasChanges) {
      shopify.saveBar?.show("notification-settings-save-bar");
    } else {
      shopify.saveBar?.hide("notification-settings-save-bar");
    }
  }, [claimSubmitted, claimApprovedRefunded, claimApprovedReordered, claimDeclined, baselineSettings, shopify]);

  const handleSave = useCallback(() => {
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("claimSubmitted", claimSubmitted.toString());
    formData.append("claimApprovedRefunded", claimApprovedRefunded.toString());
    formData.append("claimApprovedReordered", claimApprovedReordered.toString());
    formData.append("claimDeclined", claimDeclined.toString());
    setLastSavedData({ claimSubmitted, claimApprovedRefunded, claimApprovedReordered, claimDeclined });
    fetcher.submit(formData, { method: "post" });
  }, [claimSubmitted, claimApprovedRefunded, claimApprovedReordered, claimDeclined, fetcher, shopify]);

  useEffect(() => {
    if (fetcher.data?.success && lastSavedData) {
      setClaimSubmitted(lastSavedData.claimSubmitted);
      setClaimApprovedRefunded(lastSavedData.claimApprovedRefunded);
      setClaimApprovedReordered(lastSavedData.claimApprovedReordered);
      setClaimDeclined(lastSavedData.claimDeclined);
      setBaselineSettings({
        claimSubmitted: lastSavedData.claimSubmitted,
        claimApprovedRefunded: lastSavedData.claimApprovedRefunded,
        claimApprovedReordered: lastSavedData.claimApprovedReordered,
        claimDeclined: lastSavedData.claimDeclined,
      });
      setIsDirty(false);
      shopify.saveBar?.hide("notification-settings-save-bar");
      setLastSavedData(null);
      setIsSubmitting(false);
      shopify.toast.show("Notification settings saved successfully.");
    } else if (fetcher.data && !fetcher.data.success) {
      setIsSubmitting(false);
      shopify.toast.show("Failed to save notification settings.", { isError: true });
    }
  }, [fetcher.data, lastSavedData, shopify]);

  const handleDiscard = useCallback(() => {
    setClaimSubmitted(baselineSettings.claimSubmitted);
    setClaimApprovedRefunded(baselineSettings.claimApprovedRefunded);
    setClaimApprovedReordered(baselineSettings.claimApprovedReordered);
    setClaimDeclined(baselineSettings.claimDeclined);
    setIsDirty(false);
    shopify.saveBar?.hide("notification-settings-save-bar");
  }, [baselineSettings, shopify]);

  return (
    <>
      <SaveBar id="notification-settings-save-bar" open={isDirty}>
        <button variant="primary" onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </button>
        <button onClick={handleDiscard} disabled={isSubmitting}>
          Discard
        </button>
      </SaveBar>

      <Layout>
        <Layout.Section>

          <BlockStack gap="400">
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h2" >
                  Sender info
                </Text>

                <BlockStack gap="100">
                  <Text>
                    Sender name: {settings.senderName}
                  </Text>
                  <Text>
                    Sender email: {settings.senderEmail}
                  </Text>
                  <Text>
                    Reply email address: {settings.replyEmail}
                  </Text>
                </BlockStack>

              </BlockStack>



            </Card>

          <Card padding="0">
            <BlockStack gap="300">

              <div style={{ padding: "17px 0px 0px 20px" }}>
                <Text variant="headingMd" as="h2" >
                  Email templates
                </Text>

              </div>
              <Divider />



            </BlockStack>


            <div style={{ padding: "17px 20px" }}>
              <BlockStack gap="300">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', }}>
                  <Text>Claim request submittedSuccess</Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: "10px" }}>
                    <Badge status="success" >
                      On
                    </Badge>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={claimSubmitted}
                        onChange={() => setClaimSubmitted(!claimSubmitted)}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                </div>

                <Divider />


                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', }}>
                  <Text>Claim approved - refundedSuccess</Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: "10px" }}>
                    <Badge status="success" >
                      On
                    </Badge>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={claimApprovedRefunded}
                        onChange={() => setClaimApprovedRefunded(!claimApprovedRefunded)}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                </div>

                <Divider />


                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', }}>
                  <Text>Claim approved - reorderedSuccess</Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: "10px" }}>
                    <Badge status="success" >
                      On
                    </Badge>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={claimApprovedReordered}
                        onChange={() => setClaimApprovedReordered(!claimApprovedReordered)}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                </div>

                <Divider />


                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text>Claim declinedSuccess</Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: "10px" }}>
                    <Badge status={claimDeclined ? "success" : "attention"} >
                      {claimDeclined ? "On" : "Off"}
                    </Badge>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={claimDeclined}
                        onChange={() => setClaimDeclined(!claimDeclined)}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                </div>
              </BlockStack>
            </div>

          </Card>

        </BlockStack>

      </Layout.Section>
    </Layout>
    </>
  );
}
