import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  username?: string;
  password?: string;
  password_confirmation?: string;
  stack?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
