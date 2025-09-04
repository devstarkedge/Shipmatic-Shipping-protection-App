import { Autocomplete, Icon } from "@shopify/polaris";
import { SelectIcon  } from "@shopify/polaris-icons";
import { useState, useCallback, useMemo } from "react";

function AutocompleteMultiSelect({ options: deselectedOptions, label,  selectedOptions, onSelect }) {
  const [inputValue, setInputValue] = useState(
    deselectedOptions.length > 0 ? deselectedOptions[0].label : ""
  );
  const [options, setOptions] = useState(deselectedOptions);

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
