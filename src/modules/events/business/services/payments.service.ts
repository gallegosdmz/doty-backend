import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { PaymentsRepository } from '../repositories/payments.repository';
import type { PaymentsValidator } from '../repositories/payments.validator';
import type { EventsRepository } from '../repositories/events.repository';
import type { RegistrationsRepository } from '../repositories/registrations.repository';
import type { PaymentGateway } from '../repositories/payment-gateway';
import { IUser } from 'src/modules/users/business/entities';
import { IPayment } from '../entities';
import { PaymentStatus } from 'src/shared/enums';
import { IMeta } from 'src/shared/interfaces/Meta';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @Inject('PaymentsRepository')
    private readonly paymentRepo: PaymentsRepository,

    @Inject('PaymentsValidator')
    private readonly paymentValidator: PaymentsValidator,

    @Inject('EventsRepository')
    private readonly eventRepo: EventsRepository,

    @Inject('RegistrationsRepository')
    private readonly registrationRepo: RegistrationsRepository,

    @Inject('PaymentGateway')
    private readonly paymentGateway: PaymentGateway,
  ) {}

  async create(
    registrationId: string,
    user: IUser,
  ): Promise<{ payment: IPayment; clientSecret: string }> {
    await this.paymentValidator.validatePaymentNotDuplicated(registrationId);

    const registration = await this.registrationRepo.findOne(registrationId);
    const event = await this.eventRepo.findOne(registration.eventId);

    const payment = await this.paymentRepo.create({
      registrationId,
      userId: user.id!,
      eventId: event.id!,
      amount: event.price!,
      currency: event.currency!,
      status: PaymentStatus.PENDING,
      paymentMethod: 'stripe',
    });

    const { clientSecret, intentId } =
      await this.paymentGateway.createPaymentIntent({
        amount: Math.round(event.price! * 100),
        currency: event.currency!,
        metadata: {
          paymentId: payment.id!,
          eventId: event.id!,
          userId: user.id!,
          registrationId,
        },
      });

    const updatedPayment = await this.paymentRepo.updateStatus(
      payment.id!,
      PaymentStatus.PENDING,
      intentId,
    );

    return { payment: updatedPayment, clientSecret };
  }

  async findOne(id: string): Promise<IPayment> {
    return await this.paymentRepo.findOne(id);
  }

  async findByUser(
    userId: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<{ payments: IPayment[]; meta: IMeta }> {
    return await this.paymentRepo.findByUser(userId, limit, offset);
  }

  async findByEvent(
    eventId: string,
    user: IUser,
    limit: number = 10,
    offset: number = 0,
  ): Promise<{ payments: IPayment[]; meta: IMeta }> {
    const event = await this.eventRepo.findOne(eventId);

    if (event.organizerId !== user.id) {
      throw new BadRequestException(
        'Solo el organizador puede ver los pagos del evento',
      );
    }

    return await this.paymentRepo.findByEvent(eventId, limit, offset);
  }

  async markAsPaid(
    id: string,
    transactionRef: string,
    user: IUser,
  ): Promise<IPayment> {
    const payment = await this.paymentRepo.findOne(id);
    const event = await this.eventRepo.findOne(payment.eventId);

    if (event.organizerId !== user.id) {
      throw new BadRequestException(
        'Solo el organizador del evento puede marcar pagos como pagados',
      );
    }

    return await this.paymentRepo.updateStatus(
      id,
      PaymentStatus.PAID,
      transactionRef,
    );
  }

  async cancelPayment(id: string, user: IUser): Promise<IPayment> {
    await this.paymentValidator.validatePaymentBelongsToUser(id, user.id!);

    return await this.paymentRepo.updateStatus(id, PaymentStatus.CANCELLED);
  }

  async refund(id: string, user: IUser): Promise<IPayment> {
    await this.paymentValidator.validateCanRefund(id);

    const payment = await this.paymentRepo.findOne(id);
    const event = await this.eventRepo.findOne(payment.eventId);

    if (event.organizerId !== user.id) {
      throw new BadRequestException(
        'Solo el organizador del evento puede reembolsar pagos',
      );
    }

    if (!payment.transactionRef) {
      throw new BadRequestException(
        'El pago no tiene referencia de transaccion para reembolsar',
      );
    }

    await this.paymentGateway.refundPayment(payment.transactionRef);

    return await this.paymentRepo.updateStatus(id, PaymentStatus.REFUNDED);
  }

  async handlePaymentIntentSucceeded(intentId: string): Promise<void> {
    const payment = await this.paymentRepo.findByTransactionRef(intentId);
    if (!payment) {
      this.logger.warn(`Payment no encontrado para intentId: ${intentId}`);
      return;
    }

    if (payment.status === PaymentStatus.PAID) return;

    await this.paymentRepo.updateStatus(payment.id!, PaymentStatus.PAID);
  }

  async handlePaymentIntentFailed(intentId: string): Promise<void> {
    const payment = await this.paymentRepo.findByTransactionRef(intentId);
    if (!payment) {
      this.logger.warn(`Payment no encontrado para intentId: ${intentId}`);
      return;
    }

    if (payment.status === PaymentStatus.CANCELLED) return;

    await this.paymentRepo.updateStatus(payment.id!, PaymentStatus.CANCELLED);
  }

  verifyWebhookSignature(payload: Buffer, signature: string) {
    return this.paymentGateway.constructWebhookEvent(payload, signature);
  }

  async remove(id: string, user: IUser): Promise<{ message: string }> {
    await this.paymentValidator.validatePaymentBelongsToUser(id, user.id!);

    return await this.paymentRepo.remove(id);
  }
}
