import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { CheckValueDTO } from './dto/check-value.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { RecoverAccountDto } from './dto/recover-account.dto';
import { UserService } from './user.service';

@Controller({ path: 'user', version: '1' })
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post()
  async createUser(@Body() data: CreateUserDto) {
    return this.userService.createUser(data);
  }

  @Public()
  @Get('/check/:type/:value')
  async checkAvailability(@Param() param: CheckValueDTO) {
    return this.userService.checkAvailability(param);
  }

  @Public()
  @Patch('/recover')
  async recoverAccount(@Body() data: RecoverAccountDto) {
    return this.userService.recoverAccount(data);
  }
}
