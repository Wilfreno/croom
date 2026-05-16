import { Types } from 'mongoose'

export interface User {
  display_name: string
  username: string
  password?: string
  email: string
  status: 'OFFLINE' | 'ONLINE'
  photo: Types.ObjectId
  conversations: Types.ObjectId[]
  last_online: Date
  date_created: Date
  last_updated: Date
}
