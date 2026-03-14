import { RegistrationStatus } from '../../../../shared/enums';

export interface IEventRegistration {
  id?: string;
  eventId: string;
  userId: string;
  status?: RegistrationStatus;
  registeredAt?: Date;
  resolvedAt?: Date | null;
  updatedAt?: Date;
  isDeleted?: boolean;
}
