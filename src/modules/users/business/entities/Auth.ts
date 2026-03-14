export interface IAuth {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone: string;
  isVerified?: boolean;
  isPhoneVerified?: boolean;
  token: string;
}
