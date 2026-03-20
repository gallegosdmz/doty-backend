import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';
import { PaymentsRepository } from '../../business/repositories/payments.repository';
import { IPayment } from '../../business/entities';
import { PaymentStatus } from '../../../../shared/enums';
import { IMeta } from 'src/shared/interfaces/Meta';

@Injectable()
export class PaymentsRepositoryImpl implements PaymentsRepository {
  private readonly logger = new Logger(PaymentsRepositoryImpl.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
  ) {}

  async create(payment: IPayment): Promise<IPayment> {
    try {
      const entity = this.paymentRepo.create(payment);
      return await this.paymentRepo.save(entity);
    } catch (e) {
      this.logger.error('Error en create payment', e);
      throw new InternalServerErrorException('Error al intentar crear el pago');
    }
  }

  async findOne(id: string): Promise<IPayment> {
    const payment = await this.paymentRepo.findOne({
      where: { id, isDeleted: false },
      relations: ['registration', 'event'],
    });
    if (!payment) throw new NotFoundException('El pago no fue encontrado');

    return payment;
  }

  async findByRegistration(registrationId: string): Promise<IPayment | null> {
    return this.paymentRepo.findOne({
      where: { registrationId, isDeleted: false },
    });
  }

  async findByUser(
    userId: string,
    limit?: number,
    offset?: number,
  ): Promise<{ payments: IPayment[]; meta: IMeta }> {
    try {
      const [payments, total] = await this.paymentRepo.findAndCount({
        where: { userId, isDeleted: false },
        relations: ['event'],
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
      });

      return {
        payments,
        meta: {
          total,
          limit: limit ?? 0,
          offset: offset ?? 0,
          totalPages: limit ? Math.ceil(total / limit) : 0,
        },
      };
    } catch (e) {
      this.logger.error('Error en findByUser payments', e);
      throw new InternalServerErrorException(
        'Error al intentar obtener los pagos del usuario',
      );
    }
  }

  async findByEvent(
    eventId: string,
    limit?: number,
    offset?: number,
  ): Promise<{ payments: IPayment[]; meta: IMeta }> {
    try {
      const [payments, total] = await this.paymentRepo.findAndCount({
        where: { eventId, isDeleted: false },
        relations: ['user'],
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
      });

      return {
        payments,
        meta: {
          total,
          limit: limit ?? 0,
          offset: offset ?? 0,
          totalPages: limit ? Math.ceil(total / limit) : 0,
        },
      };
    } catch (e) {
      this.logger.error('Error en findByEvent payments', e);
      throw new InternalServerErrorException(
        'Error al intentar obtener los pagos del evento',
      );
    }
  }

  async updateStatus(
    id: string,
    status: PaymentStatus,
    transactionRef?: string,
  ): Promise<IPayment> {
    const payment = await this.paymentRepo.preload({
      id,
      status,
      transactionRef: transactionRef ?? undefined,
      paidAt: status === PaymentStatus.PAID ? new Date() : undefined,
    });
    if (!payment) throw new NotFoundException('El pago no fue encontrado');

    try {
      return await this.paymentRepo.save(payment);
    } catch (e) {
      this.logger.error('Error en updateStatus payment', e);
      throw new InternalServerErrorException(
        'Error al intentar actualizar el pago',
      );
    }
  }

  async findByTransactionRef(transactionRef: string): Promise<IPayment | null> {
    return this.paymentRepo.findOne({
      where: { transactionRef, isDeleted: false },
      relations: ['registration', 'event'],
    });
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);

    try {
      await this.paymentRepo.update(id, { isDeleted: true });
      return { message: 'El pago fue eliminado exitosamente' };
    } catch (e) {
      this.logger.error('Error en remove payment', e);
      throw new InternalServerErrorException(
        'Error al intentar eliminar el pago',
      );
    }
  }
}
