import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { StripeWebhookController } from './stripe-webhook.controller';
import { PaymentsService } from '../../business/services/payments.service';

describe('StripeWebhookController', () => {
  let controller: StripeWebhookController;
  let service: PaymentsService;

  const mockPaymentsService = {
    verifyWebhookSignature: jest.fn(),
    handlePaymentIntentSucceeded: jest.fn(),
    handlePaymentIntentFailed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StripeWebhookController],
      providers: [
        { provide: PaymentsService, useValue: mockPaymentsService },
      ],
    }).compile();

    controller = module.get<StripeWebhookController>(StripeWebhookController);
    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleWebhook', () => {
    const rawBody = Buffer.from('test-payload');
    const signature = 'whsec_test_signature';

    it('should handle payment_intent.succeeded event', async () => {
      mockPaymentsService.verifyWebhookSignature.mockReturnValue({
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_test123' } },
      });
      mockPaymentsService.handlePaymentIntentSucceeded.mockResolvedValue(undefined);

      const result = await controller.handleWebhook(signature, rawBody);

      expect(result).toEqual({ received: true });
      expect(service.verifyWebhookSignature).toHaveBeenCalledWith(rawBody, signature);
      expect(service.handlePaymentIntentSucceeded).toHaveBeenCalledWith('pi_test123');
      expect(service.handlePaymentIntentFailed).not.toHaveBeenCalled();
    });

    it('should handle payment_intent.payment_failed event', async () => {
      mockPaymentsService.verifyWebhookSignature.mockReturnValue({
        type: 'payment_intent.payment_failed',
        data: { object: { id: 'pi_test456' } },
      });
      mockPaymentsService.handlePaymentIntentFailed.mockResolvedValue(undefined);

      const result = await controller.handleWebhook(signature, rawBody);

      expect(result).toEqual({ received: true });
      expect(service.handlePaymentIntentFailed).toHaveBeenCalledWith('pi_test456');
      expect(service.handlePaymentIntentSucceeded).not.toHaveBeenCalled();
    });

    it('should return received:true for unhandled event types', async () => {
      mockPaymentsService.verifyWebhookSignature.mockReturnValue({
        type: 'charge.dispute.created',
        data: { object: { id: 'dp_test789' } },
      });

      const result = await controller.handleWebhook(signature, rawBody);

      expect(result).toEqual({ received: true });
      expect(service.handlePaymentIntentSucceeded).not.toHaveBeenCalled();
      expect(service.handlePaymentIntentFailed).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when signature is invalid', async () => {
      mockPaymentsService.verifyWebhookSignature.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(
        controller.handleWebhook('invalid-sig', rawBody),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when stripe-signature header is missing', async () => {
      await expect(
        controller.handleWebhook(undefined as any, rawBody),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
