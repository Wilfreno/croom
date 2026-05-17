import { AuthServiceOptions, UserStatus } from '@repo/enums'
import { Types } from 'mongoose'

export interface User {
  display_name: string
  username: string
  password?: string
  email: string
  status: UserStatus
  photo: Types.ObjectId
  conversations: Types.ObjectId[]
  auth_service: AuthServiceOptions[]
  last_online: Date
  date_created: Date
  last_updated: Date
}
