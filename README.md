<div align="center">
  
[![Croom](https://github.com/Wilfreno/croom/blob/main/apps/client/public/croom-logo.png)](https://www.chat-up.xyz/)
</div>

<div align="center">

[![Croom](https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=40&duration=1&pause=&color=7F00FF&center=true&vCenter=true&repeat=false&width=435&lines=Croom)](https://www.chat-up.xyz/)
</div>

<p align="center" >Connect and Chat with your friends and Communities</p>

# Contents
- [Website](#website)
- [Features](#features)
- [Technology used](#technology-used)
- [Project structure](#project-structure)
- [Run the app locally](#run-the-app-locally)
    - [Prerequisites](#prerequisites)
    - [Install](#install)
    - [Server environment variables](#server-environment-variables)
    - [Client environment variables](#client-environment-variables)
    - [Start the app](#start-the-app)
- [Testing](#testing)
- [Continuous integration](#continuous-integration)
- [Releases and commit messages](#releases-and-commit-messages)

# Website
:globe_with_meridians: <https://www.chat-up.xyz/>

# Features
- Sign up with email and password, verified by a one-time code sent by email
- Sign in with Google
- Account recovery by email code
- One-to-one and group conversations
- Real-time messaging with photos, and a media viewer per conversation
- Online status
- Video calls, relayed through a mediasoup SFU

# Technology Used
- Client
    - [Next.js](https://nextjs.org/) and [React](https://react.dev/)
    - [TanStack Query](https://tanstack.com/query)
    - [Tailwind CSS](https://tailwindcss.com/) and [shadcn/ui](https://ui.shadcn.com/)
    - [UploadThing](https://uploadthing.com/) for image storage
    - [Socket.IO client](https://socket.io/) and [mediasoup-client](https://mediasoup.org/)
- Server
    - [NestJS](https://nestjs.com/) on [Fastify](https://fastify.dev/)
    - [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
    - [Socket.IO](https://socket.io/) for real-time events
    - [mediasoup](https://mediasoup.org/) for video calls
    - [Passport](https://www.passportjs.org/) for email/password and Google sign-in
    - [Nodemailer](https://www.nodemailer.com/) with [React Email](https://react.email/) templates
- Tooling
    - [pnpm](https://pnpm.io/) workspaces and [Turborepo](https://turbo.build/)
    - [Vitest](https://vitest.dev/) and [Testing Library](https://testing-library.com/)
    - [semantic-release](https://semantic-release.gitbook.io/) for versioning

# Project Structure
```
apps/
  client/        Next.js front end                    (http://localhost:3000)
  server/        NestJS api, sockets and calls        (http://localhost:8000)
  react-email/   email template previews
  fastify-server/  the previous server, kept for reference; not part of the workspace
packages/
  constants/  enums/  types/  utils/        shared by the client and the server
  schemas/  models/  guards/                Mongo schemas, data access and route guards for the server
```
The shared packages are built automatically when you install, and are imported as `@repo/<name>`.

# Run the App Locally

## Prerequisites
- [Node.js](https://nodejs.org/) 24 (the version CI uses)
- [pnpm](https://pnpm.io/) 10. With [Corepack](https://nodejs.org/api/corepack.html) enabled, the version pinned in `package.json` is picked automatically:
  ```bash
  corepack enable
  ```
- A MongoDB **replica set**. Signup and messaging use transactions, which a standalone `mongod` does not support. A free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster is a replica set.

## Install
```bash
git clone https://github.com/Wilfreno/croom.git
cd croom
pnpm install
```
One install at the root covers every app and package, and builds the shared packages.

## Server environment variables
Create **apps/server/.env**:

```env
PORT=8000
SERVER_URL=http://localhost:8000
CLIENT_URL=http://localhost:3000

MONGO_DB_CONNECTION_STRING=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

GMAIL_USER=
GMAIL_2F_AUTH_APP_PASS=

ABSENT_PASSWORD_HASH=
```

#### PORT, SERVER_URL and CLIENT_URL
`PORT` is where the server listens. `SERVER_URL` is the server's public address, used to build the Google callback URL. `CLIENT_URL` is the client's address: the only origin allowed to call the api, and where the browser is sent after Google sign-in and logout.

Setting `NODE_ENV=production` makes the session cookie require HTTPS and work across domains, for when the client and server are deployed on different domains.

#### MONGO_DB_CONNECTION_STRING
The MongoDB connection string. For Atlas, follow [Get Your Free MongoDB Atlas Cluster!](https://www.youtube.com/watch?v=VkXvVOb99g0) and copy the connection string it gives you.

#### GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
Used for signing in with Google.

- Go to the [credentials page](https://console.cloud.google.com/apis/credentials) of the Google Cloud Console
- Click **Create Credentials** and choose **OAuth Client ID**

:warning: If this is your first time using Google OAuth, you may first have to set up the [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent): fill in the required information and choose **External** as the user type.

- Choose **Web application** as the application type and give it a name
- Under **Authorized redirect URIs**, add
  ```
  http://localhost:8000/v1/auth/google/callback
  ```
  (in general, `SERVER_URL` followed by `/v1/auth/google/callback`)
- Click **Create**, then copy the **Client ID** and **Client secret**

#### GMAIL_USER and GMAIL_2F_AUTH_APP_PASS
The server emails sign-up and account recovery codes through Gmail with [Nodemailer](https://www.nodemailer.com/). This needs **2-Step Verification** turned on for the Gmail account, and an app password.

- `GMAIL_USER` is the Gmail address, for example `example@gmail.com`
- `GMAIL_2F_AUTH_APP_PASS`: open your [Google Account](https://myaccount.google.com/), search for **App passwords**, create one and copy it

:warning: The app password is shown only once, so store it somewhere safe.

#### ABSENT_PASSWORD_HASH
A bcrypt hash of a random value. When someone logs in with an email that has no account, the server still checks the password against this hash. That way the login takes as long as it would for a real account, so the response time does not reveal which emails are registered.

Generate it from the repository root:
```bash
pnpm --silent --filter @repo/models exec node -e "require('bcrypt').hash(require('crypto').randomUUID(), 14).then((h) => console.log('ABSENT_PASSWORD_HASH=' + h.replaceAll('\$', '\\\\\$')))"
```
and paste the line it prints into the `.env`.

:warning: Keep the `\` in front of every `$`. The server expands `$NAME` references in `.env` files, so an unescaped hash like `$2b$14$…` is cut short when it loads, and quoting it does not help. Logins still work with a broken hash, but the protection above is lost.

#### Video calls (optional)
The defaults work for calls on your own machine.

| Variable | Default | Purpose |
|---|---|---|
| `MEDIASOUP_ANNOUNCED_ADDRESS` | not set (calls only work on this machine) | The public IP or hostname clients reach the server at. When set, media is served on all network interfaces. |
| `MEDIASOUP_PORT` | `40000` | The first media port. Each worker takes the next one (40000, 40001, …) over both UDP and TCP, so open that range in the firewall. |
| `MEDIASOUP_WORKERS` | the number of CPU cores | How many mediasoup worker processes to run. |
| `MEDIASOUP_MAX_PEERS_PER_ROUTER` | `6` | How many participants share a router before the call spreads over more of them. |

## Client environment variables
Create **apps/client/.env**:

```env
NEXT_PUBLIC_SERVER=http://localhost:8000
NEXT_PUBLIC_SERVER_V1=http://localhost:8000/v1

UPLOADTHING_TOKEN=
```

#### NEXT_PUBLIC_SERVER and NEXT_PUBLIC_SERVER_V1
Both point at the same server and have to agree. `NEXT_PUBLIC_SERVER_V1` is the versioned root that api requests are made against, so request paths carry no version of their own (`/auth/session`). `NEXT_PUBLIC_SERVER` is the bare address, used for sockets and for the full-page navigations that cannot go through the api client, such as the Google sign-in handoff and logout.

#### UPLOADTHING_TOKEN
The client stores images with [UploadThing](https://uploadthing.com/). [Sign in](https://uploadthing.com/sign-in), [create an app](https://uploadthing.com/dashboard/), then go to **API Keys** and copy the **UPLOADTHING_TOKEN**.

## Start the App
From the repository root:
```bash
pnpm dev
```
This starts the client on <http://localhost:3000> and the server on <http://localhost:8000>, both reloading on changes.

# Testing
From the repository root:
```bash
pnpm test
```
runs every workspace's tests through Turborepo. To work on one workspace, run its tests in watch mode, for example:
```bash
pnpm --filter client test:watch
pnpm --filter nest-server test:watch
```

# Continuous Integration
The **Test** workflow (`.github/workflows/test.yml`) runs on every pull request. It only tests what the change can affect:

| You change | What gets tested |
|---|---|
| `apps/client` | the client |
| `apps/server` | the server |
| a shared package | that package, plus every workspace that uses it |
| the root `package.json`, `pnpm-lock.yaml` or `test.yml` | everything |
| anything outside a workspace (docs, other workflows) | nothing, and the check passes |

# Releases and Commit Messages
Versions follow [semantic versioning](https://semver.org/) and are released automatically. Every push to `main` runs the **Release** workflow (`.github/workflows/release.yml`). It runs the tests, then [semantic-release](https://semantic-release.gitbook.io/) works out the next version from the commit messages since the last release. It then tags `vX.Y.Z`, publishes a GitHub release, and commits the updated [CHANGELOG.md](CHANGELOG.md) back to `main`. The workflow can also be started by hand from the Actions tab.

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/), `type(scope): description`, and the type decides the release:

| Commit | Release | Example |
|---|---|---|
| `fix:`, `perf:`, `revert:` | patch, 1.0.0 → 1.0.1 | `fix(client): show the online indicator` |
| `feat:` or `feature:` | minor, 1.0.0 → 1.1.0 | `feat(call): ring conversation members` |
| `!` after the type, or a `BREAKING CHANGE:` footer | major, 1.0.0 → 2.0.0 | `feat(api)!: drop the v1 routes` |
| `chore:`, `test:`, `ci:`, `refactor:`, `docs:`, `style:`, `build:` | none | `test: cover the call gateway` |

When a pull request is squash-merged, only its title counts, so give the title a type as well. The rules live in [release.config.js](release.config.js).
