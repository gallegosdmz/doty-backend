import { IsString, MaxLength, MinLength } from 'class-validator';
import { IsMexicanPhone } from 'src/shared/decorators';

export class LoginUserDto {
  @IsString()
  @IsMexicanPhone()
  phone: string;

  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password: string;
}
