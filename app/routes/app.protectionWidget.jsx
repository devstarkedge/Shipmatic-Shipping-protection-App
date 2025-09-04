import {
  Page,
  Layout,
  LegacyCard,
  BlockStack,
  Button,
  Card,
  InlineGrid,
  Text,
  FormLayout,
  TextField,
  Divider,
  ColorPicker,
  Modal,
} from "@shopify/polaris";
import { ExportIcon, PlusCircleIcon } from "@shopify/polaris-icons";
import { useState, useMemo, useEffect, useCallback } from "react";
import styles from "./_index/styles.module.css";
import AutocompleteMultiSelect from "../components/AutocompleteMultiSelect";
import RangeSliderReusable from "../components/RangeSliderReusable";
import ColorPickerWithHexInput from "./ColorPickerWithHexInput";

export default function AdditionalPage() {
  const pricingOptions = useMemo(
    () => [
      { value: "percentage", label: "Percentage" },
      { value: "fixed", label: "Fixed" },
    ],
    [],
  );

  const [selectedPricingOptions, setSelectedPricingOptions] = useState([
    "percentage",
  ]);

  // Add missing state and handler for switch toggle
  const [isWidgetPublished, setIsWidgetPublished] = useState(false);

  const handleToggleChange = () => {
    setIsWidgetPublished((prev) => !prev);
  };

  const widgetOptions = useMemo(
    () => [
      { value: "standard", label: "Standard widget" },
      { value: "checkout", label: "Checkout button widget" },
    ],
    [],
  );

  const [selectedWidgetOptions, setSelectedWidgetOptions] = useState([
    "standard",
  ]);

  const VisiblityOptions = useMemo(
    () => [
      { value: "show", label: "Show Icon" },
      { value: "hide", label: "Hide Icon" },
    ],
    [],
  );

  const [selectedVisiblityOptions, setSelectedVisiblityOptions] = useState([
    "show",
  ]);

  const ButtonOptions = useMemo(
    () => [
      { value: "switch", label: "Switch" },
      { value: "checkbox", label: "Checkbox" },
    ],
    [],
  );

  const [selectedButtonOptions, setSelectedButtonOptions] = useState(["show"]);

  const [pricingValue, setPricingValue] = useState("");

  useEffect(() => {
    if (selectedPricingOptions.includes("percentage")) {
      setPricingValue("0.5");
    } else {
      setPricingValue("3");
    }
  }, [selectedPricingOptions]);

  console.log(selectedPricingOptions);
  console.log(pricingValue);

  // New state for selected widget icon index
  const [selectedIconIndex, setSelectedIconIndex] = useState(0);

  const widgetIcons = [
    "https://2766624.fs1.hubspotusercontent-na1.net/hubfs/2766624/Shipmatic/icon1.png",
    "https://2766624.fs1.hubspotusercontent-na1.net/hubfs/2766624/Shipmatic/icon2.png",
    "https://2766624.fs1.hubspotusercontent-na1.net/hubfs/2766624/Shipmatic/icon3.png",
    "https://2766624.fs1.hubspotusercontent-na1.net/hubfs/2766624/Shipmatic/icon4.png",
  ];

  // Separate state for each slider
  const [iconSize, setIconSize] = useState(40);
  const [iconCornerRadius, setIconCornerRadius] = useState(0);
  const [widgetBorderSize, setWidgetBorderSize] = useState(0);
  const [widgetCornerRadius, setWidgetCornerRadius] = useState(0);
  const [widgetVerticalPadding, setWidgetVerticalPadding] = useState(0);
  const [widgetHorizontalPadding, setWidgetHorizontalPadding] = useState(0);

  const [colorStates, setColorStates] = useState({
    titleColor: "#000000",
    backgroundColor: "#ffffff",
    enableDescColor: "#282828",
    disabledDescColor: "#282828",
    optInActionColor: "#cc62c7",
    optOutActionColor: "#e7e7e7",
    borderColor: "#e7e7e7",
  });

  console.log(colorStates);

  const [addonTitle, setAddonTitle] = useState("Shipping protection");
  const [enabledDescription, setEnabledDescription] = useState(
    "100% guarantee & protect your order from damage, loss, or theft.",
  );
  const [disabledDescription, setDisabledDescription] = useState(
    "By deselecting shipping protection, we are not liable for lost, damaged, or stolen products.",
  );

  const handleAddonTitleChange = useCallback(
    (value) => setAddonTitle(value),
    [],
  );
  const handleEnabledDescriptionChange = useCallback(
    (value) => setEnabledDescription(value),
    [],
  );
  const handleDisabledDescriptionChange = useCallback(
    (value) => setDisabledDescription(value),
    [],
  );

  // New state for modal visibility
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // New state for modal form fields
  const [minimumCharge, setMinimumCharge] = useState("1");
  const [incrementAmount, setIncrementAmount] = useState("1.01");

  const handleOpenModal = () => setShowAdvancedSettings(true);
  const handleCloseModal = () => setShowAdvancedSettings(false);

  const handleSave = () => {
    // Placeholder for save logic
    setShowAdvancedSettings(false);
  };

  return (
    <div className={styles.protectionWidget}>
      <Page
        title="Protection widget"
        secondaryActions={[
          {
            content: "Cart page",
            external: true,
            url: "https://www.facebook.com/business/learn/facebook-page-build-audience",
          },

          {
            content: "Checkout page",
            external: true,

            url: "https://www.facebook.com/business/learn/facebook-page-build-audience",
          },
        ]}
      >
        <Layout>
          <Layout.Section>
            <BlockStack gap="400">
              <Card roundedAbove="sm">
                <BlockStack gap="200">
                  <InlineGrid columns="1fr auto" alignItems="center">
                    <Text as="h2" variant="headingMd" fontWeight="bold">
                      Publish cart page widget
                    </Text>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={isWidgetPublished}
                        onChange={handleToggleChange}
                        aria-label="Publish cart page widget switch"
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </InlineGrid>
                  <Text as="p" variant="bodySm">
                    If the widget doesn’t appear in cart after publishing, turn
                    off this switch only and{" "}
                    <a href="" className={styles.polarisLink}>
                      contact us
                    </a>{" "}
                    for free expert help.
                  </Text>
                </BlockStack>
              </Card>

              <Card roundedAbove="sm">
                <BlockStack gap="400">
                  <BlockStack gap="200">
                    <InlineGrid columns="1fr auto">
                      <Text as="h2" variant="headingMd" fontWeight="bold">
                        Shipping protection pricing
                      </Text>
                    </InlineGrid>
                    {selectedPricingOptions.includes("percentage") && (
                      <Text as="p" variant="bodySm">
                        Charge your customer based on a percentage of the cart
                        value.{" "}
                        <a href="" className={styles.polarisLink}>
                          Learn more
                        </a>
                      </Text>
                    )}

                    {selectedPricingOptions.includes("fixed") && (
                      <Text as="p" variant="bodySm">
                        With custom rules set, any unmatched cart totals default
                        to the universal price below.{" "}
                        <a href="" className={styles.polarisLink}>
                          Learn more
                        </a>
                      </Text>
                    )}
                  </BlockStack>

                  <FormLayout>
                    <FormLayout.Group>
                      <AutocompleteMultiSelect
                        options={pricingOptions}
                        selectedOptions={selectedPricingOptions}
                        onSelect={setSelectedPricingOptions}
                      />
                      <TextField
                        type="number"
                        onChange={(value) => setPricingValue(value)}
                        value={pricingValue}
                        step={
                          selectedPricingOptions.includes("percentage")
                            ? 0.5
                            : 1
                        }
                        autoComplete="off"
                      />
                    </FormLayout.Group>

                    <Button
                      variant="tertiary"
                      icon={PlusCircleIcon}
                      onClick={handleOpenModal}
                    >
                      Advanced setting
                    </Button>
                  </FormLayout>
                </BlockStack>
              </Card>

              <Card roundedAbove="sm">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd" fontWeight="bold">
                    Publish cart page widget
                  </Text>

                  <InlineGrid columns="2" gap="300">
                    <AutocompleteMultiSelect
                      options={widgetOptions}
                      selectedOptions={selectedWidgetOptions}
                      onSelect={setSelectedWidgetOptions}
                    />
                  </InlineGrid>
                </BlockStack>
              </Card>

              <Card roundedAbove="sm">
                <BlockStack gap="300">
                  <InlineGrid columns="1fr auto">
                    <Text as="h2" variant="headingMd" fontWeight="bold">
                      Customized style
                    </Text>
                  </InlineGrid>
                  <Text as="p" variant="bodySm">
                    Widget icon
                  </Text>
                </BlockStack>

                <BlockStack gap="400">
                  <div className={styles.widgetIcons}>
                    {widgetIcons.map((src, index) => {
                      const isDisabled = index === widgetIcons.length - 1;
                      return (
                        <div
                          key={index}
                          className={`${styles.widgetIconsItems} ${
                            selectedIconIndex === index
                              ? styles.selectedIcon
                              : ""
                          } ${isDisabled ? styles.disabledIcon : ""}`}
                          onClick={() => {
                            if (!isDisabled) {
                              setSelectedIconIndex(index);
                            }
                          }}
                          style={{
                            cursor: isDisabled ? "not-allowed" : "pointer",
                          }}
                          role="radio"
                          aria-checked={selectedIconIndex === index}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (
                              (e.key === "Enter" || e.key === " ") &&
                              !isDisabled
                            ) {
                              setSelectedIconIndex(index);
                            }
                          }}
                        >
                          <div>
                            <img src={src} alt={`Icon ${index + 1}`} />
                            {isDisabled && <p>Custom icon</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <InlineGrid columns="2" gap="300">
                    <AutocompleteMultiSelect
                      options={VisiblityOptions}
                      selectedOptions={selectedVisiblityOptions}
                      onSelect={setSelectedVisiblityOptions}
                    />
                    <AutocompleteMultiSelect
                      options={ButtonOptions}
                      selectedOptions={selectedButtonOptions}
                      onSelect={setSelectedButtonOptions}
                    />
                  </InlineGrid>

                  <Divider />

                  <BlockStack gap="200">
                    <Text as="h2" variant="headingMd" fontWeight="bold">
                      Size and spacing
                    </Text>

                    <InlineGrid
                      gap="400"
                      columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }}
                    >
                      <RangeSliderReusable
                        label="Icon size"
                        value={iconSize}
                        min={40}
                        max={100}
                        onChange={setIconSize}
                        output
                      />

                      <RangeSliderReusable
                        label="Icon corner radius"
                        value={iconCornerRadius}
                        min={0}
                        max={40}
                        onChange={setIconCornerRadius}
                        output
                      />
                      <RangeSliderReusable
                        label="Widget border size"
                        value={widgetBorderSize}
                        min={0}
                        max={15}
                        onChange={setWidgetBorderSize}
                        output
                      />
                      <RangeSliderReusable
                        label="Widget corner radius"
                        value={widgetCornerRadius}
                        min={0}
                        max={40}
                        onChange={setWidgetCornerRadius}
                        output
                      />
                      <RangeSliderReusable
                        label="Widget vertical padding"
                        value={widgetVerticalPadding}
                        min={0}
                        max={50}
                        onChange={setWidgetVerticalPadding}
                        output
                      />
                      <RangeSliderReusable
                        label="Widget horizontal padding"
                        value={widgetHorizontalPadding}
                        min={0}
                        max={50}
                        onChange={setWidgetHorizontalPadding}
                        output
                      />
                    </InlineGrid>
                  </BlockStack>

                  <Divider />

                  <BlockStack gap="200">
                    <Text as="h2" variant="headingMd" fontWeight="bold">
                      Colors
                    </Text>

                    <InlineGrid
                      gap="400"
                      columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }}
                    >
                      {[
                        { label: "Title", state: "titleColor" },
                        { label: "Background", state: "backgroundColor" },
                        {
                          label: "Enable description",
                          state: "enableDescColor",
                        },
                        {
                          label: "Disabled description",
                          state: "disabledDescColor",
                        },
                        {
                          label: "Opt-in action button",
                          state: "optInActionColor",
                        },
                        {
                          label: "Opt-out action button",
                          state: "optOutActionColor",
                        },
                        { label: "Border color", state: "borderColor" },
                      ].map(({ label, state }) => (
                        <ColorPickerWithHexInput
                          key={state}
                          label={label}
                          colorState={colorStates[state]}
                          onChange={(newColor) =>
                            setColorStates((prev) => ({
                              ...prev,
                              [state]: newColor,
                            }))
                          }
                        />
                      ))}
                    </InlineGrid>
                  </BlockStack>
                </BlockStack>
              </Card>

              <Card roundedAbove="sm">
                <BlockStack gap="200">
                  <InlineGrid columns="1fr auto">
                    <Text as="h2" variant="headingMd" fontWeight="bold">
                      Content
                    </Text>
                  </InlineGrid>

                  <BlockStack gap="300">
                    <TextField
                      label="Add-on title"
                      value={addonTitle}
                      onChange={handleAddonTitleChange}
                      maxLength={50}
                      autoComplete="off"
                      showCharacterCount
                    />
                    <TextField
                      label="Enabled description"
                      value={enabledDescription}
                      onChange={handleEnabledDescriptionChange}
                      maxLength={200}
                      autoComplete="off"
                      showCharacterCount
                      multiline={2}
                    />
                    <TextField
                      label="Disabled description"
                      value={disabledDescription}
                      onChange={handleDisabledDescriptionChange}
                      maxLength={200}
                      autoComplete="off"
                      showCharacterCount
                      multiline={2}
                    />
                  </BlockStack>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </Page>

      <Modal
        open={showAdvancedSettings}
        onClose={handleCloseModal}
        title="Advanced setting"
        primaryAction={{
          content: "Save",
          onAction: handleSave,
          disabled: false,
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
            <TextField
              label="Minimum charge"
              type="number"
              value={minimumCharge}
              onChange={(value) => setMinimumCharge(value)}
              suffix="₹"
              autoComplete="off"
            />
            <TextField
              label="Increment amount"
              type="number"
              value={incrementAmount}
              onChange={(value) => setIncrementAmount(value)}
              suffix="₹"
              autoComplete="off"
            />
            <Text as="p" variant="bodySm" color="subdued">
              As the size of the cart grows, the shipping protection pricing
              escalates. 
              
               Customers will incur charges in multiples of Rs. 1.01,
              starting with a base fee of Rs. 1.00 , capped at a maximum charge
              of Rs. 99.98.{" "}
              <a href="#" className={styles.polarisLink}>
                Learn more
              </a>
            </Text>
            
          </FormLayout>
        </Modal.Section>
      </Modal>
    </div>
  );
}
