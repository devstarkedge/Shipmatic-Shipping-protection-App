import React, { useState, useCallback } from "react";
import {
  Button,
  Popover,
  DatePicker,
  TextField,
  OptionList,
} from "@shopify/polaris";
import { CalendarIcon } from "@shopify/polaris-icons";

import styles from "../../app/routes/_index/styles.module.css";


const predefinedRangesDefault = [
  { label: "Today", days: 0 },
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 60 days", days: 60 },
  { label: "Last 90 days", days: 90 },
  { label: "Last 120 days", days: 120 },
  { label: "Custom", days: null },
];

function getDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export default function DateRangePicker({
  initialRange = predefinedRangesDefault[3], // Default Last 60 days
  predefinedRanges = predefinedRangesDefault,
  onApply = () => {},
}) {
  const [popoverActive, setPopoverActive] = useState(false);
  const [selected, setSelected] = useState(
    initialRange.label.toLowerCase().replace(/ /g, "_")
  );
  const [selectedRange, setSelectedRange] = useState(initialRange);
  const [startDate, setStartDate] = useState(
    initialRange.days !== null ? getDateDaysAgo(initialRange.days) : new Date()
  );
  const [endDate, setEndDate] = useState(new Date());

  const togglePopoverActive = useCallback(() => {
    setPopoverActive((active) => !active);
  }, []);
  const closePopover = useCallback(() => setPopoverActive(false), []);

  const options = predefinedRanges.map((range) => ({
    value: range.label.toLowerCase().replace(/ /g, "_"),
    label: range.label,
  }));

  const handleRangeChange = (selectedValues) => {
    const value = selectedValues[0];
    setSelected(value);
    const range = predefinedRanges.find(
      (r) => r.label.toLowerCase().replace(/ /g, "_") === value
    );
    setSelectedRange(range);
    if (range.days !== null) {
      setStartDate(getDateDaysAgo(range.days));
      setEndDate(new Date());
    }
  };

  const handleStartDateChange = (date) => {
    if (date > endDate) {
      // Prevent startDate being after endDate
      return;
    }
    setStartDate(date);
    setSelectedRange(predefinedRanges[6]); // Custom
    setSelected("custom");
  };

  const handleEndDateChange = (date) => {
    if (date < startDate) {
      // Prevent endDate being before startDate
      return;
    }
    setEndDate(date);
    setSelectedRange(predefinedRanges[6]); // Custom
    setSelected("custom");
  };

  const handleDatePickerChange = (range) => {
    if (range.start > range.end) {
      // Invalid range, ignore
      return;
    }
    setStartDate(range.start);
    setEndDate(range.end);
    setSelectedRange(predefinedRanges[6]);
    setSelected("custom");
  };

  const handleApply = () => {
    onApply({ startDate, endDate, selectedRange });
    closePopover();
  };

  const handleCancel = () => {
    if (selectedRange.days !== null) {
      setStartDate(getDateDaysAgo(selectedRange.days));
      setEndDate(new Date());
    }
    closePopover();
  };

  const activator = React.useMemo(() => {
    return React.cloneElement(
      <Button icon={CalendarIcon} size="slim" textAlign="center">
        {selectedRange.label}
      </Button>,
      { onClick: togglePopoverActive }
    );
  }, [selectedRange.label, togglePopoverActive]);

  return (
    <Popover
      active={popoverActive}
      activator={activator}
      onClose={closePopover}
      preferredAlignment="left"
      fluidContent
    >
      <div className={styles.popoverContent}>
        <div className={styles.optionList}>
          <OptionList
            title="Select Range"
            onChange={handleRangeChange}
            options={options}
            selected={[selected]}
          />
        </div>
        <div className={styles.datePickerContainer}>
          <div className={styles.dateInputsContainer}>
            <TextField
              label="Start date"
              type="date"
              value={startDate.toISOString().slice(0, 10)}
              onChange={(value) => handleStartDateChange(new Date(value))}
            />
            <span>→</span>
            <TextField
              label="End date"
              type="date"
              value={endDate.toISOString().slice(0, 10)}
              onChange={(value) => handleEndDateChange(new Date(value))}
            />
          </div>

          <div className={styles.datepicker}>
            <DatePicker
              month={startDate.getMonth()}
              year={startDate.getFullYear()}
              onChange={handleDatePickerChange}
              selected={{ start: startDate, end: endDate }}
              multiMonth
              allowRange
              disableDatesAfter={new Date()}
              disableDatesBefore={new Date(2000, 0, 1)}
              from={startDate}
              to={endDate}
            />
          </div>
          <div className={styles.popoverButtons}>
            <Button onClick={handleCancel} plain>
              Cancel
            </Button>
            <Button onClick={handleApply} primary>
              Apply
            </Button>
          </div>
        </div>
      </div>
    </Popover>
  );
}
