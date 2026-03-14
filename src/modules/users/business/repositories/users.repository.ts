import { IMeta } from "src/shared/interfaces/Meta";
import { IAuth, IUser } from "../entities";

export interface UsersRepository {
  create(user: IUser): Promise<IAuth>;
  createFirstAdmin(user: IUser): Promise<IAuth>;
  findAll(limit?: number, offset?: number): Promise<{ users: IUser[], meta: IMeta }>;
  findOne(id: string): Promise<IUser>;
  update(id: string, data: IUser): Promise<IUser>;
  verifyPhone(phone: string): Promise<void>;
  remove(id: string): Promise<{ message: string }>;
}