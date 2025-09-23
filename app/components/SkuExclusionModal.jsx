import {
  Modal,
  Text,
  TextField,
  Button,
  BlockStack,
  Checkbox,
  Icon,
} from "@shopify/polaris";
import { SearchIcon, XIcon } from "@shopify/polaris-icons";
import { useState, useCallback } from "react";

export default function SkuExclusionModal({
  open,
  onClose,
  onAdd,
  initialSelectedSkus = [],
  initialSearchValue = "",
  skus = []
}) {
  const [searchValue, setSearchValue] = useState(initialSearchValue);
  const [selectedSkus, setSelectedSkus] = useState(initialSelectedSkus);

  // Use dynamic SKUs if provided, otherwise fallback to static
  const allSkus = skus.length > 0 ? skus : [];

  const filteredSkus = allSkus.filter((sku) =>
    sku.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleSkuToggle = useCallback((skuId) => {
    setSelectedSkus((prev) =>
      prev.includes(skuId)
        ? prev.filter((id) => id !== skuId)
        : [...prev, skuId]
    );
  }, []);

  const handleAdd = useCallback(() => {
    onAdd(selectedSkus);
    onClose();
  }, [selectedSkus, onAdd, onClose]);

  const handleClose = useCallback(() => {
    setSearchValue("");
    setSelectedSkus(initialSelectedSkus);
    onClose();
  }, [initialSelectedSkus, onClose]);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Exclude SKU"
      primaryAction={{
        content: "Add",
        onAction: handleAdd,
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: handleClose,
        },
      ]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <TextField
            value={searchValue}
            onChange={setSearchValue}
            placeholder="Search specific SKUs"
            prefix={<Icon source={SearchIcon} />}
            showCharacterCount
            maxLength={255}
          />

          <BlockStack gap="200">
            {filteredSkus.length > 0 ? (
              filteredSkus.map((sku) => (
                <Checkbox
                  key={sku.id}
                  label={sku.label}
                  checked={selectedSkus.includes(sku.id)}
                  onChange={() => handleSkuToggle(sku.id)}
                />
              ))
            ) : (
              <Text as="p" tone="subdued">
                No SKUs available.
              </Text>
            )}
          </BlockStack>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
