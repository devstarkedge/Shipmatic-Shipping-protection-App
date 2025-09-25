import { useState, useEffect, useCallback } from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import {
    BlockStack,
    Text,
    Card,
    RadioButton,
    TextField,
    Button,
    Icon,
    Modal,
    FormLayout,
    Checkbox,
} from "@shopify/polaris";
import { DragHandleIcon, PlusIcon, EditIcon, DeleteIcon } from "@shopify/polaris-icons";
import { useAppBridge, SaveBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export async function loader({ request }) {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    const settings = await prisma.claim_portal_settings.findUnique({
        where: { shop },
    });

    const defaultClaimReasons = [
        { id: '1', name: 'Damaged', order: 1 },
        { id: '2', name: 'Lost', order: 2 },
        { id: '3', name: 'Stolen', order: 3 },
        { id: '4', name: 'Other', order: 4 }
    ];

    const finalClaimReasons = (settings?.claimReasons && settings.claimReasons.length > 0) ? settings.claimReasons : defaultClaimReasons;

    return {
        settings: {
            ...settings,
            shop,
            selectedResolution: settings?.selectedResolution || 'refund',
            days: settings?.days || '45',
            claimReasons: finalClaimReasons,
            noteField: settings?.noteField || 'optional',
            proofField: settings?.proofField || 'optional'
        }
    };
}

export async function action({ request }) {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    const formData = await request.formData();
    const selectedResolution = formData.get("selectedResolution");
    const days = formData.get("days");
    const claimReasons = formData.get("claimReasons");
    const noteField = formData.get("noteField");
    const proofField = formData.get("proofField");


    const updateData = {
        selectedResolution,
        days,
        noteField,
        proofField,
    };

    if (claimReasons) {
        try {
            updateData.claimReasons = JSON.parse(claimReasons);
            console.log("Parsed claimReasons:", updateData.claimReasons);
        } catch (error) {
            console.error("Error parsing claimReasons:", error);
            return { success: false, error: "Invalid claimReasons JSON" };
        }
    }


    try {
        await prisma.claim_portal_settings.upsert({
            where: { shop },
            update: updateData,
            create: { shop, selectedResolution, days, noteField, proofField },
        });
        console.log("Database updated successfully");
        return { success: true };
    } catch (error) {
        console.error("Error updating database:", error);
        return { success: false, error: error.message };
    }
}

export default function ClaimPortal() {
    const shopify = useAppBridge();
    const { settings } = useLoaderData();
    const fetcher = useFetcher();

    const [selectedResolution, setSelectedResolution] = useState(settings.selectedResolution);
    const [days, setDays] = useState(settings.days);
    const [claimReasons, setClaimReasons] = useState(settings.claimReasons || []);
    const [noteField, setNoteField] = useState(settings.noteField);
    const [proofField, setProofField] = useState(settings.proofField);
    const [isDirty, setIsDirty] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastSavedData, setLastSavedData] = useState(null);
    const [baselineSettings, setBaselineSettings] = useState({
        selectedResolution: settings.selectedResolution,
        days: settings.days,
        noteField: settings.noteField,
        proofField: settings.proofField
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReason, setEditingReason] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        language: 'en'
    });
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [reasonToDelete, setReasonToDelete] = useState(null);
    const [saveKey, setSaveKey] = useState(0);

    useEffect(() => {
        if (!isDirty && !isSubmitting && !fetcher.state) {
            setSelectedResolution(settings.selectedResolution);
            setDays(settings.days);
            setClaimReasons(settings.claimReasons || []);
            setNoteField(settings.noteField);
            setProofField(settings.proofField);
            setBaselineSettings({
                selectedResolution: settings.selectedResolution,
                days: settings.days,
                noteField: settings.noteField,
                proofField: settings.proofField
            });
        }
    }, [settings, isDirty, isSubmitting, fetcher.state]);

    useEffect(() => {
        const hasChanges =
            selectedResolution !== baselineSettings.selectedResolution ||
            days !== baselineSettings.days ||
            noteField !== baselineSettings.noteField ||
            proofField !== baselineSettings.proofField;

        setIsDirty(hasChanges);

   

        if (hasChanges) {
            shopify.saveBar?.show("claim-portal-save-bar");
        } else {
            shopify.saveBar?.hide("claim-portal-save-bar");
        }
    }, [selectedResolution, days, noteField, proofField, baselineSettings, shopify]);

    const handleSave = useCallback(() => {
        if (!selectedResolution || !days) {
            shopify.toast.show("Please fill in all required fields.", { isError: true });
            return;
        }

        setIsSubmitting(true);

        const sortedClaimReasons = [...claimReasons].sort((a, b) => a.order - b.order);

        const formData = new FormData();
        formData.append("selectedResolution", selectedResolution);
        formData.append("days", days);
        formData.append("noteField", noteField);
        formData.append("proofField", proofField);
        formData.append("claimReasons", JSON.stringify(sortedClaimReasons));
        setLastSavedData({ selectedResolution, days, noteField, proofField, claimReasons: sortedClaimReasons });
        fetcher.submit(formData, { method: "post" });
    }, [selectedResolution, days, claimReasons, noteField, proofField, settings.shop, fetcher, shopify]);

    useEffect(() => {
        if (fetcher.data?.success && lastSavedData) {
            setSelectedResolution(lastSavedData.selectedResolution);
            setDays(lastSavedData.days);
            setClaimReasons(lastSavedData.claimReasons);
            setNoteField(lastSavedData.noteField);
            setProofField(lastSavedData.proofField);
            setBaselineSettings({
                selectedResolution: lastSavedData.selectedResolution,
                days: lastSavedData.days,
                noteField: lastSavedData.noteField,
                proofField: lastSavedData.proofField
            });
            setIsDirty(false);
            shopify.saveBar?.hide("claim-portal-save-bar");
            setLastSavedData(null);
            setIsSubmitting(false);

        } else if (fetcher.data && !fetcher.data.success) {
            setIsSubmitting(false);

        }
    }, [fetcher.data, lastSavedData, shopify]);

    useEffect(() => {
        if (fetcher.data?.success) {
            setSaveKey(prev => prev + 1);
        }
    }, [fetcher.data]);

    const handleDiscard = useCallback(() => {
        setSelectedResolution(baselineSettings.selectedResolution);
        setDays(baselineSettings.days);
        setClaimReasons(settings.claimReasons || []);
        setNoteField(baselineSettings.noteField);
        setProofField(baselineSettings.proofField);
        setIsDirty(false);
        shopify.saveBar?.hide("claim-portal-save-bar");
    }, [baselineSettings, settings, shopify]);

 
    // const handleDragEnd = useCallback((result) => {
    //     if (!result.destination) return;

    //     const items = Array.from(claimReasons);
    //     const [reorderedItem] = items.splice(result.source.index, 1);
    //     items.splice(result.destination.index, 0, reorderedItem);

    //     // Update order property
    //     const updatedItems = items.map((item, index) => ({
    //         ...item,
    //         order: index + 1
    //     }));

    //     setClaimReasons(updatedItems);
    //     setIsDirty(true);
    //     shopify.saveBar?.show("claim-portal-save-bar");
    // }, [claimReasons, shopify]);

    // const handleAddReason = useCallback(() => {
    //     const newId = Date.now().toString();
    //     const newReason = {
    //         id: newId,
    //         name: 'New reason',
    //         order: claimReasons.length + 1
    //     };
    //     setClaimReasons([...claimReasons, newReason]);
    //     setIsDirty(true);
    //     shopify.saveBar?.show("claim-portal-save-bar");
    // }, [claimReasons, shopify]);

    // const handleReasonChange = useCallback((id, newName) => {
    //     setClaimReasons(claimReasons.map(reason =>
    //         reason.id === id ? { ...reason, name: newName } : reason
    //     ));
    //     setIsDirty(true);
    //     shopify.saveBar?.show("claim-portal-save-bar");
    // }, [claimReasons, shopify]);

    // Modal handlers
    const handleOpenModal = useCallback((reason = null) => {
        if (reason) {
            setEditingReason(reason);
            setFormData({
                title: reason.name,
                language: 'en'
            });
        } else {
            setEditingReason(null);
            setFormData({
                title: '',
                language: 'en'
            });
        }
        setIsModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setEditingReason(null);
        setFormData({
            title: '',
            language: 'en'
        });
    }, []);

    const handleFormChange = useCallback((field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    const handleSaveReason = useCallback(() => {
        if (!formData.title.trim()) return;

        if (editingReason) {
            setClaimReasons(claimReasons.map(reason =>
                reason.id === editingReason.id
                    ? {
                        ...reason,
                        name: formData.title
                    }
                    : reason
            ));
        } else {
            const newId = Date.now().toString();
            const newReason = {
                id: newId,
                name: formData.title,
                order: claimReasons.length + 1
            };
            setClaimReasons([...claimReasons, newReason]);
        }

        setIsDirty(true);
        shopify.saveBar?.show("claim-portal-save-bar");
        handleCloseModal();
    }, [formData, editingReason, claimReasons, shopify]);

    const handleDeleteReason = useCallback((reasonId) => {
        setClaimReasons(claimReasons.filter(reason => reason.id !== reasonId));
        setIsDirty(true);
        shopify.saveBar?.show("claim-portal-save-bar");
    }, [claimReasons, shopify]);

    const handleToggleDropdown = useCallback((reasonId) => {
        setOpenDropdownId(openDropdownId === reasonId ? null : reasonId);
    }, [openDropdownId]);

    const handleOpenDeleteModal = useCallback((reason) => {
        setReasonToDelete(reason);
        setDeleteModalOpen(true);
    }, []);

    const handleCloseDeleteModal = useCallback(() => {
        setDeleteModalOpen(false);
        setReasonToDelete(null);
    }, []);

    const handleConfirmDelete = useCallback(() => {
        if (reasonToDelete) {
            handleDeleteReason(reasonToDelete.id);
        }
        handleCloseDeleteModal();
    }, [reasonToDelete, handleDeleteReason, handleCloseDeleteModal]);

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
                                Information collection
                            </Text>
                            <Text as="p" tone="subdued">
                                Decide which fields will be required or optional for all claims.
                            </Text>
                        </BlockStack>

                        <BlockStack gap="0">

                            <Checkbox
                                label="Note"
                                checked={noteField === 'required'}
                                onChange={(checked) => setNoteField(checked ? 'required' : 'optional')}
                            />

                            <Checkbox
                                label="Proof"
                                checked={proofField === 'required'}
                                onChange={(checked) => setProofField(checked ? 'required' : 'optional')}
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


                            <div style={{ width: "110px" }}>
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

                <Card>
                    <BlockStack gap="400">
                        <BlockStack gap="100">
                            <Text as="h2" variant="headingMd">
                                Claim reasons
                            </Text>
                            <Text as="p" tone="subdued">
                                Let customers select why they are making a claim. Drag to reorder.
                            </Text>
                        </BlockStack>

                        <BlockStack gap="200">
                            {claimReasons
                                .sort((a, b) => a.order - b.order)
                                .map((reason, index) => (
                                    <div
                                        key={reason.id}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                            padding: "10px",
                                            border: "1px solid #E1E3E5",
                                            borderRadius: "8px",
                                            backgroundColor: "#FAFBFB"
                                        }}
                                    >
                                        <div style={{ cursor: "grab", color: "#6D7175" }}>
                                            <Icon source={DragHandleIcon} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <Text as="p" variant="bodyMd" fontWeight="medium">
                                                {reason.name}
                                            </Text>
                                        </div>
                                        <div style={{ position: "relative" }}>
                                            <div
                                                style={{
                                                    cursor: "pointer",
                                                    padding: "5px",
                                                    borderRadius: "4px",
                                                    backgroundColor: "transparent"
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleDropdown(reason.id);
                                                }}
                                            >
                                                <div style={{ color: "#6D7175", fontSize: "18px" }}>
                                                    ⋮
                                                </div>
                                            </div>
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    top: "100%",
                                                    right: "0",
                                                    backgroundColor: "white",
                                                    border: "1px solid #E1E3E5",
                                                    borderRadius: "8px",
                                                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                                    zIndex: 10,
                                                    display: openDropdownId === reason.id ? "block" : "none"
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        padding: "8px 12px",
                                                        cursor: "pointer",
                                                        color: "#6D7175",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "8px",
                                                        margin: "0px"
                                                    }}
                                                    onClick={() => {
                                                        handleOpenModal(reason);
                                                        setOpenDropdownId(null);
                                                    }}
                                                >

                                                    <div style={{ marginRight: '0px' }}>

                                                        <Icon source={EditIcon} />

                                                    </div>

                                                    Edit
                                                </div>
                                                <div
                                                    style={{
                                                        padding: "8px 12px",
                                                        cursor: "pointer",
                                                        color: "#D72C0D",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "8px",
                                                        margin: "0px"
                                                    }}
                                                    onClick={() => {
                                                        handleOpenDeleteModal(reason);
                                                        setOpenDropdownId(null);
                                                    }}
                                                >
                                                    <Icon source={DeleteIcon} />
                                                    Delete
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </BlockStack>

                        <Button
                            onClick={() => handleOpenModal()}
                            icon={PlusIcon}
                            variant="plain"
                        >
                            Add new
                        </Button>
                    </BlockStack>
                </Card>
            </BlockStack>

            <Modal
                open={isModalOpen}
                onClose={handleCloseModal}
                title={editingReason ? "Edit claim reason" : "Add claim reason"}
                primaryAction={{
                    content: "Save",
                    onAction: handleSaveReason,
                }}
                secondaryActions={[
                    {
                        content: "Cancel",
                        onAction: handleCloseModal,
                    },
                ]}
            >
                <Modal.Section>
                    <FormLayout>

                        <BlockStack gap="100">
                            <Text as="h3" variant="headingSm">
                                Reason title
                            </Text>
                            <TextField

                                value={formData.title}
                                onChange={(value) => handleFormChange('title', value)}
                                autoComplete="off"
                            />
                        </BlockStack>




                    </FormLayout>
                </Modal.Section>
            </Modal>

            <Modal
                open={deleteModalOpen}
                onClose={handleCloseDeleteModal}
                title="Delete claim reason"
                primaryAction={{
                    content: "Delete",
                    onAction: handleConfirmDelete,
                    destructive: true,
                }}
                secondaryActions={[
                    {
                        content: "Cancel",
                        onAction: handleCloseDeleteModal,
                    },
                ]}
            >
                <Modal.Section>
                    <Text as="p">
                        Are you sure you want to delete the claim reason "{reasonToDelete?.name}"? This action cannot be undone.
                    </Text>
                </Modal.Section>
            </Modal>
        </>
    )

}
