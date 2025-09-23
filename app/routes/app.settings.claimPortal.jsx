import { useState, useEffect, useCallback } from "react";
import { useLoaderData, useActionData, useSubmit } from "@remix-run/react";
import {
    BlockStack,
    Text,
    Card,
    RadioButton,
    TextField,
} from "@shopify/polaris";
import { useAppBridge, SaveBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export async function loader({ request }) {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    const settings = await prisma.claim_portal_settings.findUnique({
        where: { shop },
    });
    return { settings: settings || { shop, selectedResolution: 'refund', days: '45' } };
}

export async function action({ request }) {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    const formData = await request.formData();
    const selectedResolution = formData.get("selectedResolution");
    const days = formData.get("days");
    await prisma.claim_portal_settings.upsert({
        where: { shop },
        update: { selectedResolution, days },
        create: { shop, selectedResolution, days },
    });
    return { success: true };
}

export default function ClaimPortal() {
    const shopify = useAppBridge();
    const { settings } = useLoaderData();
    const actionData = useActionData();
    const submit = useSubmit();

    const [selectedResolution, setSelectedResolution] = useState(settings.selectedResolution);
    const [days, setDays] = useState(settings.days);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        setSelectedResolution(settings.selectedResolution);
        setDays(settings.days);
    }, [settings]);

    useEffect(() => {
        const hasChanges =
            selectedResolution !== settings.selectedResolution ||
            days !== settings.days;

        setIsDirty(hasChanges);

        if (hasChanges) {
            shopify.saveBar?.show("claim-portal-save-bar");
        } else {
            shopify.saveBar?.hide("claim-portal-save-bar");
        }
    }, [selectedResolution, days, settings, shopify]);

    const handleSave = useCallback(() => {
        const formData = new FormData();
        formData.append("shop", settings.shop);
        formData.append("selectedResolution", selectedResolution);
        formData.append("days", days);
        submit(formData, { method: "post" });
        setIsDirty(false);
        shopify.saveBar?.hide("claim-portal-save-bar");
    }, [selectedResolution, days, settings.shop, submit, shopify]);

    const handleDiscard = useCallback(() => {
        setSelectedResolution(settings.selectedResolution);
        setDays(settings.days);
        setIsDirty(false);
        shopify.saveBar?.hide("claim-portal-save-bar");
    }, [settings]);

    return (
        <>
            <SaveBar id="claim-portal-save-bar" open={isDirty}>
                <button variant="primary" onClick={handleSave}></button>
                <button onClick={handleDiscard}></button>
            </SaveBar>

            <BlockStack gap="400">
                <Card>
                    <BlockStack gap="400">
                        <BlockStack gap="100">
                            <Text as="h2" variant="headingMd">
                                Resolution options
                            </Text>
                            <Text as="p" tone="subdued">
                                Let customers choose how they want to resolve their claim.
                            </Text>
                        </BlockStack>

                        <BlockStack gap="100">
                            <RadioButton
                                label="Refund to original payment"
                                checked={selectedResolution === 'refund'}
                                id="refund"
                                name="resolution"
                                onChange={() => setSelectedResolution('refund')}
                            />
                            <RadioButton
                                label="Reorder claimed items"
                                checked={selectedResolution === 'reorder'}
                                id="reorder"
                                name="resolution"
                                onChange={() => setSelectedResolution('reorder')}
                            />

                        </BlockStack>
                    </BlockStack>
                </Card>

                <Card>
                    <BlockStack gap="400">
                        <BlockStack gap="100">
                            <Text as="h2" variant="headingMd">
                                Submission deadline
                            </Text>
                            <Text as="p" tone="subdued">
                                Close storefront claim submission window:
                            </Text>
                        </BlockStack>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>


                            <div  style={{width: "110px"}}>
                                <TextField
                                    value={days}
                                    onChange={setDays}
                                    autoComplete="off"
                                />
                            </div>

                            <Text as="p" tone="subdued">
                                days after order creation
                            </Text>


                        </div>

                    </BlockStack>
                </Card>
            </BlockStack>
        </>
    )

}
