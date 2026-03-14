export interface ITicket {
  id?: string;
  registrationId: string;
  code: string;
  isUsed?: boolean;
  usedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
}
