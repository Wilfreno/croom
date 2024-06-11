# Croom Server

    Croom server overview

## Language

    Go

## Dependencies / Packages

- Websocket
- WebRTC

## Database

- ### Database Management System

  POSTGRESQL

- ### Models

  ```ts

    User {
        id: string
        first_name: string
        middle_name?: string
        last_name: string
        email: string
        password: string
        profile_pic: Photo
        messages: Message[]
        created_at: date

    }

    Room {
        id: string
        name: string
        members: User[]
        messages?: Message[]
        created_at: date
    }

    Message {
        id: string
        type: string    // TEXT || PHOTO || VIDEO
        text?: string
        photos?: Photo[]
        video?: video
        owner: User
        owner_id: string
        room: Room
        room_id: string

    }

    Photo {
        id: string
        name: string
        user?: User
        user_id?: string
        room: Room
        room_id: string
        message?: Message
        message_id?: string
        created_at: date
    }

    Video {
        id: string
        name: string
        length: number // milliseconds
        video_url: string
        owner: User
        owner_id: string
        message: Message
        message_id: string
        created_at: date
    }

    OTP {
        id: string
        email: string
        value: string
        created_at: date
        expires_at: date
    }

  ```

**Author**

    Wilfreno B. Gayongan
