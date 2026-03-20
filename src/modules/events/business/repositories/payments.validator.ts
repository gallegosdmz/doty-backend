export interface PaymentsValidator {
  validatePaymentNotDuplicated(registrationId: string): Promise<boolean>;
  validatePaymentBelongsToUser(
    paymentId: string,
    userId: string,
  ): Promise<boolean>;
  validateCanRefund(paymentId: string): Promise<boolean>;
}
