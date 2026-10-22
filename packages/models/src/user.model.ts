import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AuthServiceOptions } from '@repo/enums';
import { User, UserDocument } from '@repo/schemas';
import { compare, hash } from 'bcrypt';
import { Model, Types } from 'mongoose';

/**
 * A real bcrypt hash of a value nobody knows, compared against when the email
 * turns out to have no account or no password. Skipping the comparison instead
 * would let a caller time the difference and learn which emails are registered,
 * which is exactly what the single shared failure message exists to hide.
 */
const ABSENT_PASSWORD_HASH = '$2b$10$yfe6y90La5ZBNuaYGa1tRuWFH6Crz5gyuxaV/EdXO/Pu.h9L5/TF6';

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

  /**
   * The account a returning google profile belongs to: the one already carrying
   * the id, or failing that the one holding the address it verified.
   */
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

  /**
   * Adds google as a way into an account that already exists. `$addToSet`
   * rather than `$push` so signing in again does not stack duplicates onto
   * `authService`.
   */
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

  /**
   * Reads a user by email with the password hash attached, which the schema
   * otherwise withholds. Only the login path should call this -- everything else
   * wants `getUserById`.
   */
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

  /**
   * Whether `password` is the one behind `hashed`. A user with no password at
   * all -- an account created through an oauth provider -- always fails, but
   * takes the same time to do so.
   */
  async verifyPassword(password: string, hashed?: string): Promise<boolean> {
    try {
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
