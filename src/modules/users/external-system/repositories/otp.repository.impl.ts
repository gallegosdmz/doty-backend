import { BadRequestException, Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { OtpRepository } from "../../business/repositories/otp.repository";
import { Twilio } from "twilio";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class OtpRepositoryImpl implements OtpRepository {
  private readonly client: Twilio;
  private readonly serviceSid: string;
  private readonly logger = new Logger(OtpRepositoryImpl.name);

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.getOrThrow<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.getOrThrow<string>('TWILIO_AUTH_TOKEN');
    this.serviceSid = this.configService.getOrThrow<string>('TWILIO_VERIFY_SERVICE_SID');

    this.client = new Twilio(accountSid, authToken);
  }

  async sendOtp(phone: string): Promise<{ message: string; }> {
    try {
      await this.client.verify.v2
        .services(this.serviceSid)
        .verifications.create({
          to: phone,
          channel: 'sms',
        });

      return { message: 'Codigo de verificación enviado' };
    } catch (error) {
      this.logger.error(`Error enviando OTP a ${phone}`, error);
      throw new InternalServerErrorException('Error al enviar el código de verificación');
    }
  }

  async verifyOtp(phone: string, code: string): Promise<{ verified: boolean; }> {
    try {
      const verification = await this.client.verify.v2
        .services(this.serviceSid)
        .verificationChecks.create({
          to: phone,
          code,
        });

      if (verification.status !== 'approved')
        throw new BadRequestException('Código de verificación inválido o expirado');

      return { verified: true };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;

      this.logger.error(`Error verificando OTP para ${phone}`, error);
      throw new InternalServerErrorException('Error al verificar el código');
    }
  }
}
