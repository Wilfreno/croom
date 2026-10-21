import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CheckValueDTO } from './dto/check-value.dto';
import { Public } from '../auth/decorators/public.decorator';
import { UserService } from './user.service';
import { CreateUserDto } from "./dto/create-user.dto";

@Controller({ path: 'user', version: '1' })
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post()
  async createUser(@Body() data: CreateUserDto) {
    return this.userService.createUser(data)
  }

  @Public()
  @Get('/check/:type/:value')
  async checkAvailability(@Param() param: CheckValueDTO) {
    return this.userService.checkAvailability(param);
  }
}
