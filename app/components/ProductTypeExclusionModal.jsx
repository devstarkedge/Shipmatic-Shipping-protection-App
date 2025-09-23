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

export default function ProductTypeExclusionModal({
  open,
  onClose,
  onAdd,
  initialSelectedTypes = [],
  initialSearchValue = "",
  productTypes = []
}) {
  const [searchValue, setSearchValue] = useState(initialSearchValue);
  const [selectedTypes, setSelectedTypes] = useState(initialSelectedTypes);

  // Use dynamic product types if provided, otherwise fallback to static
  const allProductTypes = productTypes.length > 0 ? productTypes : [];

  const filteredProductTypes = allProductTypes.filter((type) =>
    type.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleTypeToggle = useCallback((typeId) => {
    setSelectedTypes((prev) =>
      prev.includes(typeId)
        ? prev.filter((id) => id !== typeId)
        : [...prev, typeId]
    );
  }, []);

  const handleAdd = useCallback(() => {
    onAdd(selectedTypes);
    onClose();
  }, [selectedTypes, onAdd, onClose]);

  const handleClose = useCallback(() => {
    setSearchValue("");
    setSelectedTypes(initialSelectedTypes);
    onClose();
  }, [initialSelectedTypes, onClose]);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Exclude product type"
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
            placeholder="Select product type block"
            prefix={<Icon source={SearchIcon} />}
            showCharacterCount
            maxLength={255}
          />

          <BlockStack gap="200">
            {filteredProductTypes.length > 0 ? (
              filteredProductTypes.map((type) => (
                <Checkbox
                  key={type.id}
                  label={type.label}
                  checked={selectedTypes.includes(type.id)}
                  onChange={() => handleTypeToggle(type.id)}
                />
              ))
            ) : (
              <Text as="p" tone="subdued">
                No product types available.
              </Text>
            )}
          </BlockStack>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
