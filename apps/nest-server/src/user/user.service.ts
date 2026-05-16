import { Injectable } from '@nestjs/common';
import type { User } from '@repo/types/database/models';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/user.dto';

@Injectable()
export class UserService {
  private readonly users = [
    {
      userId: 1,
      username: 'john',
      password: 'changeme',
    },
    {
      userId: 2,
      username: 'maria',
      password: 'guess',
    },
  ];

  async findOne(id: number): Promise<User | undefined> {
    return this.users.find((user) => user.userId === id) as User | undefined;
  }
  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
