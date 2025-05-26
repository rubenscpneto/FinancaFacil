// Brazilian Real currency formatting utilities

/**
 * Formats a number as Brazilian Real currency
 * @param amount - Number to format
 * @param includeSymbol - Whether to include R$ symbol
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, includeSymbol: boolean = true): string {
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: includeSymbol ? 'currency' : 'decimal',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
}

/**
 * Parses a Brazilian currency string and returns the numeric value
 * @param currencyString - String like "R$ 1.234,56" or "1.234,56"
 * @returns Numeric value
 */
export function parseCurrency(currencyString: string): number {
  if (!currencyString) return 0;
  
  // Remove currency symbol and any non-numeric characters except comma and dot
  const cleanString = currencyString
    .replace(/R\$\s?/, '') // Remove R$ symbol
    .replace(/\s/g, '') // Remove spaces
    .trim();
  
  // Handle Brazilian number format (1.234,56)
  if (cleanString.includes(',')) {
    // Check if it's in Brazilian format (periods as thousands separator, comma as decimal)
    const parts = cleanString.split(',');
    if (parts.length === 2) {
      // Remove dots from the integer part and use comma as decimal separator
      const integerPart = parts[0].replace(/\./g, '');
      const decimalPart = parts[1];
      return parseFloat(`${integerPart}.${decimalPart}`);
    }
  }
  
  // Handle cases where only dots are used (like 1234.56)
  if (cleanString.includes('.')) {
    const parts = cleanString.split('.');
    if (parts.length === 2 && parts[1].length <= 2) {
      // This is likely a decimal number (1234.56)
      return parseFloat(cleanString);
    } else if (parts.length > 2) {
      // This is likely Brazilian format with dots as thousands separator
      const lastPart = parts.pop() || '';
      const integerPart = parts.join('');
      return parseFloat(`${integerPart}.${lastPart}`);
    }
  }
  
  // Fallback: try to parse as a regular number
  const numericValue = parseFloat(cleanString.replace(/[^\d]/g, ''));
  return isNaN(numericValue) ? 0 : numericValue;
}

/**
 * Formats currency for input fields (without symbol, Brazilian format)
 * @param amount - Number to format
 * @returns Formatted string for input
 */
export function formatCurrencyForInput(amount: number): string {
  return formatCurrency(amount, false);
}

/**
 * Formats a currency string while typing (real-time formatting)
 * @param value - Current input value
 * @returns Formatted value
 */
export function formatCurrencyInput(value: string): string {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '');
  
  if (!numbers) return '';
  
  // Convert to number (treating last 2 digits as cents)
  const amount = parseInt(numbers) / 100;
  
  return formatCurrency(amount);
}

/**
 * Validates if a string is a valid currency amount
 * @param value - String to validate
 * @returns boolean indicating if valid
 */
export function isValidCurrency(value: string): boolean {
  try {
    const parsed = parseCurrency(value);
    return !isNaN(parsed) && parsed >= 0;
  } catch {
    return false;
  }
}

/**
 * Formats large numbers with Brazilian abbreviations
 * @param amount - Number to format
 * @returns Abbreviated currency string
 */
export function formatCurrencyAbbreviated(amount: number): string {
  const abs = Math.abs(amount);
  
  if (abs >= 1000000000) {
    return formatCurrency(amount / 1000000000, false) + ' bi';
  } else if (abs >= 1000000) {
    return formatCurrency(amount / 1000000, false) + ' mi';
  } else if (abs >= 1000) {
    return formatCurrency(amount / 1000, false) + ' mil';
  }
  
  return formatCurrency(amount);
}

/**
 * Calculate percentage of total and format as currency
 * @param amount - Part amount
 * @param total - Total amount
 * @returns Object with formatted amount and percentage
 */
export function formatCurrencyWithPercentage(amount: number, total: number) {
  const percentage = total > 0 ? (amount / total) * 100 : 0;
  
  return {
    amount: formatCurrency(amount),
    percentage: percentage.toFixed(1) + '%',
    percentageValue: percentage,
  };
}

/**
 * Format currency difference with + or - sign
 * @param current - Current amount
 * @param previous - Previous amount for comparison
 * @returns Formatted difference string
 */
export function formatCurrencyDifference(current: number, previous: number): string {
  const difference = current - previous;
  const sign = difference >= 0 ? '+' : '';
  
  return sign + formatCurrency(difference);
}

/**
 * Currency input mask for form fields
 * @param value - Input value
 * @returns Masked value
 */
export function applyCurrencyMask(value: string): string {
  // Remove all non-numeric characters
  let numbers = value.replace(/\D/g, '');
  
  // Limit to reasonable amount (999,999,999.99)
  if (numbers.length > 11) {
    numbers = numbers.slice(0, 11);
  }
  
  if (!numbers) return '';
  
  // Add leading zeros if needed
  numbers = numbers.padStart(3, '0');
  
  // Insert decimal separator
  const length = numbers.length;
  const reais = numbers.slice(0, length - 2);
  const centavos = numbers.slice(length - 2);
  
  // Format with thousands separator
  const formattedReais = reais.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return `R$ ${formattedReais},${centavos}`;
}
