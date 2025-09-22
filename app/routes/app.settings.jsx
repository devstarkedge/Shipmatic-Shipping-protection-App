import { Outlet } from "@remix-run/react";
import { Page, Layout } from "@shopify/polaris";

export default function OrdersLayout() {
  return (
    <Page>
      <Layout>

        <Layout.Section>
          <Outlet />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
