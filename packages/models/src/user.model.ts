import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { AuthServiceOptions } from '@repo/enums';
import { User, UserDocument } from '@repo/schemas';
import { requireEnv } from '@repo/utils';
import { compare, hash } from 'bcrypt';
import { Model, Types } from 'mongoose';

@Injectable()
export class UserModel {
  private readonly logger = new Logger(UserModel.name);

  constructor(@InjectModel(User.name) private User: Model<User>) {}

  async hashPassword(password) {
    return await hash(password, 14);
  }

  async create({
    email,
    password,
    googleId,
    emailVerified,
    authService,
  }: {
    email: string;
    password?: string;
    googleId?: string;
    emailVerified?: boolean;
    authService: AuthServiceOptions;
  }): Promise<UserDocument> {
    try {
      const userName = email.split('@')[0];
      let encryptedPassword: string;

      if (password) encryptedPassword = await this.hashPassword(password);

      const [user] = await this.User.create([
        {
          email,
          password: encryptedPassword,
          googleId,
          emailVerified: Boolean(emailVerified),
          authService,
          userName,
          displayName: userName,
        },
      ]);

      return user;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async getUserByGoogleIdOrEmail({
    googleId,
    email,
  }: {
    googleId: string;
    email: string;
  }): Promise<UserDocument | null> {
    try {
      return await this.User.findOne({ $or: [{ googleId }, { email }] });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async linkGoogleAccount(id: Types.ObjectId, googleId: string): Promise<UserDocument | null> {
    try {
      return await this.User.findByIdAndUpdate(
        id,
        {
          $set: { googleId, emailVerified: true, lastUpdated: new Date() },
          $addToSet: { authService: AuthServiceOptions.WITH_GOOGLE },
        },
        { new: true },
      );
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async getUserByEmailWithPassword(email: string): Promise<UserDocument | null> {
    try {
      return await this.User.findOne({ email }).select('+password');
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async getUserById(id: Types.ObjectId | string): Promise<UserDocument | null> {
    try {
      return await this.User.findById(id);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async verifyPassword({
    password,
    hashed,
    configService,
  }: {
    password: string;
    hashed?: string;
    configService: ConfigService;
  }): Promise<boolean> {
    try {
      const ABSENT_PASSWORD_HASH = requireEnv(configService, 'ABSENT_PASSWORD_HASH').replace(/\/+$/, '');
      const matched = await compare(password, hashed ?? ABSENT_PASSWORD_HASH);

      return Boolean(hashed) && matched;
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

  async updateUser(email: string, data: Partial<User>) {
    try {
      return this.User.findOneAndUpdate({ email }, { $set: data });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }
}
