export interface PaymentGatewayCreateParams {
  amount: number;
  currency: string;
  metadata: {
    paymentId: string;
    eventId: string;
    userId: string;
    registrationId: string;
  };
}

export interface PaymentGatewayResult {
  clientSecret: string;
  intentId: string;
}

export interface PaymentGateway {
  createPaymentIntent(params: PaymentGatewayCreateParams): Promise<PaymentGatewayResult>;
  refundPayment(intentId: string, amount?: number): Promise<{ refundId: string }>;
  constructWebhookEvent(payload: Buffer, signature: string): { type: string; data: { object: { id: string } } };
}
