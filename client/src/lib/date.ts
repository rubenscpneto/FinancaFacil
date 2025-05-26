// Brazilian date formatting utilities

/**
 * Formats a date in Brazilian format (DD/MM/YYYY)
 * @param date - Date to format
 * @param format - Format type: 'short' (DD/MM/YY), 'medium' (DD/MM/YYYY), 'long' (DD de Mês de YYYY)
 * @returns Formatted date string
 */
export function formatDate(date: Date, format: 'short' | 'medium' | 'long' = 'medium'): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const shortYear = year.toString().slice(-2);

  switch (format) {
    case 'short':
      return `${day}/${month}/${shortYear}`;
    case 'medium':
      return `${day}/${month}/${year}`;
    case 'long':
      const months = [
        'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
      ];
      return `${day} de ${months[date.getMonth()]} de ${year}`;
    default:
      return `${day}/${month}/${year}`;
  }
}

/**
 * Parses a Brazilian date string (DD/MM/YYYY) to Date object
 * @param dateString - Date string in DD/MM/YYYY format
 * @returns Date object or null if invalid
 */
export function parseDate(dateString: string): Date | null {
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
  const year = parseInt(parts[2], 10);

  const date = new Date(year, month, day);
  
  // Validate the date
  if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
    return null;
  }

  return date;
}

/**
 * Formats a date for HTML input[type="date"] (YYYY-MM-DD)
 * @param date - Date to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Parses HTML input date (YYYY-MM-DD) to Date object
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object
 */
export function parseDateFromInput(dateString: string): Date {
  return new Date(dateString + 'T00:00:00');
}

/**
 * Gets relative time in Portuguese
 * @param date - Date to compare
 * @param baseDate - Base date for comparison (default: now)
 * @returns Relative time string
 */
export function getRelativeTime(date: Date, baseDate: Date = new Date()): string {
  const diffInSeconds = Math.floor((baseDate.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'agora mesmo';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return diffInMinutes === 1 ? 'há 1 minuto' : `há ${diffInMinutes} minutos`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return diffInHours === 1 ? 'há 1 hora' : `há ${diffInHours} horas`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return diffInDays === 1 ? 'há 1 dia' : `há ${diffInDays} dias`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return diffInWeeks === 1 ? 'há 1 semana' : `há ${diffInWeeks} semanas`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return diffInMonths === 1 ? 'há 1 mês' : `há ${diffInMonths} meses`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return diffInYears === 1 ? 'há 1 ano' : `há ${diffInYears} anos`;
}

/**
 * Formats a date range in Portuguese
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Formatted date range string
 */
export function formatDateRange(startDate: Date, endDate: Date): string {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  
  // Same date
  if (start === end) {
    return start;
  }
  
  // Same month and year
  if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const month = (startDate.getMonth() + 1).toString().padStart(2, '0');
    const year = startDate.getFullYear();
    
    return `${startDay} a ${endDay}/${month}/${year}`;
  }
  
  return `${start} a ${end}`;
}

/**
 * Gets the start and end of a month
 * @param date - Reference date
 * @returns Object with start and end dates
 */
export function getMonthBounds(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  
  return { start, end };
}

/**
 * Gets the start and end of a week (Monday to Sunday)
 * @param date - Reference date
 * @returns Object with start and end dates
 */
export function getWeekBounds(date: Date): { start: Date; end: Date } {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
  
  const start = new Date(date.setDate(diff));
  const end = new Date(date.setDate(diff + 6));
  
  return { start, end };
}

/**
 * Checks if two dates are on the same day
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Boolean indicating if same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear();
}

/**
 * Checks if a date is today
 * @param date - Date to check
 * @returns Boolean indicating if today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Checks if a date is yesterday
 * @param date - Date to check
 * @returns Boolean indicating if yesterday
 */
export function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
}

/**
 * Gets day name in Portuguese
 * @param date - Date
 * @param format - 'short' (seg) or 'long' (segunda-feira)
 * @returns Day name
 */
export function getDayName(date: Date, format: 'short' | 'long' = 'long'): string {
  const days = {
    short: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'],
    long: ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
  };
  
  return days[format][date.getDay()];
}

/**
 * Gets month name in Portuguese
 * @param date - Date or month number (0-11)
 * @param format - 'short' (jan) or 'long' (janeiro)
 * @returns Month name
 */
export function getMonthName(date: Date | number, format: 'short' | 'long' = 'long'): string {
  const monthIndex = typeof date === 'number' ? date : date.getMonth();
  
  const months = {
    short: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
    long: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
  };
  
  return months[format][monthIndex];
}

/**
 * Validates a Brazilian date string
 * @param dateString - Date string to validate
 * @returns Boolean indicating if valid
 */
export function isValidDate(dateString: string): boolean {
  const date = parseDate(dateString);
  return date !== null;
}

/**
 * Adds days to a date
 * @param date - Base date
 * @param days - Number of days to add
 * @returns New date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Adds months to a date
 * @param date - Base date
 * @param months - Number of months to add
 * @returns New date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Gets the age from a birth date
 * @param birthDate - Birth date
 * @param referenceDate - Reference date (default: today)
 * @returns Age in years
 */
export function getAge(birthDate: Date, referenceDate: Date = new Date()): number {
  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = referenceDate.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}
