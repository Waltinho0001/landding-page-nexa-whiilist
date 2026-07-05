/**
 * src/utils/csvGenerator.js
 * Conversão segura para CSV (escape de vírgulas, aspas e quebras de linha).
 */

/**
 * @param {unknown} value
 * @returns {string}
 */
function escapeCSVValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);
  const needsQuotes = /[",\n\r]/.test(stringValue);

  if (needsQuotes) {
    const escaped = stringValue.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  return stringValue;
}

/**
 * @param {Array<Record<string, unknown>>} data
 * @param {string[]} headers
 * @returns {string}
 */
export function arrayToCSV(data, headers) {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }

  const csvHeaders = headers || Object.keys(data[0]);
  const headerLine = csvHeaders.map(escapeCSVValue).join(',');
  const dataLines = data.map((row) =>
    csvHeaders.map((header) => escapeCSVValue(row[header])).join(',')
  );

  return [headerLine, ...dataLines].join('\n');
}

/**
 * @param {Array<object>} users
 * @returns {string}
 */
export function generateBetaUsersCSV(users) {
  const headers = [
    'queuePosition',
    'fullName',
    'email',
    'phone',
    'socialMedia',
    'profession',
    'tier',
    'premiumMonths',
    'lifetimeDiscount',
    'createdAt',
    'lossExperience',
  ];

  const formattedData = users.map((user) => ({
    queuePosition: user.queuePosition,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone || '',
    socialMedia: user.socialMedia || '',
    profession: user.profession || '',
    tier: user.tier,
    premiumMonths: user.premiumMonths,
    lifetimeDiscount: user.lifetimeDiscount,
    createdAt:
      user.createdAt instanceof Date
        ? user.createdAt.toISOString()
        : String(user.createdAt),
    lossExperience: user.lossExperience || '',
  }));

  return arrayToCSV(formattedData, headers);
}
