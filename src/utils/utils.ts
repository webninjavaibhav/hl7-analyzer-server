/**
 * Utility functions for date formatting and age calculation
 */

/**
 * Formats a date string from YYYYMMDD to specified format
 * @param dateStr - Date string in YYYYMMDD or YYYYMMDDHHMMSS format
 * @param includeTime - Whether to include time in output (default: false)
 * @param format - Output date format (default: 'DD/MM/YYYY')
 * @returns Formatted date string
 */
export function formatDate(
  dateStr: string,
  includeTime = false,
  format: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' = 'DD/MM/YYYY'
): string {
  if (!dateStr) return '';

  // Extract date components
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);

  // Format date based on specified format
  const formattedDate = format === 'DD/MM/YYYY' ? `${day}/${month}/${year}` :
                       format === 'MM/DD/YYYY' ? `${month}/${day}/${year}` :
                       `${year}-${month}-${day}`;

  // Add time if requested and available
  if (includeTime && dateStr.length >= 14) {
    const time = `${dateStr.substring(8, 10).padStart(2, '0')}:` +
                 `${dateStr.substring(10, 12).padStart(2, '0')}:` +
                 `${dateStr.substring(12, 14).padStart(2, '0')}`;
    return `${formattedDate} ${time}`;
  }

  return formattedDate;
}

/**
 * Calculates age from date of birth
 * @param dateOfBirth - Date of birth in YYYYMMDD format
 * @returns Age in years or undefined if invalid date
 */
export function calculateAge(dateOfBirth: string): number | undefined {
  if (!dateOfBirth || dateOfBirth.length !== 8) return undefined;

  const dob = new Date(
    parseInt(dateOfBirth.substring(0, 4)),
    parseInt(dateOfBirth.substring(4, 6)) - 1,
    parseInt(dateOfBirth.substring(6, 8))
  );
  const today = new Date();

  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}