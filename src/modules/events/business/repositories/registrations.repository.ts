import { IMeta } from 'src/shared/interfaces/Meta';
import { IEventRegistration } from '../entities';
import { RegistrationStatus } from '../../../../shared/enums';

export interface RegistrationsRepository {
  create(registration: IEventRegistration): Promise<IEventRegistration>;
  findByEvent(
    eventId: string,
    status?: RegistrationStatus,
    limit?: number,
    offset?: number,
  ): Promise<{ registrations: IEventRegistration[]; meta: IMeta }>;
  findByUser(
    userId: string,
    limit?: number,
    offset?: number,
  ): Promise<{ registrations: IEventRegistration[]; meta: IMeta }>;
  findOne(id: string): Promise<IEventRegistration>;
  findByEventAndUser(
    eventId: string,
    userId: string,
  ): Promise<IEventRegistration | null>;
  updateStatus(
    id: string,
    status: RegistrationStatus,
  ): Promise<IEventRegistration>;
  remove(id: string): Promise<{ message: string }>;
  countByEvent(eventId: string, status?: RegistrationStatus): Promise<number>;
}
