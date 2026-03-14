import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import type { TicketsRepository } from "../repositories/tickets.repository";
import type { EventsValidator } from "../repositories/events.validator";
import type { RegistrationsRepository } from "../repositories/registrations.repository";
import { ITicket } from "../entities";
import { RegistrationStatus } from "src/shared/enums";
import { IUser } from "src/modules/users/business/entities";

@Injectable()
export class TicketsService {
  constructor(
    @Inject('TicketsRepository')
    private readonly ticketRepo: TicketsRepository,

    @Inject('EventsValidator')
    private readonly eventValidator: EventsValidator,

    @Inject('RegistrationsRepository')
    private readonly registrationRepo: RegistrationsRepository,
  ) {}

  async generate(registrationId: string): Promise<ITicket> {
    const registration = await this.registrationRepo.findOne(registrationId);

    if (registration.status !== RegistrationStatus.APPROVED)
      throw new BadRequestException('Solo se pueden generar tickets para inscripciones aprobadas');

    const existing = await this.ticketRepo.findByRegistration(registrationId);
    if (existing) return existing;

    return this.ticketRepo.create(registrationId);
  }

  async findOne(id: string): Promise<ITicket> {
    return this.ticketRepo.findOne(id);
  }

  async findByCode(code: string): Promise<ITicket> {
    return this.ticketRepo.findByCode(code);
  }

  async validate(code: string, organizer: IUser): Promise<ITicket> {
    const ticket = await this.ticketRepo.findByCode(code);
    const registration = await this.registrationRepo.findOne(ticket.registrationId);
    await this.eventValidator.validateOrganizer(registration.eventId, organizer.id!);

    return this.ticketRepo.validateTicket(code);
  }

  async remove(id: string, user: IUser): Promise<{ message: string }> {
    const ticket = await this.ticketRepo.findOne(id);
    const registration = await this.registrationRepo.findOne(ticket.registrationId);
    await this.eventValidator.validateOrganizer(registration.eventId, user.id!);

    return this.ticketRepo.remove(id);
  }
}