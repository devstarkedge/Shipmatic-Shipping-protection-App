import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  BlockStack,
  Button,
  Card,
  InlineGrid,
  Text,
  FormLayout,
  TextField,
  Divider,
  Modal,
} from "@shopify/polaris";
import { PlusCircleIcon, SettingsIcon, DeleteIcon } from "@shopify/polaris-icons";
import { useState, useMemo, useEffect, useCallback } from "react";
import styles from "./_index/styles.module.css";
import AutocompleteMultiSelect from "../components/AutocompleteMultiSelect";
import RangeSliderReusable from "../components/RangeSliderReusable";
import ColorPickerWithHexInput from "../components/ColorPickerWithHexInput";
import { useFetcher } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  const { session } = await authenticate.admin(request);

  // Fetch existing product for this shop
  const product = await prisma.product.findFirst({
    where: {
      shop: session.shop,
    },
  });

  return json({ product });
};

export default function AdditionalPage() {
  const { product } = useLoaderData();
  const fetcher = useFetcher();

  // Debug fetcher state
  // console.log("Fetcher state:", fetcher.state);
  // console.log("Fetcher data:", fetcher.data);
  // console.log("Loaded product:", product);

  const initialState = {
    selectedPricingOptions: ["percentage"],
    isWidgetPublished: false,
    isWidgetPublishedwidget: false,
    selectedWidgetOptions: ["standard"],
    selectedVisiblityOptions: ["show"],
    selectedButtonOptions: ["show"],
    pricingValue: "0.5",
    selectedIconIndex: 0,
    iconSize: 40,
    iconCornerRadius: 0,
    widgetBorderSize: 0,
    widgetCornerRadius: 0,
    widgetVerticalPadding: 0,
    widgetHorizontalPadding: 0,
    colorStates: {
      titleColor: "#000000",
      backgroundColor: "#ffffff",
      enableDescColor: "#282828",
      disabledDescColor: "#282828",
      optInActionColor: "#cc62c7",
      optOutActionColor: "#e7e7e7",
      borderColor: "#e7e7e7",
      Labeltitle: "#000000",
      description: "#282828",
      protectedWidgetText: "#000000",
      checkoutButtonText: "#ffffff",
      protectedWidgetBackground: "#ffffff",
    },
    fixedAdvanceSettings: [{ min: "1", max: "1", price: "1" }],
    addonTitle: "Shipping protection",
    enabledDescription:
      "100% guarantee & protect your order from damage, loss, or theft.",
    disabledDescription:
      "By deselecting shipping protection, we are not liable for lost, damaged, or stolen products.",
    showAdvancedSettings: false,
    showAdvancedSettingsAdvanced: false,
    minimumCharge: "1",
    incrementAmount: "1.01",
  };

  const [selectedPricingOptions, setSelectedPricingOptions] = useState(
    initialState.selectedPricingOptions,
  );
  const [isWidgetPublished, setIsWidgetPublished] = useState(
    initialState.isWidgetPublished,
  );
  const [isWidgetPublishedwidget, setIsWidgetPublishedwidget] = useState(
    initialState.isWidgetPublishedwidget,
  );
  const [selectedWidgetOptions, setSelectedWidgetOptions] = useState(
    initialState.selectedWidgetOptions,
  );
  const [selectedVisiblityOptions, setSelectedVisiblityOptions] = useState(
    initialState.selectedVisiblityOptions,
  );
  const [selectedButtonOptions, setSelectedButtonOptions] = useState(
    initialState.selectedButtonOptions,
  );
  const [pricingValue, setPricingValue] = useState(initialState.pricingValue);
  const [selectedIconIndex, setSelectedIconIndex] = useState(
    initialState.selectedIconIndex,
  );
  const [iconSize, setIconSize] = useState(initialState.iconSize);
  const [iconCornerRadius, setIconCornerRadius] = useState(
    initialState.iconCornerRadius,
  );
  const [widgetBorderSize, setWidgetBorderSize] = useState(
    initialState.widgetBorderSize,
  );
  const [widgetCornerRadius, setWidgetCornerRadius] = useState(
    initialState.widgetCornerRadius,
  );
  const [widgetVerticalPadding, setWidgetVerticalPadding] = useState(
    initialState.widgetVerticalPadding,
  );
  const [widgetHorizontalPadding, setWidgetHorizontalPadding] = useState(
    initialState.widgetHorizontalPadding,
  );
  const [colorStates, setColorStates] = useState(initialState.colorStates);
  const [addonTitle, setAddonTitle] = useState(initialState.addonTitle);
  const [enabledDescription, setEnabledDescription] = useState(
    initialState.enabledDescription,
  );
  const [disabledDescription, setDisabledDescription] = useState(
    initialState.disabledDescription,
  );
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(
    initialState.showAdvancedSettings,
  );
  const [showAdvancedSettingsAdvanced, setShowAdvancedSettingsPercentage] = useState(
    initialState.showAdvancedSettingsAdvanced,
  );

  const [minimumCharge, setMinimumCharge] = useState(
    initialState.minimumCharge,
  );
  const [incrementAmount, setIncrementAmount] = useState(
    initialState.incrementAmount,
  );

  const [hasChanges, setHasChanges] = useState(false);

  const pricingOptions = useMemo(
    () => [
      // { value: "percentage", label: "Percentage" },
      { value: "fixed", label: "Fixed" },
    ],
    [],
  );

  const widgetOptions = useMemo(
    () => [
      { value: "standard", label: "Standard widget" },
      { value: "checkout", label: "Checkout button widget" },
    ],
    [],
  );

  const VisiblityOptions = useMemo(
    () => [
      { value: "show", label: "Show Icon" },
      { value: "hide", label: "Hide Icon" },
    ],
    [],
  );

  const ButtonOptions = useMemo(
    () => [
      { value: "switch", label: "Switch" },
      // { value: "checkbox", label: "Checkbox" },
    ],
    [],
  );

  const widgetIcons = [
    "https://2766624.fs1.hubspotusercontent-na1.net/hubfs/2766624/Shipmatic/icon1.png",
    "https://2766624.fs1.hubspotusercontent-na1.net/hubfs/2766624/Shipmatic/icon2.png",
    "https://2766624.fs1.hubspotusercontent-na1.net/hubfs/2766624/Shipmatic/icon3.png",
    "https://2766624.fs1.hubspotusercontent-na1.net/hubfs/2766624/Shipmatic/icon4.png",
  ];

  useEffect(() => {
    // Only set default pricing value if no value is loaded from database
    if (!pricingValue || pricingValue === initialState.pricingValue) {
      if (selectedPricingOptions.includes("percentage")) {
        setPricingValue("");
      } else {
        setPricingValue("");
      }
    }
  }, [selectedPricingOptions, pricingValue]);

  // Load data from database when product is available
  useEffect(() => {
    if (product) {
      console.log("Loading product data into form:", product);

      // Parse and set form data from product
      if (product.selectedPricingOptions) {
        setSelectedPricingOptions(JSON.parse(product.selectedPricingOptions));
      }
      if (product.isWidgetPublished !== undefined) {
        setIsWidgetPublished(product.isWidgetPublished);
      }
       if (product.isWidgetPublishedwidget !== undefined) {
        setIsWidgetPublishedwidget(product.isWidgetPublishedwidget);
      }
      
 
      if (product.selectedWidgetOptions) {
        setSelectedWidgetOptions(JSON.parse(product.selectedWidgetOptions));
      }
      if (product.selectedVisiblityOptions) {
        setSelectedVisiblityOptions(JSON.parse(product.selectedVisiblityOptions));
      }
      if (product.selectedButtonOptions) {
        setSelectedButtonOptions(JSON.parse(product.selectedButtonOptions));
      }
      if (product.pricingValue !== undefined && product.pricingValue !== null) {
        // Convert pricingValue to string to ensure correct display in TextField
        setPricingValue(String(product.pricingValue));
      }
      if (product.selectedIconIndex !== undefined) {
        setSelectedIconIndex(product.selectedIconIndex);
      }
      if (product.iconSize !== undefined) {
        setIconSize(product.iconSize);
      }
      if (product.iconCornerRadius !== undefined) {
        setIconCornerRadius(product.iconCornerRadius);
      }
      if (product.widgetBorderSize !== undefined) {
        setWidgetBorderSize(product.widgetBorderSize);
      }
      if (product.widgetCornerRadius !== undefined) {
        setWidgetCornerRadius(product.widgetCornerRadius);
      }
      if (product.widgetVerticalPadding !== undefined) {
        setWidgetVerticalPadding(product.widgetVerticalPadding);
      }
      if (product.widgetHorizontalPadding !== undefined) {
        setWidgetHorizontalPadding(product.widgetHorizontalPadding);
      }
      if (product.colorStates) {
        setColorStates(JSON.parse(product.colorStates));
      }
      if (product.fixedAdvanceSettings) {
        setTiers(JSON.parse(product.fixedAdvanceSettings));
      }
      if (product.addonTitle) {
        setAddonTitle(product.addonTitle);
      }
      if (product.enabledDescription) {
        setEnabledDescription(product.enabledDescription);
      }
      if (product.disabledDescription) {
        setDisabledDescription(product.disabledDescription);
      }
      if (product.minimumCharge) {
        setMinimumCharge(product.minimumCharge);
      }
      if (product.incrementAmount) {
        setIncrementAmount(product.incrementAmount);
      }

      console.log("Form data loaded from database");
    }
  }, [product]);

  // Handlers with change tracking and console logging
  const handleSelectedPricingOptionsChange = (value) => {
    setSelectedPricingOptions(value);
    setHasChanges(true);
    console.log("selectedPricingOptions:", value);
  };

  const handleToggleChange = () => {
    setIsWidgetPublished((prev) => {
      const newValue = !prev;
      setHasChanges(true);
      console.log("isWidgetPublished:", newValue);
      return newValue;
    });
  };


const handleToggleChangewidget = () => {
    setIsWidgetPublishedwidget((prev) => {
      const newValue = !prev;
      setHasChanges(true);
      console.log("isWidgetPublishedwidget:", newValue);
      return newValue;
    });
  };


  const handleSelectedWidgetOptionsChange = (value) => {
    setSelectedWidgetOptions(value);
    setHasChanges(true);
    console.log("selectedWidgetOptions:", value);
  };

  const handleSelectedVisiblityOptionsChange = (value) => {
    setSelectedVisiblityOptions(value);
    setHasChanges(true);
    console.log("selectedVisiblityOptions:", value);
  };

  const handleSelectedButtonOptionsChange = (value) => {
    setSelectedButtonOptions(value);
    setHasChanges(true);
    console.log("selectedButtonOptions:", value);
  };

  const handlePricingValueChange = (value) => {
    setPricingValue(value);
    setHasChanges(true);
    console.log("pricingValue:", value);
  };

  const handleSelectedIconIndexChange = (index) => {
    setSelectedIconIndex(index);
    setHasChanges(true);
    console.log("selectedIconIndex:", index);
  };

  const handleIconSizeChange = (value) => {
    setIconSize(value);
    setHasChanges(true);
    console.log("iconSize:", value);
  };

  const handleIconCornerRadiusChange = (value) => {
    setIconCornerRadius(value);
    setHasChanges(true);
    console.log("iconCornerRadius:", value);
  };

  const handleWidgetBorderSizeChange = (value) => {
    setWidgetBorderSize(value);
    setHasChanges(true);
    console.log("widgetBorderSize:", value);
  };

  const handleWidgetCornerRadiusChange = (value) => {
    setWidgetCornerRadius(value);
    setHasChanges(true);
    console.log("widgetCornerRadius:", value);
  };

  const handleWidgetVerticalPaddingChange = (value) => {
    setWidgetVerticalPadding(value);
    setHasChanges(true);
    console.log("widgetVerticalPadding:", value);
  };

  const handleWidgetHorizontalPaddingChange = (value) => {
    setWidgetHorizontalPadding(value);
    setHasChanges(true);
    console.log("widgetHorizontalPadding:", value);
  };

  const handleColorStateChange = (stateKey, newColor) => {
    setColorStates((prev) => {
      const newState = { ...prev, [stateKey]: newColor };
      setHasChanges(true);
      console.log("colorStates:", newState);
      return newState;
    });
  };

  const handleAddonTitleChange = (value) => {
    setAddonTitle(value);
    setHasChanges(true);
    console.log("addonTitle:", value);
  };

  const handleEnabledDescriptionChange = (value) => {
    setEnabledDescription(value);
    setHasChanges(true);
    console.log("enabledDescription:", value);
  };

  const handleDisabledDescriptionChange = (value) => {
    setDisabledDescription(value);
    setHasChanges(true);
    console.log("disabledDescription:", value);
  };

  const handleOpenModal = () => setShowAdvancedSettings(true);
  const handleCloseModal = () => setShowAdvancedSettings(false);

  const handleOpenModalAdvanced = () => setShowAdvancedSettingsPercentage(true);
  const handleCloseModalAdvanced = () => setShowAdvancedSettingsPercentage(false);



  const handleMinimumChargeChange = (value) => {
    setMinimumCharge(value);
    setHasChanges(true);
    console.log("minimumCharge:", value);
  };

  const handleIncrementAmountChange = (value) => {
    setIncrementAmount(value);
    setHasChanges(true);
    console.log("incrementAmount:", value);
  };



  const [tiers, setTiers] = useState(initialState.fixedAdvanceSettings);

  const handleAddTier = () => {
    const updated = [...tiers, { min: "", max: "", price: "" }];
    setTiers(updated);
    console.log("Tier added:", updated);
  };

  const handleChange = (index, field, value) => {
    const updated = [...tiers];
    updated[index][field] = value;
    setTiers(updated);
    console.log(`Tier ${index} changed:`, updated);
  };

  const handleDeleteTier = (index) => {
    const updated = tiers.filter((_, i) => i !== index);
    setTiers(updated);
    console.log(`Tier ${index} deleted. Remaining tiers:`, updated);
  };












  const handleSaveChanges = () => {
    const formData = new FormData();
    // Serialize the data as form data
    formData.append("selectedPricingOptions", JSON.stringify(selectedPricingOptions));
    formData.append("isWidgetPublished", isWidgetPublished.toString());
    formData.append("isWidgetPublishedwidget", isWidgetPublishedwidget.toString());
    formData.append("selectedWidgetOptions", JSON.stringify(selectedWidgetOptions));
    formData.append("selectedVisiblityOptions", JSON.stringify(selectedVisiblityOptions));
    formData.append("selectedButtonOptions", JSON.stringify(selectedButtonOptions));
    formData.append("pricingValue", pricingValue);
    formData.append("selectedIconIndex", selectedIconIndex.toString());
    formData.append("iconSize", iconSize.toString());
    formData.append("iconCornerRadius", iconCornerRadius.toString());
    formData.append("widgetBorderSize", widgetBorderSize.toString());
    formData.append("widgetCornerRadius", widgetCornerRadius.toString());
    formData.append("widgetVerticalPadding", widgetVerticalPadding.toString());
    formData.append("widgetHorizontalPadding", widgetHorizontalPadding.toString());
    formData.append("colorStates", JSON.stringify(colorStates));
    formData.append("addonTitle", addonTitle);
    formData.append("enabledDescription", enabledDescription);
    formData.append("disabledDescription", disabledDescription);
    formData.append("minimumCharge", minimumCharge);
    formData.append("incrementAmount", incrementAmount);
    formData.append("tiers", JSON.stringify(tiers));
    console.log("Submitting form data to create product...");
    console.log("FormData contents:", Array.from(formData.entries()));

    fetcher.submit(formData, {
      method: "POST",
      action: "/app/protectionWidget/createProduct",
    });

    setHasChanges(false);
    setShowAdvancedSettings(false);
    setShowAdvancedSettingsPercentage(false);


    console.log("Creating shipping protection product with data:", {
      selectedPricingOptions,
      isWidgetPublished,
      isWidgetPublishedwidget,
      selectedWidgetOptions,
      selectedVisiblityOptions,
      selectedButtonOptions,
      pricingValue,
      selectedIconIndex,
      iconSize,
      iconCornerRadius,
      widgetBorderSize,
      widgetCornerRadius,
      widgetVerticalPadding,
      widgetHorizontalPadding,
      colorStates,
      addonTitle,
      enabledDescription,
      disabledDescription,
      minimumCharge,
      incrementAmount,
      tiers,
    });
  };

  const handleDiscardChanges = () => {
    setSelectedPricingOptions(initialState.selectedPricingOptions);
    setIsWidgetPublished(initialState.isWidgetPublished);
    setIsWidgetPublishedwidget(initialState.isWidgetPublishedwidget);
    setSelectedWidgetOptions(initialState.selectedWidgetOptions);
    setSelectedVisiblityOptions(initialState.selectedVisiblityOptions);
    setSelectedButtonOptions(initialState.selectedButtonOptions);
    setPricingValue(initialState.pricingValue);
    setSelectedIconIndex(initialState.selectedIconIndex);
    setIconSize(initialState.iconSize);
    setIconCornerRadius(initialState.iconCornerRadius);
    setWidgetBorderSize(initialState.widgetBorderSize);
    setWidgetCornerRadius(initialState.widgetCornerRadius);
    setWidgetVerticalPadding(initialState.widgetVerticalPadding);
    setWidgetHorizontalPadding(initialState.widgetHorizontalPadding);
    setColorStates(initialState.colorStates);
    setAddonTitle(initialState.addonTitle);
    setEnabledDescription(initialState.enabledDescription);
    setDisabledDescription(initialState.disabledDescription);
    setShowAdvancedSettings(initialState.showAdvancedSettings);
    setShowAdvancedSettingsPercentage(initialState.showAdvancedSettingsAdvanced);
    setMinimumCharge(initialState.minimumCharge);
    setIncrementAmount(initialState.incrementAmount);
    setHasChanges(false);
    console.log("Changes discarded");
    console.log("Reset to initial values:", initialState);
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
                        onSelect={handleSelectedPricingOptionsChange}
                      />
                      <TextField
                        type="number"
                        onChange={handlePricingValueChange}
                        value={pricingValue}
                        step={
                          selectedPricingOptions.includes("percentage")
                            ? 0.5
                            : 1
                        }
                        autoComplete="off"
                      />
                    </FormLayout.Group>

                    {selectedPricingOptions.includes("percentage") && (
                      <Button
                        variant="tertiary"
                        icon={SettingsIcon}
                        onClick={handleOpenModal}
                      >
                        View advanced setting

                      </Button>
                    )}
                    {selectedPricingOptions.includes("fixed") && (
                      <Button
                        variant="tertiary"
                        icon={PlusCircleIcon}
                        onClick={handleOpenModalAdvanced}
                      >
                        Add custom rules
                      </Button>
                    )}
                  </FormLayout>
                </BlockStack>
              </Card>

              <Card roundedAbove="sm">
                <BlockStack gap="200">
                   <InlineGrid columns="2" gap="300">
                       <InlineGrid columns="1fr auto">

                       

                  <InlineGrid columns="1" gap="300">
                     <Text as="h2" variant="headingMd" fontWeight="bold">
                    Publish cart page widget
                  </Text>
                    <AutocompleteMultiSelect
                      options={widgetOptions}
                      selectedOptions={selectedWidgetOptions}
                      onSelect={handleSelectedWidgetOptionsChange}
                    />
                  </InlineGrid>
                       </InlineGrid>
                       <InlineGrid columns="1fr auto">

 <Text as="h2" variant="headingMd" fontWeight="bold">
                    Widget Default settings:
                  </Text>



                  <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={isWidgetPublishedwidget}
                        onChange={handleToggleChangewidget}
                        aria-label="Publish cart page widget switch"
                      />
                      <span className={styles.slider}></span>
                    </label>

                       </InlineGrid>
                   </InlineGrid>
                  
                  
                </BlockStack>
              </Card>

              {selectedWidgetOptions.includes("standard") && (
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
                            className={`${styles.widgetIconsItems} ${selectedIconIndex === index
                                ? styles.selectedIcon
                                : ""
                              } ${isDisabled ? styles.disabledIcon : ""}`}
                            onClick={() => {
                              if (!isDisabled) {
                                handleSelectedIconIndexChange(index);
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
                                handleSelectedIconIndexChange(index);
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
                        onSelect={handleSelectedVisiblityOptionsChange}
                      />
                      <AutocompleteMultiSelect
                        options={ButtonOptions}
                        selectedOptions={selectedButtonOptions}
                        onSelect={handleSelectedButtonOptionsChange}
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
                          onChange={handleIconSizeChange}
                          output
                        />

                        <RangeSliderReusable
                          label="Icon corner radius"
                          value={iconCornerRadius}
                          min={0}
                          max={40}
                          onChange={handleIconCornerRadiusChange}
                          output
                        />
                        <RangeSliderReusable
                          label="Widget border size"
                          value={widgetBorderSize}
                          min={0}
                          max={15}
                          onChange={handleWidgetBorderSizeChange}
                          output
                        />
                        <RangeSliderReusable
                          label="Widget corner radius"
                          value={widgetCornerRadius}
                          min={0}
                          max={40}
                          onChange={handleWidgetCornerRadiusChange}
                          output
                        />
                        <RangeSliderReusable
                          label="Widget vertical padding"
                          value={widgetVerticalPadding}
                          min={0}
                          max={50}
                          onChange={handleWidgetVerticalPaddingChange}
                          output
                        />
                        <RangeSliderReusable
                          label="Widget horizontal padding"
                          value={widgetHorizontalPadding}
                          min={0}
                          max={50}
                          onChange={handleWidgetHorizontalPaddingChange}
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
                              handleColorStateChange(state, newColor)
                            }
                          />
                        ))}
                      </InlineGrid>
                    </BlockStack>
                  </BlockStack>
                </Card>
              )}

              {selectedWidgetOptions.includes("checkout") && (
                <Card roundedAbove="sm">
                  <BlockStack gap="200">
                    <InlineGrid columns="1fr auto" alignItems="center">
                      <Text as="h2" variant="headingMd" fontWeight="bold">
                        Customized style
                      </Text>
                    </InlineGrid>

                    <BlockStack gap="200">
                      <InlineGrid
                        gap="400"
                        columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }}
                      >
                        {[
                          { label: "Label title", state: "Labeltitle" },
                          // { label: "Description", state: "description" },
                          // {
                          //   label: "Widget text",
                          //   state: "protectedWidgetText",
                          // },
                          {
                            label: "Checkout button text",
                            state: "checkoutButtonText",
                          },
                          {
                            label: "Widget background",
                            state: "protectedWidgetBackground",
                          },
                        ].map(({ label, state }) => (
                          <ColorPickerWithHexInput
                            key={state}
                            label={label}
                            colorState={colorStates[state]}
                            onChange={(newColor) =>
                              handleColorStateChange(state, newColor)
                            }
                          />
                        ))}
                      </InlineGrid>
                    </BlockStack>
                  </BlockStack>
                </Card>
              )}

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
                      onChange={(value) => handleAddonTitleChange(value)}
                      maxLength={50}
                      autoComplete="off"
                      showCharacterCount
                    />
                    <TextField
                      label="Enabled description"
                      value={enabledDescription}
                      onChange={(value) =>
                        handleEnabledDescriptionChange(value)
                      }
                      maxLength={200}
                      autoComplete="off"
                      showCharacterCount
                      multiline={2}
                    />
                    <TextField
                      label="Disabled description"
                      value={disabledDescription}
                      onChange={(value) =>
                        handleDisabledDescriptionChange(value)
                      }
                      maxLength={200}
                      autoComplete="off"
                      showCharacterCount
                      multiline={2}
                    />
                  </BlockStack>
                </BlockStack>
              </Card>

              {hasChanges && (

                <InlineGrid columns="auto auto" gap="200" alignItems="center">
                  <Button variant="primary" onClick={handleSaveChanges}>
                    Save
                  </Button>
                  <Button variant="secondary" onClick={handleDiscardChanges}>
                    Discard
                  </Button>
                </InlineGrid>

              )}
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
          onAction: handleSaveChanges,
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
              onChange={(value) => handleMinimumChargeChange(value)}
              suffix="₹"
              autoComplete="off"
            />
            <TextField
              label="Increment amount"
              type="number"
              value={incrementAmount}
              onChange={(value) => handleIncrementAmountChange(value)}
              suffix="₹"
              autoComplete="off"
            />
            <Text as="p" variant="bodySm" color="subdued">
              As the size of the cart grows, the shipping protection pricing
              escalates. Customers will incur charges in multiples of Rs. 1.01,
              starting with a base fee of Rs. 1.00 , capped at a maximum charge
              of Rs. 99.98.{" "}
              <a href="#" className={styles.polarisLink}>
                Learn more
              </a>
            </Text>
          </FormLayout>
        </Modal.Section>
      </Modal>


      <Modal
        open={showAdvancedSettingsAdvanced}
        onClose={handleCloseModalAdvanced}
        title="Set price by cart value"
        primaryAction={{
          content: "Save",
          onAction: () => handleSaveChanges(tiers),
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleCloseModalAdvanced,
          },
        ]}
      >
        <Modal.Section>
          <FormLayout>
            {tiers.map((tier, index) => (
              <InlineGrid columns="3fr 3fr 3fr auto" gap="200" key={index}  alignItems="end" spacing="tight">
                <div style={{ flex: 1 }}>
                  <TextField
                    label="Min cart value"
                    type="number"
                    value={tier.min}
                    onChange={(value) => handleChange(index, "min", value)}
                    prefix="₹"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <TextField
                    label="Max cart value"
                    type="number"
                    value={tier.max}
                    onChange={(value) => handleChange(index, "max", value)}
                    prefix="₹"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <TextField
                    label="Shipping protection price"
                    type="number"
                    value={tier.price}
                    onChange={(value) => handleChange(index, "price", value)}
                    prefix="₹"
                  />
                </div>
                <Button
                  icon={DeleteIcon}
                  tone="critical"
                  onClick={() => handleDeleteTier(index)}
                />
              </InlineGrid >
            ))}

            <Button onClick={handleAddTier}>Add new tier</Button>
          </FormLayout>
        </Modal.Section>
      </Modal>

    </div>
  );
}
