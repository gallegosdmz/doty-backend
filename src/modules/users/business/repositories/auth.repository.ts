import { JwtPayload } from 'src/shared/interfaces/Jwt-payload.interface';
import { IAuth, IUser } from '../entities';

export interface AuthRepository {
  login(phone: string, password: string): Promise<IAuth>;
  checkAuthStatus(user: IUser): Promise<IAuth>;
  changePassword(id: string, password: string): Promise<{ token: string }>;
  getJwtToken(payload: JwtPayload): string;
}
