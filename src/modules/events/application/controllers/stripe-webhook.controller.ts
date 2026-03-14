import {
  Controller,
  Post,
  Headers,
  RawBody,
  HttpCode,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PaymentsService } from '../../business/services/payments.service';

@Controller('stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @RawBody() rawBody: Buffer,
  ) {
    if (!signature) {
      throw new BadRequestException('Falta el header stripe-signature');
    }

    let event: { type: string; data: { object: { id: string } } };

    try {
      event = this.paymentsService.verifyWebhookSignature(rawBody, signature);
    } catch (e) {
      this.logger.error('Firma de webhook invalida', e);
      throw new BadRequestException('Firma de webhook invalida');
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.paymentsService.handlePaymentIntentSucceeded(event.data.object.id);
        break;

      case 'payment_intent.payment_failed':
        await this.paymentsService.handlePaymentIntentFailed(event.data.object.id);
        break;

      default:
        this.logger.log(`Evento de Stripe no manejado: ${event.type}`);
    }

    return { received: true };
  }
}
