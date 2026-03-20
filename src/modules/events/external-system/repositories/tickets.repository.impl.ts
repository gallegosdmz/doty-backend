import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { TicketsRepository } from '../../business/repositories/tickets.repository';
import { ITicket } from '../../business/entities';
import { randomUUID } from 'crypto';

@Injectable()
export class TicketsRepositoryImpl implements TicketsRepository {
  private readonly logger = new Logger(TicketsRepositoryImpl.name);

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
  ) {}

  async create(registrationId: string): Promise<ITicket> {
    try {
      const code = randomUUID()
        .replace(/-/g, '')
        .substring(0, 12)
        .toUpperCase();

      const entity = this.ticketRepo.create({ registrationId, code });
      return await this.ticketRepo.save(entity);
    } catch (e) {
      this.logger.error('Error en create ticket', e);
      throw new InternalServerErrorException(
        'Error al intentar crear el ticket',
      );
    }
  }

  async findOne(id: string): Promise<ITicket> {
    const ticket = await this.ticketRepo.findOne({
      where: { id, isDeleted: false },
      relations: ['registration'],
    });
    if (!ticket) throw new NotFoundException('El ticket no fue encontrado');

    return ticket;
  }

  async findByCode(code: string): Promise<ITicket> {
    const ticket = await this.ticketRepo.findOne({
      where: { code, isDeleted: false },
      relations: ['registration', 'registration.event', 'registration.user'],
    });
    if (!ticket) throw new NotFoundException('El ticket no fue encontrado');

    return ticket;
  }

  async findByRegistration(registrationId: string): Promise<ITicket | null> {
    return this.ticketRepo.findOne({
      where: { registrationId, isDeleted: false },
    });
  }

  async validateTicket(code: string): Promise<ITicket> {
    const ticket = await this.ticketRepo.findOne({
      where: { code, isDeleted: false },
      relations: ['registration', 'registration.event', 'registration.user'],
    });
    if (!ticket) throw new NotFoundException('El ticket no fue encontrado');
    if (ticket.isUsed) {
      throw new BadRequestException('El ticket ya fue utilizado');
    }

    try {
      ticket.isUsed = true;
      ticket.usedAt = new Date();
      return await this.ticketRepo.save(ticket);
    } catch (e) {
      this.logger.error('Error en validateTicket', e);
      throw new InternalServerErrorException(
        'Error al intentar validar el ticket',
      );
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);

    try {
      await this.ticketRepo.update(id, { isDeleted: true });
      return { message: 'El ticket fue eliminado exitosamente' };
    } catch (e) {
      this.logger.error('Error en remove ticket', e);
      throw new InternalServerErrorException(
        'Error al intentar eliminar el ticket',
      );
    }
  }
}
