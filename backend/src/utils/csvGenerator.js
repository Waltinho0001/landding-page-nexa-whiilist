/**
 * src/utils/csvGenerator.js
 * Conversão segura de array de objetos para formato CSV.
 * Zero dependências externas.
 *
 * Features:
 *   - Escape de vírgulas, aspas e quebras de linha
 *   - Headers customizáveis
 *   - Suporte a valores null/undefined
 */

/**
 * Escapa um valor para formato CSV seguro.
 * - Envolve em aspas se conter vírgula, aspa ou quebra de linha
 * - Dobra aspas internas (" vira "")
 *
 * @param {any} value - Valor a ser escapado
 * @returns {string}
 */
function escapeCSVValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // Verifica se precisa de escaping
  const needsQuotes = /[",\n\r]/.test(stringValue);

  if (needsQuotes) {
    // Dobra aspas internas e envolve em aspas
    const escaped = stringValue.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  return stringValue;
}

/**
 * Converte um array de objetos para string CSV.
 *
 * @param {Array<Object>} data - Array de objetos com dados
 * @param {Array<string>} headers - Lista de chaves para usar como headers (opcional)
 * @returns {string}
 */
export function arrayToCSV(data, headers) {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }

  // Se headers não fornecido, usa chaves do primeiro objeto
  const csvHeaders = headers || Object.keys(data[0]);

  // Constrói linha de header
  const headerLine = csvHeaders.map(escapeCSVValue).join(',');

  // Constrói linhas de dados
  const dataLines = data.map((row) => {
    return csvHeaders
      .map((header) => escapeCSVValue(row[header]))
      .join(',');
  });

  // Junta tudo com quebras de linha Unix
  return [headerLine, ...dataLines].join('\n');
}

/**
 * Gera CSV completo com headers específicos para beta users.
 *
 * @param {Array<Object>} users - Array de usuários do Prisma
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
  ];

  // Formata dados para garantir consistência
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
    createdAt: user.createdAt instanceof Date
      ? user.createdAt.toISOString()
      : String(user.createdAt),
  }));

  return arrayToCSV(formattedData, headers);
}