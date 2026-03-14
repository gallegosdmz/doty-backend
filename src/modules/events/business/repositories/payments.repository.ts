import { IMeta } from 'src/shared/interfaces/Meta';
import { IPayment } from '../entities';
import { PaymentStatus } from '../../../../shared/enums';

export interface PaymentsRepository {
  create(payment: IPayment): Promise<IPayment>;
  findOne(id: string): Promise<IPayment>;
  findByRegistration(registrationId: string): Promise<IPayment | null>;
  findByUser(userId: string, limit?: number, offset?: number): Promise<{ payments: IPayment[]; meta: IMeta }>;
  findByEvent(eventId: string, limit?: number, offset?: number): Promise<{ payments: IPayment[]; meta: IMeta }>;
  updateStatus(id: string, status: PaymentStatus, transactionRef?: string): Promise<IPayment>;
  findByTransactionRef(transactionRef: string): Promise<IPayment | null>;
  remove(id: string): Promise<{ message: string }>;
}
