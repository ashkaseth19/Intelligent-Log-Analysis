// Formatting utilities for dataset metrics and charts

export const formatCompactNumber = (number) => {
  if (number === null || number === undefined || isNaN(number)) return '0';
  const num = Number(number);
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
};

export const formatNumber = (number) => {
  if (number === null || number === undefined || isNaN(number)) return '0';
  return Number(number).toLocaleString();
};

export const formatPercent = (number, decimals = 1) => {
  if (number === null || number === undefined || isNaN(number)) return '0%';
  return `${Number(number).toFixed(decimals)}%`;
};
