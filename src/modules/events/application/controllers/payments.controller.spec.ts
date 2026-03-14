import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from '../../business/services/payments.service';
import { PaymentStatus } from '../../../../shared/enums';
import { IPayment } from '../../business/entities';
import { IUser } from '../../../users/business/entities';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: PaymentsService;

  const mockUser: IUser = {
    id: 'user-uuid-1',
    phone: '+5211234567890',
    firstName: 'Juan',
    lastName: 'Perez',
  };

  const mockPayment: IPayment = {
    id: 'pay-uuid-1',
    registrationId: 'reg-uuid-1',
    userId: 'user-uuid-1',
    eventId: 'event-uuid-1',
    amount: 100,
    currency: 'MXN',
    status: PaymentStatus.PENDING,
    paymentMethod: null,
    transactionRef: null,
    paidAt: null,
  };

  const mockMeta = { total: 1, limit: 10, offset: 0, totalPages: 1 };

  const mockPaymentsService = {
    create: jest.fn(),
    findOne: jest.fn(),
    findByUser: jest.fn(),
    findByEvent: jest.fn(),
    markAsPaid: jest.fn(),
    cancelPayment: jest.fn(),
    refund: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        { provide: PaymentsService, useValue: mockPaymentsService },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── CREATE ───────────────────────────────────────────────

  describe('create', () => {
    it('should create a payment and return clientSecret for Stripe', async () => {
      mockPaymentsService.create.mockResolvedValue({
        payment: { ...mockPayment, paymentMethod: 'stripe', transactionRef: 'pi_test123' },
        clientSecret: 'pi_test123_secret_abc',
      });

      const result = await controller.create('reg-uuid-1', mockUser);

      expect(result.clientSecret).toBe('pi_test123_secret_abc');
      expect(result.payment.paymentMethod).toBe('stripe');
      expect(result.payment.transactionRef).toBe('pi_test123');
      expect(service.create).toHaveBeenCalledWith('reg-uuid-1', mockUser);
    });

    it('should fail when payment already exists for registration', async () => {
      mockPaymentsService.create.mockRejectedValue(
        new BadRequestException('Ya existe un pago para esta inscripcion'),
      );

      await expect(controller.create('reg-uuid-1', mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should derive amount and currency from the event', async () => {
      mockPaymentsService.create.mockResolvedValue({
        payment: mockPayment,
        clientSecret: 'pi_test_secret',
      });

      const result = await controller.create('reg-uuid-1', mockUser);

      expect(result.payment.amount).toBe(100);
      expect(result.payment.currency).toBe('MXN');
    });
  });

  // ─── FIND MY PAYMENTS ────────────────────────────────────

  describe('findMyPayments', () => {
    it('should return payments for the authenticated user', async () => {
      mockPaymentsService.findByUser.mockResolvedValue({ payments: [mockPayment], meta: mockMeta });

      const result = await controller.findMyPayments(mockUser, {});

      expect(result.payments).toHaveLength(1);
      expect(service.findByUser).toHaveBeenCalledWith('user-uuid-1', 10, 0);
    });

    it('should respect custom pagination', async () => {
      mockPaymentsService.findByUser.mockResolvedValue({
        payments: [],
        meta: { ...mockMeta, total: 0 },
      });

      await controller.findMyPayments(mockUser, { limit: 5, offset: 20 });

      expect(service.findByUser).toHaveBeenCalledWith('user-uuid-1', 5, 20);
    });
  });

  // ─── FIND BY EVENT ────────────────────────────────────────

  describe('findByEvent', () => {
    it('should return payments for an event', async () => {
      mockPaymentsService.findByEvent.mockResolvedValue({ payments: [mockPayment], meta: mockMeta });

      const result = await controller.findByEvent('event-uuid-1', mockUser, {});

      expect(result.payments).toHaveLength(1);
      expect(service.findByEvent).toHaveBeenCalledWith('event-uuid-1', mockUser, 10, 0);
    });
  });

  // ─── FIND ONE ─────────────────────────────────────────────

  describe('findOne', () => {
    it('should return a single payment', async () => {
      mockPaymentsService.findOne.mockResolvedValue(mockPayment);

      const result = await controller.findOne('pay-uuid-1');

      expect(result).toEqual(mockPayment);
      expect(service.findOne).toHaveBeenCalledWith('pay-uuid-1');
    });

    it('should throw NotFoundException when payment does not exist', async () => {
      mockPaymentsService.findOne.mockRejectedValue(
        new NotFoundException('El pago no fue encontrado'),
      );

      await expect(controller.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── MARK AS PAID ────────────────────────────────────────

  describe('markAsPaid', () => {
    it('should mark payment as paid with transaction reference', async () => {
      const paid = {
        ...mockPayment,
        status: PaymentStatus.PAID,
        transactionRef: 'TXN-123456',
        paidAt: new Date(),
      };
      mockPaymentsService.markAsPaid.mockResolvedValue(paid);

      const result = await controller.markAsPaid('pay-uuid-1', { transactionRef: 'TXN-123456' }, mockUser);

      expect(result.status).toBe(PaymentStatus.PAID);
      expect(result.transactionRef).toBe('TXN-123456');
      expect(result.paidAt).toBeDefined();
      expect(service.markAsPaid).toHaveBeenCalledWith('pay-uuid-1', 'TXN-123456', mockUser);
    });
  });

  // ─── CANCEL PAYMENT ──────────────────────────────────────

  describe('cancelPayment', () => {
    it('should cancel a pending payment', async () => {
      const cancelled = { ...mockPayment, status: PaymentStatus.CANCELLED };
      mockPaymentsService.cancelPayment.mockResolvedValue(cancelled);

      const result = await controller.cancelPayment('pay-uuid-1', mockUser);

      expect(result.status).toBe(PaymentStatus.CANCELLED);
      expect(service.cancelPayment).toHaveBeenCalledWith('pay-uuid-1', mockUser);
    });

    it('should fail when user does not own the payment', async () => {
      mockPaymentsService.cancelPayment.mockRejectedValue(
        new ForbiddenException('El pago no pertenece a este usuario'),
      );

      await expect(
        controller.cancelPayment('pay-uuid-1', { ...mockUser, id: 'other-user' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── REFUND ───────────────────────────────────────────────

  describe('refund', () => {
    it('should refund a paid payment', async () => {
      const refunded = { ...mockPayment, status: PaymentStatus.REFUNDED };
      mockPaymentsService.refund.mockResolvedValue(refunded);

      const result = await controller.refund('pay-uuid-1', mockUser);

      expect(result.status).toBe(PaymentStatus.REFUNDED);
      expect(service.refund).toHaveBeenCalledWith('pay-uuid-1', mockUser);
    });

    it('should fail when payment is not in paid status', async () => {
      mockPaymentsService.refund.mockRejectedValue(
        new BadRequestException('Solo se pueden reembolsar pagos completados'),
      );

      await expect(controller.refund('pay-uuid-1', mockUser)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── REMOVE ───────────────────────────────────────────────

  describe('remove', () => {
    it('should soft-delete a payment', async () => {
      mockPaymentsService.remove.mockResolvedValue({ message: 'El pago fue eliminado exitosamente' });

      const result = await controller.remove('pay-uuid-1', mockUser);

      expect(result).toEqual({ message: 'El pago fue eliminado exitosamente' });
      expect(service.remove).toHaveBeenCalledWith('pay-uuid-1', mockUser);
    });

    it('should fail when user does not own the payment', async () => {
      mockPaymentsService.remove.mockRejectedValue(
        new ForbiddenException('El pago no pertenece a este usuario'),
      );

      await expect(
        controller.remove('pay-uuid-1', { ...mockUser, id: 'other-user' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
