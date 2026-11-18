import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import {
  OTP_REQUEST_LIMIT,
  PASSWORD_CHANGE_REQUEST_LIMIT,
  PASSWORD_CHANGE_REQUEST_WINDOW,
  SECONDS_IN_MINUTE,
  SESSION_COOKIE,
} from '@repo/constants';
import { RateLimit } from '@repo/guards';
import type { AuthenticatedUser } from '@repo/types';
import type { FastifyRequest } from 'fastify';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ChangeDisplayNameDto } from './dto/change-display-name.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeUserNameDto } from './dto/change-user-name.dto';
import { CheckValueDTO } from './dto/check-value.dto';
import { CreateUserDto } from './dto/create-user.dto';
import {
  ChangeProfilePhotoDto,
  ProfilePhotoParamDto,
} from './dto/profile-photo.dto';
import { RecoverAccountDto } from './dto/recover-account.dto';
import { SearchUserDto } from './dto/search-user.dto';
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

  @Get('/search/:searchText')
  async searchUsers(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { searchText }: SearchUserDto,
  ) {
    return this.userService.searchUser({ user, searchText });
  }

  @Get('/conversations')
  getUserConversations(@CurrentUser() user: AuthenticatedUser) {
    return this.userService.getUserConversations(user.id);
  }

  @Get('/blocked')
  getUserBlockedConversations(@CurrentUser() user: AuthenticatedUser) {
    return this.userService.getUserBlockedConversations(user.id);
  }

  @Get("/active-conversation")
  getUserActiveConversation(
    @CurrentUser() user: AuthenticatedUser
  ){
    return this.userService.getUserActiveConversation(user.id)
  }

  @Public()
  @Patch('/recover')
  @RateLimit({
    limit: OTP_REQUEST_LIMIT,
    window: SECONDS_IN_MINUTE,
    by: ['body.email'],
  })
  async recoverAccount(@Body() data: RecoverAccountDto) {
    return this.userService.recoverAccount(data);
  }

  @Patch('/display-name')
  changeDisplayName(
    @CurrentUser() user: AuthenticatedUser,
    @Body() { displayName }: ChangeDisplayNameDto,
  ) {
    return this.userService.changeDisplayName({
      requesterId: user.id,
      displayName,
    });
  }

  @Patch('/user-name')
  changeUserName(
    @CurrentUser() user: AuthenticatedUser,
    @Body() { userName }: ChangeUserNameDto,
  ) {
    return this.userService.changeUserName({ requesterId: user.id, userName });
  }

  @Patch('/password')
  @RateLimit({
    limit: PASSWORD_CHANGE_REQUEST_LIMIT,
    window: PASSWORD_CHANGE_REQUEST_WINDOW,
    by: 'user.id',
  })
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: ChangePasswordDto,
    @Req() request: FastifyRequest,
  ) {
    return this.userService.changePassword({
      ...data,
      requesterId: user.id,
      sessionToken: request.cookies?.[SESSION_COOKIE],
    });
  }

  @Get('/photos')
  getProfilePhotos(@CurrentUser() user: AuthenticatedUser) {
    return this.userService.getProfilePhotos(user.id);
  }

  @Patch('/photo')
  uploadProfilePhoto(
    @CurrentUser() user: AuthenticatedUser,
    @Body() { photo }: ChangeProfilePhotoDto,
  ) {
    return this.userService.uploadProfilePhoto({ requesterId: user.id, photo });
  }

  @Patch('/photos/:photoId')
  switchToRecentProfilePhoto(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { photoId }: ProfilePhotoParamDto,
  ) {
    return this.userService.switchToRecentProfilePhoto({
      requesterId: user.id,
      photoId,
    });
  }

  @Delete('/photos/:photoId')
  deleteProfilePhoto(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { photoId }: ProfilePhotoParamDto,
  ) {
    return this.userService.deleteProfilePhoto({ requester: user, photoId });
  }

  @Delete()
  deleteAccount(@CurrentUser() user: AuthenticatedUser) {
    return this.userService.deleteAccount(user.id);
  }
}
