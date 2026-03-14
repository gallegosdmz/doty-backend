import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';
import { PaymentsValidator } from '../../business/repositories/payments.validator';
import { PaymentStatus } from '../../../../shared/enums';

@Injectable()
export class PaymentsValidatorImpl implements PaymentsValidator {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
  ) {}

  async validatePaymentNotDuplicated(registrationId: string): Promise<boolean> {
    const existing = await this.paymentRepo.findOne({
      where: { registrationId, isDeleted: false },
    });

    if (existing && existing.status !== PaymentStatus.CANCELLED) {
      throw new BadRequestException('Ya existe un pago para esta inscripción');
    }

    return true;
  }

  async validatePaymentBelongsToUser(paymentId: string, userId: string): Promise<boolean> {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId, isDeleted: false },
    });
    if (!payment) throw new NotFoundException('El pago no fue encontrado');
    if (payment.userId !== userId) {
      throw new ForbiddenException('No tienes permisos sobre este pago');
    }

    return true;
  }

  async validateCanRefund(paymentId: string): Promise<boolean> {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId, isDeleted: false },
    });
    if (!payment) throw new NotFoundException('El pago no fue encontrado');
    if (payment.status !== PaymentStatus.PAID) {
      throw new BadRequestException('Solo se pueden reembolsar pagos completados');
    }

    return true;
  }
}
