export interface IAuth {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone: string;
  isVerified?: boolean;
  isPhoneVerified?: boolean;
  token: string;
}
