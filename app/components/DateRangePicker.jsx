import React, { useState, useCallback, useMemo } from "react";
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
  initialRange = predefinedRangesDefault[3], 
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


  const [date, setDate] = useState({
    month: startDate.getMonth(),
    year: startDate.getFullYear(),
  });

 
  const [tempSelected, setTempSelected] = useState(selected);
  const [tempSelectedRange, setTempSelectedRange] = useState(selectedRange);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);
  const [tempDate, setTempDate] = useState(date);

  
  const togglePopoverActive = useCallback(() => {
    if (!popoverActive) {
     
      setTempSelected(selected);
      setTempSelectedRange(selectedRange);
      setTempStartDate(startDate);
      setTempEndDate(endDate);
      setTempDate(date);
    }
    setPopoverActive((active) => !active);
  }, [popoverActive, selected, selectedRange, startDate, endDate, date]);

  const closePopover = useCallback(() => setPopoverActive(false), []);


  const options = predefinedRanges.map((range) => ({
    value: range.label.toLowerCase().replace(/ /g, "_"),
    label: range.label,
  }));

  
  const handleRangeChange = (selectedValues) => {
    const value = selectedValues[0];
    setTempSelected(value);
    const range = predefinedRanges.find(
      (r) => r.label.toLowerCase().replace(/ /g, "_") === value
    );
    setTempSelectedRange(range);

    if (range.days !== null) {
      const start = getDateDaysAgo(range.days);
      setTempStartDate(start);
      setTempEndDate(new Date());
      setTempDate({ month: start.getMonth(), year: start.getFullYear() });
    }
  };


  const handleStartDateChange = (dateValue) => {
    const dateObj = new Date(dateValue);
    if (dateObj > tempEndDate) return;
    setTempStartDate(dateObj);
    setTempSelected("custom");
    setTempSelectedRange(predefinedRanges[6]);
    setTempDate({ month: dateObj.getMonth(), year: dateObj.getFullYear() });
  };

  const handleEndDateChange = (dateValue) => {
    const dateObj = new Date(dateValue);
    if (dateObj < tempStartDate) return;
    setTempEndDate(dateObj);
    setTempSelected("custom");
    setTempSelectedRange(predefinedRanges[6]);
    setTempDate({ month: dateObj.getMonth(), year: dateObj.getFullYear() });
  };


  const handleDatePickerChange = (range) => {
    if (range.start > range.end) return;
    setTempStartDate(range.start);
    setTempEndDate(range.end);
    setTempSelected("custom");
    setTempSelectedRange(predefinedRanges[6]);
    setTempDate({ month: range.start.getMonth(), year: range.start.getFullYear() });
  };

  const handleApply = () => {
    setSelected(tempSelected);
    setSelectedRange(tempSelectedRange);
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setDate(tempDate);
    onApply({ startDate: tempStartDate, endDate: tempEndDate, selectedRange: tempSelectedRange });
    closePopover();
  };

  const handleCancel = () => {
 
    closePopover();
  };

  const handleMonthChange = useCallback((month, year) => {
    setTempDate({ month, year });
  }, []);

  const activator = useMemo(() => {
    return (
      <Button icon={CalendarIcon} size="slim" textAlign="center" onClick={togglePopoverActive}>
        {selectedRange.label}
      </Button>
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
            selected={[tempSelected]}
          />
        </div>

        <div className={styles.datePickerContainer}>
          <div className={styles.dateInputsContainer}>
            <TextField
              label="Start date"
              type="date"
              value={tempStartDate.toISOString().slice(0, 10)}
              onChange={handleStartDateChange}
            />
            <span>→</span>
            <TextField
              label="End date"
              type="date"
              value={tempEndDate.toISOString().slice(0, 10)}
              onChange={handleEndDateChange}
            />
          </div>

          <div className={styles.datepicker}>
            <DatePicker
              month={tempDate.month}
              year={tempDate.year}
              onChange={handleDatePickerChange}
              onMonthChange={handleMonthChange}
              selected={{ start: tempStartDate, end: tempEndDate }}
              multiMonth
              allowRange
              disableDatesAfter={new Date()}
              disableDatesBefore={new Date(2000, 0, 1)}
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
