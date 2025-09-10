import { Autocomplete, Icon } from "@shopify/polaris";
import { SelectIcon  } from "@shopify/polaris-icons";
import { useState, useCallback, useMemo, useEffect } from "react";

function AutocompleteMultiSelect({ options: deselectedOptions, label,  selectedOptions, onSelect }) {
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState(deselectedOptions);

  // Update inputValue when selectedOptions change
  useEffect(() => {
    if (selectedOptions && selectedOptions.length > 0) {
      const selectedOption = deselectedOptions.find(option =>
        selectedOptions.includes(option.value)
      );
      if (selectedOption) {
        setInputValue(selectedOption.label);
      }
    } else {
      setInputValue("");
    }
  }, [selectedOptions, deselectedOptions]);

  const updateText = useCallback(
    (value) => {
      setInputValue(value);

      if (value === "") {
        setOptions(deselectedOptions);
        return;
      }

      const filterRegex = new RegExp(value, "i");
      const resultOptions = deselectedOptions.filter((option) =>
        option.label.match(filterRegex)
      );
      setOptions(resultOptions);
    },
    [deselectedOptions]
  );

  const updateSelection = useCallback(
    (selected) => {
      const selectedValue = selected.map((selectedItem) => {
        const matchedOption = options.find((option) => {
          return option.value.match(selectedItem);
        });
        return matchedOption && matchedOption.label;
      });

      onSelect(selected);
      setInputValue(selectedValue[0] || "");
    },
    [options, onSelect]
  );

  const textField = (
    <Autocomplete.TextField
      onChange={updateText}
      label={label}
      value={inputValue}
      suffix={<Icon source={SelectIcon } tone="base" />}
      autoComplete="off"
    />
  );

  return (
    <Autocomplete
      options={options}
      selected={selectedOptions}
      onSelect={updateSelection}
      textField={textField}
    />
  );
}

export default AutocompleteMultiSelect;
