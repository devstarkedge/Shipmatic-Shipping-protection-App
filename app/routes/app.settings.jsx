import {
  Page,
  Layout,
  BlockStack,
  Card,
  OptionList,
  Scrollable
} from "@shopify/polaris";
import { useState, useCallback, useEffect } from "react";
import { useNavigate, Outlet } from "@remix-run/react";
import styles from "./_index/styles.module.css";

export default function settings() {

  const [selected, setSelected] = useState(["protection_setting"]);
  const navigate = useNavigate();

  const handleOptionChange = useCallback((selectedValues) => {
    setSelected(selectedValues);

    if (selectedValues.includes("protection_setting")) {
      navigate("/app/settings");
    }
  }, [navigate]);

  useEffect(() => {
    if (selected.includes("protection_setting")) {
      navigate("/app/settings");
    } else if (selected.includes("claim_portal_preference")) {
      navigate("/app/settings/claimPortal");
    }else if (selected.includes("notification")) {
      navigate("/app/settings/notifications");
    }
  }, [selected, navigate]);

  return (
    <Page title="Settings">

      <Layout>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <OptionList
                title=""
                titleHidden
                options={[
                  {
                    label: "Protection setting",
                    value: "protection_setting",
                  },
                  // {
                  //   label: "Claim portal preference",
                  //   value: "claim_portal_preference",
                  // },
                  // {
                  //   label: "Notification",
                  //   value: "notification",
                  // },
                 
                ]}
                selected={selected}
                onChange={handleOptionChange}
              />
            </BlockStack>
          </Card>
        </Layout.Section>



        <Layout.Section variant="twoThird">

          <Scrollable  style={{ height: '90vh', padding: "20px, 0px" }}>
            <Outlet />

          </Scrollable>



        </Layout.Section>
      </Layout>
    </Page>
  );
}
