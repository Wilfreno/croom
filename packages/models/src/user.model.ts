import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AuthServiceOptions } from '@repo/enums';
import { User } from '@repo/schemas';
import { hash } from 'bcrypt';
import { Model } from 'mongoose';
@Injectable()
export class UserModel {
  private readonly logger = new Logger(UserModel.name);

  constructor(@InjectModel(User.name) private User: Model<User>) {}

  async create({
    email,
    password,
    authService,
  }: {
    email: string;
    password?: string;
    authService: AuthServiceOptions;
  }) {
    try {
      const userName = email.split('@')[0];
      let encryptedPassword: string;

      if (password) encryptedPassword = await hash(password, 10);
      await this.User.create([{ email, password: encryptedPassword, authService, userName, displayName: userName }]);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async getUserExistByEmail(email: string) {
    try {
      return Boolean(await this.User.exists({ email }));
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }
  async getUserExistByUsername(username: string) {
    try {
      return Boolean(await this.User.exists({ username }));
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }
}
