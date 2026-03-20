import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  PaymentGateway,
  PaymentGatewayCreateParams,
  PaymentGatewayResult,
} from '../../business/repositories/payment-gateway';

@Injectable()
export class StripePaymentGatewayImpl implements PaymentGateway {
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;
  private readonly logger = new Logger(StripePaymentGatewayImpl.name);

  constructor(private readonly configService: ConfigService) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY')!,
    );
    this.webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    )!;
  }

  async createPaymentIntent(
    params: PaymentGatewayCreateParams,
  ): Promise<PaymentGatewayResult> {
    try {
      const intent = await this.stripe.paymentIntents.create({
        amount: params.amount,
        currency: params.currency.toLowerCase(),
        metadata: params.metadata,
      });

      return {
        clientSecret: intent.client_secret!,
        intentId: intent.id,
      };
    } catch (e) {
      this.logger.error('Error al crear PaymentIntent en Stripe', e);
      throw new InternalServerErrorException(
        'Error al procesar el pago con Stripe',
      );
    }
  }

  async refundPayment(
    intentId: string,
    amount?: number,
  ): Promise<{ refundId: string }> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: intentId,
        ...(amount ? { amount } : {}),
      });

      return { refundId: refund.id };
    } catch (e) {
      this.logger.error('Error al crear reembolso en Stripe', e);
      throw new InternalServerErrorException(
        'Error al procesar el reembolso con Stripe',
      );
    }
  }

  constructWebhookEvent(
    payload: Buffer,
    signature: string,
  ): { type: string; data: { object: { id: string } } } {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.webhookSecret,
    ) as unknown as {
      type: string;
      data: { object: { id: string } };
    };
  }
}
