const API_URL = '/api/send-email';

export const emailService = {
  async sendLeadEmail(data) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar formulário');
      }

      return {
        success: true,
        message: result.message || 'Cadastro realizado com sucesso!',
      };
    } catch (error) {
      console.error('[EmailService] Erro:', error);
      return {
        success: false,
        message: 'Não foi possível conectar ao servidor. Tente novamente.',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  },
};
