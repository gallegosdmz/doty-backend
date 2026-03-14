export interface IUser {
  id?: string;
  email?: string;
  phone: string;
  password?: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  isVerified?: boolean;
  isPhoneVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
}