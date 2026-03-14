import { PaymentStatus } from '../../../../shared/enums';

export interface IPayment {
  id?: string;
  registrationId: string;
  userId: string;
  eventId: string;
  amount: number;
  currency: string;
  status?: PaymentStatus;
  paymentMethod?: string | null;
  transactionRef?: string | null;
  paidAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
}
