import type { EmailSender, PasswordResetEmail } from '../service/EmailSender';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]!);
}

export class ResendEmailSender implements EmailSender {
  constructor(
    private readonly apiKey: string,
    private readonly senderAddress: string
  ) {}

  async sendPasswordReset(email: PasswordResetEmail): Promise<void> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: this.senderAddress,
        to: [email.recipient],
        subject: 'Redefinição de senha do Wormif',
        html: this.buildPasswordResetHtml(email)
      })
    });

    if (!response.ok) {
      throw new Error(`Resend request failed with status ${response.status}.`);
    }
  }

  private buildPasswordResetHtml(email: PasswordResetEmail): string {
    const safeName = escapeHtml(email.recipientName);
    const safeUrl = escapeHtml(email.resetUrl);
    return `
      <p>Olá, ${safeName}.</p>
      <p>Recebemos uma solicitação para redefinir sua senha do Wormif.</p>
      <p><a href="${safeUrl}">Criar uma nova senha</a></p>
      <p>O link expira em ${email.expiresInMinutes} minutos e só pode ser usado uma vez.</p>
      <p>Se você não solicitou a alteração, ignore este e-mail.</p>
    `;
  }
}
