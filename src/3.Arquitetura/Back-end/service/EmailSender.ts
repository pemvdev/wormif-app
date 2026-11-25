export interface PasswordResetEmail {
  recipient: string;
  recipientName: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export interface EmailSender {
  sendPasswordReset(email: PasswordResetEmail): Promise<void>;
}
