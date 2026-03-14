import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { Event } from './external-system/entities/event.entity';
import { EventRegistration } from './external-system/entities/event-registration.entity';
import { Payment } from './external-system/entities/payment.entity';
import { Ticket } from './external-system/entities/ticket.entity';
import { EventsController } from './application/controllers/events.controller';
import { RegistrationsController } from './application/controllers/registrations.controller';
import { PaymentsController } from './application/controllers/payments.controller';
import { TicketsController } from './application/controllers/tickets.controller';
import { MyRegistrationsController } from './application/controllers/my-registrations.controller';
import { StripeWebhookController } from './application/controllers/stripe-webhook.controller';
import { EventsService } from './business/services/events.service';
import { RegistrationsService } from './business/services/registrations.service';
import { PaymentsService } from './business/services/payments.service';
import { TicketsService } from './business/services/tickets.service';
import { EventsRepositoryImpl } from './external-system/repositories/events.repository.impl';
import { EventsValidatorImpl } from './external-system/repositories/events.validator.impl';
import { RegistrationsRepositoryImpl } from './external-system/repositories/registrations.repository.impl';
import { RegistrationsValidatorImpl } from './external-system/repositories/registrations.validator.impl';
import { PaymentsRepositoryImpl } from './external-system/repositories/payments.repository.impl';
import { PaymentsValidatorImpl } from './external-system/repositories/payments.validator.impl';
import { TicketsRepositoryImpl } from './external-system/repositories/tickets.repository.impl';
import { StripePaymentGatewayImpl } from './external-system/repositories/stripe-payment-gateway.impl';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Event, EventRegistration, Payment, Ticket]),
    UsersModule,
  ],
  controllers: [
    EventsController,
    RegistrationsController,
    MyRegistrationsController,
    PaymentsController,
    TicketsController,
    StripeWebhookController,
  ],
  providers: [
    EventsService,
    RegistrationsService,
    PaymentsService,
    TicketsService,
    {
      provide: 'EventsRepository',
      useClass: EventsRepositoryImpl,
    },
    {
      provide: 'EventsValidator',
      useClass: EventsValidatorImpl,
    },
    {
      provide: 'RegistrationsRepository',
      useClass: RegistrationsRepositoryImpl,
    },
    {
      provide: 'RegistrationsValidator',
      useClass: RegistrationsValidatorImpl,
    },
    {
      provide: 'PaymentsRepository',
      useClass: PaymentsRepositoryImpl,
    },
    {
      provide: 'PaymentsValidator',
      useClass: PaymentsValidatorImpl,
    },
    {
      provide: 'TicketsRepository',
      useClass: TicketsRepositoryImpl,
    },
    {
      provide: 'PaymentGateway',
      useClass: StripePaymentGatewayImpl,
    },
  ],
  exports: [EventsService, RegistrationsService, PaymentsService, TicketsService],
})
export class EventsModule {}
