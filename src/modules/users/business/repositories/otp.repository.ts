export interface OtpRepository {
  sendOtp(phone: string): Promise<{ message: string }>;
  verifyOtp(phone: string, code: string): Promise<{ verified: boolean }>;
}
