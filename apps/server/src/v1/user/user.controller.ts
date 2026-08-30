import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CheckValueDTO } from './dto/check-value.dto';
import { UserService } from './user.service';
import { CreateUserDto } from "./dto/create-user.dto";

@Controller({ path: 'user', version: '1' })
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(@Body() data: CreateUserDto) {
    return this.userService.createUser(data)
  }

  @Get('/check/:type/:value')
  async checkAvailability(@Param() param: CheckValueDTO) {
    return this.userService.checkAvailability(param);
  }
}
