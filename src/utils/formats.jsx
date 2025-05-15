import numeral from "numeral";
import moment from "moment/min/moment-with-locales";

// General number formatting (e.g., for counts)
export const formatNumber = (number) => {
  // Handle null/undefined inputs gracefully
  if (number === null || typeof number === "undefined") return "0";
  return numeral(number).format("0,0");
};

// Locale-specific date format (e.g., Thai 'll')
export const formatDate = (date) => {
  if (!date) return "N/A"; // Handle invalid dates
  return moment(date).locale("th").format("ll");
};

// ISO date format (YYYY-MM-DD) - Useful for keys or consistent backend formats
export const formatDateISO = (date) => {
  if (!date) return ""; // Return empty string or handle as needed
  return moment(date).format("YYYY-MM-DD");
};

// Short date format (MM/DD) - Good for chart axes
export const formatDateShort = (date) => {
  if (!date) return "";
  return moment(date).format("MM/DD");
};

// Pretty, human-readable date format (e.g., Jan 1, 2024) - Similar to date-fns 'PP'
export const formatDatePretty = (date) => {
  if (!date) return "N/A";
  // 'll' is locale-specific, 'MMM D, YYYY' is more universal for 'PP' style
  return moment(date).format("MMM D, YYYY");
};

// Currency formatting (e.g., $1,234.56)
export const formatCurrency = (number, currency = "$") => {
  // Handle null/undefined inputs gracefully
  if (number === null || typeof number === "undefined")
    return `${currency}0.00`;
  // Use numeral for currency formatting
  return numeral(number).format(`${currency}0,0.00`);
};
