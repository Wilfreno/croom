import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { AuthServiceOptions } from '@repo/enums';
import { User, UserDocument } from '@repo/schemas';
import { AuthenticatedUser } from '@repo/types';
import { requireEnv } from '@repo/utils';
import { compare, hash } from 'bcrypt';
import { ClientSession, Model, Types } from 'mongoose';
@Injectable()
export class UserModel {
  private readonly logger = new Logger(UserModel.name);

  constructor(@InjectModel(User.name) private User: Model<User>) {}

  async hashPassword(password) {
    return await hash(password, 14);
  }

  async create(
    {
      email,
      password,
      authService,
    }: {
      email: string;
      password?: string;
      authService: AuthServiceOptions;
    },
    session: ClientSession,
  ): Promise<UserDocument> {
    try {
      const userName = email.split('@')[0];
      let encryptedPassword: string;

      if (password) encryptedPassword = await this.hashPassword(password);

      const newUser = new this.User({
        email,
        password: encryptedPassword,
        authService,
        userName,
        displayName: userName,
      });

      await newUser.save({ session });

      return newUser;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async getUserByEmail(email: string): Promise<UserDocument | null> {
    try {
      return await this.User.findOne({ email });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async linkGoogleAccount(id: Types.ObjectId): Promise<UserDocument | null> {
    try {
      return await this.User.findByIdAndUpdate(
        id,
        {
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

  async searchUser({ userId, searchText }: { userId: string; searchText: string }) {
    const users = await this.User.find({
      $and: [
        {
          $or: [
            {
              userName: {
                $regex: '^' + searchText,
                $options: 'i',
              },
            },
            {
              displayName: {
                $regex: '^' + searchText,
                $options: 'i',
              },
            },
          ],
        },
        {
          _id: { $ne: userId },
        },
      ],
    })
      .select('displayName userName photo status')
      .populate({ path: 'photo', select: 'url' })
      .lean();

    return users.map(({ _id, ...user }) => ({ id: _id.toString(), ...user }));
  }

  async getUsersByIds(userIds: string[]) {
    try {
      const users = await this.User.find({ _id: { $in: userIds } }).lean();
      return users.map(({ _id, __v, ...user }): AuthenticatedUser => ({ id: _id.toString(), ...user }));
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }
}
