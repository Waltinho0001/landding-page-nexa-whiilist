/**
 * frontend/src/services/emailService.js
 * Serviço de comunicação com a API de inscrição do backend.
 * Chama POST /api/register e retorna posição, tier e benefícios.
 */

const API_BASE = '/api';

export const emailService = {
  /**
   * Envia os dados de inscrição para o backend.
   * Retorna posição na fila, tier e benefícios se bem-sucedido.
   *
   * @param {object} data - Dados do formulário
   * @returns {Promise<{ success: boolean, message: string, position?: number, tier?: string, benefits?: object, alreadyRegistered?: boolean }>}
   */
  async sendLeadEmail(data) {
    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: data.fullName,
          email: data.email,
          phone: data.phone || undefined,
          socialMedia: data.socialMedia || undefined,
          profession: data.profession || undefined,
          consent: data.consent ?? true,
          consentVersion: '1.0',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Erro ao realizar inscrição. Tente novamente.',
          error: result.error || 'REQUEST_FAILED',
          details: result.details,
        };
      }

      return {
        success: true,
        message: result.message || 'Cadastro realizado com sucesso!',
        position: result.data?.position,
        tier: result.data?.tier,
        benefits: result.data?.benefits,
        alreadyRegistered: result.data?.alreadyRegistered ?? false,
      };
    } catch (error) {
      console.error('[emailService] Erro de rede:', error);
      return {
        success: false,
        message: 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.',
        error: 'NETWORK_ERROR',
      };
    }
  },

  /**
   * Consulta o status de inscrição por e-mail.
   *
   * @param {string} email
   * @returns {Promise<{ success: boolean, data?: object, message?: string }>}
   */
  async getStatus(email) {
    try {
      const encoded = encodeURIComponent(email.trim().toLowerCase());
      const response = await fetch(`${API_BASE}/status?email=${encoded}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Inscrição não encontrada.',
          error: result.error || 'NOT_FOUND',
        };
      }

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      console.error('[emailService] Erro ao consultar status:', error);
      return {
        success: false,
        message: 'Não foi possível consultar o status. Tente novamente.',
        error: 'NETWORK_ERROR',
      };
    }
  },
};
