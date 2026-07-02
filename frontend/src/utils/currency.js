export const formatBDT = (amount) =>
  `৳${Number(amount || 0).toLocaleString("en-IN")}`;
