
<div align="center">
  
[![ChatUp](https://github.com/Wilfreno/chatup/blob/main/client/public/croom-logo.png)](https://www.chat-up.xyz/)
</div>

<div align="center">

[![ChatUp](https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=40&duration=1&pause=&color=7F00FF&center=true&vCenter=true&repeat=false&width=435&lines=ChatUp)](https://www.chat-up.xyz/)
</div>

<p align="center" >Connect and Chat with your friends and Communities</p>

# Content
- [Website](#website)
- [Technology used](#technology-used)
- [Run the app locally](#run-the-app-locally)
    - [Configure Client](#configure-client)
        - [Clone the repository](#clone-the-github-repository)
        - [Give the client environment variables](#give-the-client-environment-variables)
            - [UPLOADTHING_TOKEN](#uploadthing_token)
        - [Start the Client](#start-the-client)
    - [Configure Server](#configure-server)
        - [Give the server environment variables](#give-the-server-environment-variables)
            - [MONGODB_URI](#mongodb_uri)
            - [GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET](#google_client_id-and-google_client_secret)
            - [GMAIL_USER and GMAIL_2F_AUTH_APP_PASS](#gmail_user-and-gmail_2f_auth_app_pass)
            - [UPLOADTHING_TOKEN](#uploadthing_token)
        - [Start the Server](#start-the-server-server)
        

# Website 
:globe_with_meridians: <https://hanapbh.vercel.app/nearby>

# Technology Used
- Client
    - [Next.js](https://nextjs.org/)
    - [React.js](https://react.dev/)
    - [TanStack Query](https://tanstack.com/)
    - [Tailwind-css](https://tailwindcss.com/)
    - [ShadCN](https://ui.shadcn.com/)
    - [UploadThing](https://uploadthing.com/)
- Server
    - [Mongoose.js](https://mongoosejs.com/)
    - [Fastify](https://fastify.dev/)
    - [Redis](https://redis.io/)
    - [SocketIO](https://socket.io/)
    - [Passport.js](https://www.passportjs.org)
    - [Nodemailer](https://www.nodemailer.com/)


# Run the App Locally
## Clone the github [repository](https://github.com/Wilfreno/chatup)

```bash 
git clone https://github.com/Wilfreno/chatup.git
```
## Configure Client

- Go to the project root directory
```bash
cd ./chatup
```

-  Go to the client directory
```bash
cd ./client
```

-  Install dependencies
:warning: The project is using pnpm as a package manager to use pnpm you have tp install it via npm
```bash
npm install pnpm -g
```
```bash 
pnpm install
```

### Give the client environment variables 
Create a **.env.local** file inside the client directory and paste the environment variables

**./client/.env.local**

```env
NEXT_PUBLIC_SERVER = http://localhost:8000
ClIENT_URL = http://localhost:3000

UPLOADTHING_TOKEN = ""
```

#### UPLOADTHING_TOKEN 
The client is using [uploadthing](https://uploadthing.com/) as an images storage service.
 [sign in with your github account](https://uploadthing.com/sign-in), then [create a new app](https://uploadthing.com/dashboard/), go to **API Keys** and copy the **UPLOADTHING_TOKEN** 

### Start the Client
```bash
pnpm dev
```

## Configure Server
- Go back to the root directory
```bash 
cd ..
```

- Navigate to server directory
```bash
cd ./server
```

- Install dependencies 
```bash
pnpm install
```

### Install Redis
[Redis](https://redis.io/) is required to cache data on the server and have a faster response time.
[Install Redis](https://redis.io/docs/latest/operate/oss_and_stack/install/install-redis/)

### Give the server environment variables

create a **.env** file inside the server directory and paste the environment variables

```env
MONGODB_URI = ""

GOOGLE_CLIENT_ID = ""
GOOGLE_CLIENT_SECRET = ""

SERVER_PRODUCTION_ORIGIN = "http://localhost:8000"
SERVER_DEVELOPMENT_ORIGIN = "http://localhost:8000"

CLIENT_PRODUCTION_ORIGIN = "http://localhost:3000"
CLIENT_DEVELOPMENT_ORIGIN = "http://localhost:3000"

GMAIL_USER = ""
GMAIL_2F_AUTH_APP_PASS  = ""

UPLOADTHING_TOKEN = ""
```

#### MONGODB_URI
Is the mongodb connection string, you can follow the mongodb [Get Your Free MongoDB Atlas Cluster!](https://www.youtube.com/watch?v=VkXvVOb99g0) youtube guide to get your own connection string 


#### GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET 
Is required for [fastify-passport](https://github.com/fastify/fastify-passport) to work with GOOGLE OAUTH.

- Got to the [credentials page](https://console.cloud.google.com/apis/credentials) on GOOGLE Cloud Console's APIs & Services
- click **Create Credentials** and choose **OAuth Client ID** 

:warning: If this is your first time using google OAUTH you might have to create [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent), fill out the required information and select **External**
for User type and continue creating the OAuth Client ID.

- choose **Web Application** for application type
- name your OAuth Client ID
- add to the Authorized JavaScript origins

```
http://localhost:8000
```
- add to Authorized redirect URIs
```
http://localhost:8000/api/auth/callback/google
```
- click **create**
- copy the provided **CLIENT ID** and **CLIENT SECRET**

#### GMAIL_USER and GMAIL_2F_AUTH_APP_PASS
the server sends an email to the user during sign up for verification using [nodemailer](https://www.nodemailer.com/).
for [nodemailer](https://www.nodemailer.com/) to work with gmail you have to enable **Two Factor Authentication** on your gmail account and create an app pass

**GMAIL_USER** is the gmail account, example: 
```
GMAIL_USER = "example@gmail.com"
```

**GMAIL_2F_AUTH_APP_PASS** 

- go to [Manage your Google Account](https://myaccount.google.com/?hl=en&utm_source=OGB&utm_medium=act&gar=WzJd&authuser=0&rapt=AEjHL4NUAYtsUyIIBnXNWlLFiYiijqrnGquWvcTtza85MRetrpf5MYRhF7r4ZOZnhDwQklyw1VH2jw-XnE-4Z6gBg-kr9swl5euXKzFFLBcyp5xAj8tyRRM) and search for **App passwords** create one and copy the password,

:warning: the password can only be seen once, so make sure to copy and  store it somewhere safe

#### UPLOADTHING_TOKEN

see [UPLOADTHING_TOKEN](#uploadthing_token)

### Start the Server

```bash
pnpm dev
```