import { useState, useEffect, useCallback } from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { json } from "@remix-run/node";
import {
  Card,
  Layout,
  Text,
  BlockStack,
} from "@shopify/polaris";
import { useAppBridge, SaveBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import styles from "./_index/styles.module.css";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const settings = await prisma.general_settings.findUnique({
    where: { shop },
  });

  return {
    settings: {
      ...settings,
      shop,
    }
  };
}

export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const setupTutorialEnabled = formData.get("setupTutorialEnabled") === "true";

  await prisma.general_settings.upsert({
    where: { shop },
    update: { setupTutorialEnabled },
    create: { shop, setupTutorialEnabled },
  });

  return json({ success: true });
}

export default function GeneralSettings() {
  const shopify = useAppBridge();
  const data = useLoaderData();
  const fetcher = useFetcher();

  const [setupTutorialEnabled, setSetupTutorialEnabled] = useState(data.settings?.setupTutorialEnabled || false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSavedData, setLastSavedData] = useState(null);
  const [baselineSettings, setBaselineSettings] = useState({
    setupTutorialEnabled: data.settings?.setupTutorialEnabled || false,
  });

  useEffect(() => {
    if (!isDirty && !isSubmitting && !fetcher.state) {
      setSetupTutorialEnabled(data.settings?.setupTutorialEnabled || false);
      setBaselineSettings({
        setupTutorialEnabled: data.settings?.setupTutorialEnabled || false,
      });
    }
  }, [data.settings?.setupTutorialEnabled, isDirty, isSubmitting, fetcher.state]);

  useEffect(() => {
    const hasChanges = setupTutorialEnabled !== baselineSettings.setupTutorialEnabled;
    setIsDirty(hasChanges);

    if (hasChanges) {
      shopify.saveBar?.show("general-settings-save-bar");
    } else {
      shopify.saveBar?.hide("general-settings-save-bar");
    }
  }, [setupTutorialEnabled, baselineSettings, shopify]);

  const handleToggle = useCallback(() => {
    setSetupTutorialEnabled(!setupTutorialEnabled);
  }, [setupTutorialEnabled]);

  const handleSave = useCallback(() => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("setupTutorialEnabled", setupTutorialEnabled.toString());
    setLastSavedData({ setupTutorialEnabled });
    fetcher.submit(formData, { method: "post" });
  }, [setupTutorialEnabled, fetcher]);

  useEffect(() => {
    if (fetcher.data?.success && lastSavedData) {
      setSetupTutorialEnabled(lastSavedData.setupTutorialEnabled);
      setBaselineSettings({
        setupTutorialEnabled: lastSavedData.setupTutorialEnabled,
      });
      setIsDirty(false);
      shopify.saveBar?.hide("general-settings-save-bar");
      setLastSavedData(null);
      setIsSubmitting(false);
      shopify.toast.show("General settings saved successfully.");
    } else if (fetcher.data && !fetcher.data.success) {
      setIsSubmitting(false);
      shopify.toast.show("Failed to save general settings.", { isError: true });
    }
  }, [fetcher.data, lastSavedData, shopify]);

  const handleDiscard = useCallback(() => {
    setSetupTutorialEnabled(baselineSettings.setupTutorialEnabled);
    setIsDirty(false);
    shopify.saveBar?.hide("general-settings-save-bar");
  }, [baselineSettings, shopify]);

  return (
    <>
      <SaveBar id="general-settings-save-bar" open={isDirty}>
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
                <Text variant="headingMd" as="h2">
                  App Settings
                </Text>

                <BlockStack gap="100">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '30px' }}>
                    <Text as="h2" variant="headingSm">
                      Setup Tutorial
                    </Text>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={setupTutorialEnabled}
                        onChange={handleToggle}
                        aria-label="Setup Tutorial switch"
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                </BlockStack>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </>
  );
}
