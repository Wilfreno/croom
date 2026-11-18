import { ConflictException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { DUPLICATE_KEY_ERROR_CODE, USER_NAME_COLLATION, USER_NAME_SUFFIX_ATTEMPTS } from '@repo/constants';
import { AuthServiceOptions, UserStatus } from '@repo/enums';
import { User, UserDocument } from '@repo/schemas';
import { AuthenticatedUser } from '@repo/types';
import { requireEnv } from '@repo/utils';
import { compare, hash } from 'bcrypt';
import { randomInt } from 'crypto';
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
      const userName = await this.findAvailableUserName(email.split('@')[0]);
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
      return await this.User.findOne({ email }).select('+password').populate({ path: 'photo', select: 'url' });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async getUserById(id: Types.ObjectId | string): Promise<UserDocument | null> {
    try {
      return await this.User.findById(id).populate({ path: 'photo', select: 'url' });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  /** Sets a user's presence; going offline also stamps `lastOnline`. */
  async setUserStatus(userId: string, status: UserStatus) {
    try {
      const update: Partial<User> =
        status === UserStatus.OFFLINE ? { status, lastOnline: new Date() } : { status };

      return await this.User.findByIdAndUpdate(userId, { $set: update }, { new: true })
        .select('status lastOnline')
        .lean();
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
        {
          dateDeleted: null,
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

  async isUserNameTaken({ userName, exceptUserId }: { userName: string; exceptUserId?: string }) {
    try {
      const filter: Record<string, unknown> = { userName };
      if (exceptUserId) filter._id = { $ne: exceptUserId };

      const owners = await this.User.countDocuments(filter, { collation: USER_NAME_COLLATION });

      return owners > 0;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async findAvailableUserName(baseUserName: string) {
    const baseIsTaken = await this.isUserNameTaken({ userName: baseUserName });
    if (!baseIsTaken) return baseUserName;

    for (let attempt = 0; attempt < USER_NAME_SUFFIX_ATTEMPTS; attempt++) {
      const candidate = `${baseUserName}${randomInt(1000, 10000)}`;
      const candidateIsTaken = await this.isUserNameTaken({ userName: candidate });
      if (!candidateIsTaken) return candidate;
    }

    return `${baseUserName}${Date.now()}`;
  }

  async renameDuplicateUserNames() {
    try {
      const duplicateGroups = await this.User.aggregate<{ users: { _id: Types.ObjectId; userName: string }[] }>(
        [
          { $sort: { dateCreated: 1, _id: 1 } },
          { $group: { _id: '$userName', users: { $push: { _id: '$_id', userName: '$userName' } } } },
          { $match: { 'users.1': { $exists: true } } },
        ],
        { collation: USER_NAME_COLLATION },
      );

      let renamed = 0;

      for (const { users } of duplicateGroups) {
        const laterUsers = users.slice(1);

        for (const user of laterUsers) {
          const newUserName = await this.findAvailableUserName(user.userName);
          await this.User.updateOne({ _id: user._id }, { $set: { userName: newUserName } });
          renamed++;
        }
      }

      return renamed;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async createIndexes() {
    try {
      await this.User.createIndexes();
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async getUserByIdWithPassword(userId: string): Promise<UserDocument | null> {
    try {
      return await this.User.findById(userId).select('+password');
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async setDisplayName({ userId, displayName }: { userId: string; displayName: string }) {
    try {
      await this.User.updateOne({ _id: userId }, { $set: { displayName } });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async setUserName({ userId, userName }: { userId: string; userName: string }) {
    try {
      await this.User.updateOne({ _id: userId }, { $set: { userName } });
    } catch (error) {
      const isDuplicateKey = (error as { code?: number }).code === DUPLICATE_KEY_ERROR_CODE;
      if (isDuplicateKey) throw new ConflictException('username is already taken');

      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async setPassword({ userId, password }: { userId: string; password: string }, session?: ClientSession) {
    try {
      const hashedPassword = await this.hashPassword(password);

      await this.User.updateOne(
        { _id: userId },
        {
          $set: { password: hashedPassword },
          $addToSet: { authService: AuthServiceOptions.WITH_EMAIL_AND_PASSWORD },
        },
        { session },
      );
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async setPhoto({ userId, photoId }: { userId: string; photoId: string }, session?: ClientSession) {
    try {
      await this.User.updateOne({ _id: userId }, { $set: { photo: new Types.ObjectId(photoId) } }, { session });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async touchUnlessUsingPhoto({ userId, photoId }: { userId: string; photoId: string }, session: ClientSession) {
    try {
      const result = await this.User.updateOne(
        { _id: userId, photo: { $ne: new Types.ObjectId(photoId) } },
        { $set: { lastUpdated: new Date() } },
        { session },
      );

      return result.matchedCount > 0;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async anonymize({ userId, displayName }: { userId: string; displayName: string }, session: ClientSession) {
    try {
      const placeholder = `deleted-${userId}`;

      await this.User.updateOne(
        { _id: userId },
        {
          $set: {
            displayName,
            userName: placeholder,
            email: `${placeholder}@deleted.invalid`,
            authService: [],
            photo: null,
            status: UserStatus.OFFLINE,
            dateDeleted: new Date(),
          },
          $unset: { password: '' },
        },
        { session },
      );
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }
}
