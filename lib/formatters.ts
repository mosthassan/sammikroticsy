import { Currency } from '@/types';

export function formatCurrency(amount: number, currency: Currency = 'YER'): string {
  const formattedNumber = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0
  }).format(amount);

  switch (currency) {
    case 'YER':
      return `${formattedNumber} ر.ي`;
    case 'SAR':
      return `${formattedNumber} ر.س`;
    case 'EGP':
      return `${formattedNumber} ج.م`;
    case 'USD':
      return `$${formattedNumber}`;
    case 'IQD':
      return `${formattedNumber} د.ع`;
    case 'AED':
      return `${formattedNumber} د.إ`;
    case 'OMR':
      return `${formattedNumber} ر.ع`;
    case 'KWD':
      return `${formattedNumber} د.ك`;
    default:
      return `${formattedNumber} ${currency}`;
  }
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('ar-YE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatDateShort(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('ar-YE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

export const formatShortDate = formatDateShort;
