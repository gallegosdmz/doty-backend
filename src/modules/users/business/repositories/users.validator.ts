import { IUser } from "../entities";

export interface UsersValidator {
  validateEmailUniqueness(email: string, userId?: string): Promise<boolean>;
  validatePhoneUniqueness(phone: string, userId?: string): Promise<boolean>;
  validateOwnerToUserUpdate(userToChangePasswordId: string, editorUser: IUser): Promise<boolean>;
  validateExistFirstAdmin(): Promise<boolean>;
}
