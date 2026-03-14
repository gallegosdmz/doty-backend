import { ITicket } from '../entities';

export interface TicketsRepository {
  create(registrationId: string): Promise<ITicket>;
  findOne(id: string): Promise<ITicket>;
  findByCode(code: string): Promise<ITicket>;
  findByRegistration(registrationId: string): Promise<ITicket | null>;
  validateTicket(code: string): Promise<ITicket>;
  remove(id: string): Promise<{ message: string }>;
}
