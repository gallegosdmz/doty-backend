import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository, Not, FindOperator } from 'typeorm';
import { IUser } from '../../business/entities';
import { UsersValidator } from '../../business/repositories/users.validator';

type WhereConditionInterface = {
  [K in keyof User]?: User[K] | FindOperator<NonNullable<User[K]>>;
} & {
  isDeleted: boolean;
};

@Injectable()
export class UsersValidatorImpl implements UsersValidator {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) { }

  /**
   * Valida que un campo específico sea único en la base de datos
   * @param field - Campo de la entidad User a validar
   * @param value - Valor a verificar
   * @param userId - ID opcional del usuario actual (para actualizaciones)
   * @param fieldName - Nombre amigable para el mensaje de error
   */
  private async validateFieldUserUniquenes(
    field: keyof User,
    value: string | number,
    userId?: string,
    fieldName?: string,
  ): Promise<boolean> {
    const whereCondition: WhereConditionInterface = {
      [field]: value,
      isDeleted: false,
    };

    if (userId) whereCondition.id = Not(userId);

    const user = await this.userRepo.findOne({
      where: whereCondition,
    });

    if (user) {
      const displayName = fieldName || field;
      throw new BadRequestException(`El ${displayName} ya está registrado`);
    }

    return false;
  }

  // Métodos específicos para campos comunes
  async validateEmailUniqueness(email: string, userId?: string): Promise<boolean> {
    return this.validateFieldUserUniquenes(
      'email',
      email,
      userId,
      'correo electrónico',
    );
  }

  async validatePhoneUniqueness(phone: string, userId?: string): Promise<boolean> {
    return this.validateFieldUserUniquenes('phone', phone, userId, 'teléfono');
  }

  async validateOwnerToUserUpdate(
    userToChangePasswordId: string,
    editorUser: IUser,
  ) {
    if (userToChangePasswordId !== editorUser.id)
      throw new UnauthorizedException(
        'No estás autorizado para editar este usuario',
      );

    return true;
  }

  async validateExistFirstAdmin(): Promise<boolean> {
    const users = await this.userRepo.count();
    if (users > 0) throw new BadRequestException('The first admin is allowed in the database');

    return false;
  }

}
