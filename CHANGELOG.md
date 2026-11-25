## [1.7.1](https://github.com/Wilfreno/croom/compare/v1.7.0...v1.7.1) (2026-11-25)

### Bug Fixes

* **server:** set NODE_ENV before pm2 starts the server ([7a8f018](https://github.com/Wilfreno/croom/commit/7a8f0188e4e5f3e52c3f99b90e0780c9578010d1))

## [1.7.0](https://github.com/Wilfreno/croom/compare/v1.6.0...v1.7.0) (2026-11-24)

### Features

* **client:** show server availability hours on login and sign-up ([84f6791](https://github.com/Wilfreno/croom/commit/84f67915a7e63f7c556ab5e8805e546b22688086))

## [1.6.0](https://github.com/Wilfreno/croom/compare/v1.5.0...v1.6.0) (2026-11-19)

### Features

* call from compose and show call notices in the chat ([7f22da4](https://github.com/Wilfreno/croom/commit/7f22da400acc71a38be9f204073fefa0db870ea9))
* **client:** add a chat panel to calls ([b9ee652](https://github.com/Wilfreno/croom/commit/b9ee652569ca572db22c279569370ca0b7515909))
* **client:** color call avatars like the rest of the app ([1be9c5c](https://github.com/Wilfreno/croom/commit/1be9c5cc14e92d47c7f5f7e7f920dee83ee113d6))
* **client:** let callers choose their microphone ([fe3a6d1](https://github.com/Wilfreno/croom/commit/fe3a6d1316b1dd423ee8f0ca633ca6972bfd20f3))
* **client:** remember call device and on/off choices ([9a12630](https://github.com/Wilfreno/croom/commit/9a12630af1b2135f707418555c32df75f4bdd072))
* **client:** restyle the call controls ([82a84b7](https://github.com/Wilfreno/croom/commit/82a84b79e24419ad11a4aa5f5c748e02d6a9d458))
* **client:** ring incoming calls at the top center ([0ec29dc](https://github.com/Wilfreno/croom/commit/0ec29dcd10138f8cd5a5427306c76fc5baa2cdad))
* **client:** show call participants in a side panel and allow pinning ([793a0ba](https://github.com/Wilfreno/croom/commit/793a0bad93db7fac01625bc9456305b089a46816))
* **client:** wire the settings page to the new user endpoints ([1b3f7d5](https://github.com/Wilfreno/croom/commit/1b3f7d50fdd2e860d3c8eb1a8e51ed7e7f5fd68d))
* hanging up a one-to-one call ends it for both ([a45ff4f](https://github.com/Wilfreno/croom/commit/a45ff4ffd72f80d6f9e9f1e71ff962f85ab9f6c9))
* move photo uploads to the server and delete files on removal ([b90be59](https://github.com/Wilfreno/croom/commit/b90be59d47fc54cb4b86088edf7bca212a6570c9))
* post a missed call notice when nobody answers ([943fd27](https://github.com/Wilfreno/croom/commit/943fd27c8a5e14691ef3c5c04fbb105b3820b989))
* **server:** add profile, password and account settings endpoints ([0de04ce](https://github.com/Wilfreno/croom/commit/0de04ce1c7753e12dd72413dfbdb446c33fcb366))
* wait for an answer before joining a call, with ringtones ([5d2d056](https://github.com/Wilfreno/croom/commit/5d2d056df7777d66c76236116db907d971865263))

### Bug Fixes

* **client:** allow images from the ufs.sh UploadThing host ([12ecdb1](https://github.com/Wilfreno/croom/commit/12ecdb15e27ec902f5d85ff2ea8201121199e0c0))
* **client:** remove attached photos by id and wait for removals before sending ([50346fe](https://github.com/Wilfreno/croom/commit/50346fe5f72479ae904a6b6f2bd5624dfb1c21f7))
* close review gaps in the settings endpoints ([14a6de1](https://github.com/Wilfreno/croom/commit/14a6de177f40ef651b09a45576218a5299ba26e5))
* keep answered rings and handle two people calling at once ([9e47bfe](https://github.com/Wilfreno/croom/commit/9e47bfef30fdcecd430ffa4b42a593d5fc54fb52))
* listen for answers before ringing ([3a93cd6](https://github.com/Wilfreno/croom/commit/3a93cd69f59e7af5f187e926a6c17fc317a2dba7))
* make photo changes transactional and usernames unique ([2a88954](https://github.com/Wilfreno/croom/commit/2a889548dd0551b17b60ec9e97eadcee4fff03ac))
* recover from failed pending-photo deletes and document the server upload token ([0570fd6](https://github.com/Wilfreno/croom/commit/0570fd64fe13f416564fb410163b534c544c0f80))
* **server:** keep every group with an admin when an account is deleted ([fc08a49](https://github.com/Wilfreno/croom/commit/fc08a491851d9691dcedbd655985d59e349aae60))
* **server:** only members can ask about a call when cancelling ([38fc1cf](https://github.com/Wilfreno/croom/commit/38fc1cf7f7b27e6a429d056544c02bf6ab76d3ba))
* settle call rings on the server and fix review findings ([d4cda02](https://github.com/Wilfreno/croom/commit/d4cda0272b8c563b68c41fb95d25b4622ca82410))
* stop rings by caller and dismiss your own toast when joining ([3b025d8](https://github.com/Wilfreno/croom/commit/3b025d83bb118bcffdcb6b44d0db66ca0adcf65b))
* stop rings once everyone declines and answer on the live socket ([9f917e4](https://github.com/Wilfreno/croom/commit/9f917e4b9dca4aaf0ca4c9a222a3ba5d4e3233e4))

## [1.5.0](https://github.com/Wilfreno/croom/compare/v1.4.0...v1.5.0) (2026-11-17)

### Features

* **client:** block and unblock from the info panel and settings ([94ecfe7](https://github.com/Wilfreno/croom/commit/94ecfe70317c676a3ecfd748373d75c96ffe0d00))
* **client:** edit nicknames and show nickname notices in the chat ([3ce8b8d](https://github.com/Wilfreno/croom/commit/3ce8b8d5ad979cd24d284b7303fbd61793b53edb))
* **client:** match the manage members button to manage admin ([91970cb](https://github.com/Wilfreno/croom/commit/91970cb5b84fa18732c6ed1d616515592328d45e))
* **client:** react when a group's members change ([d634921](https://github.com/Wilfreno/croom/commit/d63492169e7fb70762c63793581358a9b8dbff93))
* **client:** save group photos through the new photo endpoint ([7afa1e5](https://github.com/Wilfreno/croom/commit/7afa1e535083b3a00fe3962b809a41c46333a9c9))
* **client:** send user reports to the new report endpoint ([9a5b497](https://github.com/Wilfreno/croom/commit/9a5b497d86c90c0632442bd6bb87a56415a284e5))
* **client:** show initials avatars for users without a photo ([60e6714](https://github.com/Wilfreno/croom/commit/60e6714ee358220bb7f70a892e38aec7c627e67e))
* **client:** show the block state in place of the message input ([b2343f1](https://github.com/Wilfreno/croom/commit/b2343f131be562248395f6175569626fe2f96ed5))
* **client:** show the blocked state as soon as a send is refused ([a90dd16](https://github.com/Wilfreno/croom/commit/a90dd16757c7859e7f1cf857ac23f4804940c7b5))
* **client:** tell a two-member group apart from a direct chat ([0c56bbe](https://github.com/Wilfreno/croom/commit/0c56bbe3e292cac5e993094aa1d1d102568f93fc))
* **client:** trim and cap the group name before saving it ([3622f67](https://github.com/Wilfreno/croom/commit/3622f67d161877f483f82007ffc87c19ab3e5dde))
* let group admins manage admins and members ([890d2fb](https://github.com/Wilfreno/croom/commit/890d2fb379e0e2c00eb3686c0915acbf82551d01))
* let members leave a group chat after confirming ([7e13636](https://github.com/Wilfreno/croom/commit/7e1363656285eed1cd1cce127cf0a76fea447896))
* **server:** block and unblock one-to-one conversations ([96c4220](https://github.com/Wilfreno/croom/commit/96c422011ae6756f04889a4cd34a1219ab4b3b5b))
* **server:** let a blocked member keep reading the conversation ([322e462](https://github.com/Wilfreno/croom/commit/322e462c428e0a887ca29031016aac7855845f27))
* **server:** let group admins change the group photo ([768cb05](https://github.com/Wilfreno/croom/commit/768cb0547997790955b52e303d21f63ccb00a9de))
* **server:** let group admins rename the group ([ca9c428](https://github.com/Wilfreno/croom/commit/ca9c428dfefd644b74fee303b7d3310bdc4e4db5))
* **server:** let members report another member of a conversation ([7ea9b1a](https://github.com/Wilfreno/croom/commit/7ea9b1a38fab805b503d66332ee98fc17fb8e1f1))
* **server:** set nicknames and post a notice when one changes ([9879882](https://github.com/Wilfreno/croom/commit/987988232dc2b644b4e6c7b25684390e01e31242))
* **server:** tell members when a group's members change ([bebd047](https://github.com/Wilfreno/croom/commit/bebd04711543734d9829056b1d8962df518d1f5e))

### Bug Fixes

* **client:** close the call when the server ends it ([c1702c3](https://github.com/Wilfreno/croom/commit/c1702c37e4b9535f758561861b104d23cddb590f))
* **client:** derive the conversation header from the conversation ([806326f](https://github.com/Wilfreno/croom/commit/806326f1123f2b6576931d6f3a3b534103a8fc2f))
* **client:** hide nickname editing in a blocked conversation ([99af4be](https://github.com/Wilfreno/croom/commit/99af4beeb1ede2a4ee3c456c347df3ca6b229eb9))
* **client:** hide the empty members list when it is collapsed ([66fd429](https://github.com/Wilfreno/croom/commit/66fd429c88219bdc652e3b54257c2ca2ed34ac9d))
* **client:** hide the video call button in a blocked conversation ([6e1adcb](https://github.com/Wilfreno/croom/commit/6e1adcb5a28205b303453f53494f8a58eda8f765))
* **client:** keep the info sections for a group's last member ([f64cae7](https://github.com/Wilfreno/croom/commit/f64cae7eb7f8423677b3dedf7257bcbbb595f438))
* **client:** refresh after a refused block and share the blocked banner ([54b86cc](https://github.com/Wilfreno/croom/commit/54b86cc1a31dd3d08bdfc66d37c025b5a820c675))
* **client:** refresh compose when a send is refused as blocked ([fa37a88](https://github.com/Wilfreno/croom/commit/fa37a881e57d18ea7d9a85bcc0c5404489c490d2))
* **client:** send either conversationId or members from compose ([9923d52](https://github.com/Wilfreno/croom/commit/9923d52b43530aaa7c4fb12dc2ee7e3884e47d7a))
* **client:** stop marking messages seen for a blocked member ([c608a88](https://github.com/Wilfreno/croom/commit/c608a887dbd72afe2d2970ce1d014f399b1c451c))
* **client:** update the conversation lists when members change ([9ccb823](https://github.com/Wilfreno/croom/commit/9ccb8239a88d4083eb62e78a638ff7540488d3ed))
* **client:** widen the info sidebar on large screens ([23c3fb0](https://github.com/Wilfreno/croom/commit/23c3fb00e388e533f157760208c4923e238405c6))
* **models:** include the sender's display name in message history ([b7e1f16](https://github.com/Wilfreno/croom/commit/b7e1f16a2a1ac0c5a1764f3acaf6c89a0073217f))
* **server:** back out of a call that was blocked mid-join ([a9b4369](https://github.com/Wilfreno/croom/commit/a9b43698877c1a33b2e8235975980623c114d252))
* **server:** backfill isGroupChat when the server starts ([c109675](https://github.com/Wilfreno/croom/commit/c109675c681beaa678380f13fa3623c3e106fa28))
* **server:** clear generated group names in the isGroupChat backfill ([26f85bb](https://github.com/Wilfreno/croom/commit/26f85bb655954466d020558b186d11680db223bb))
* **server:** end a running call when the conversation is blocked ([8661851](https://github.com/Wilfreno/croom/commit/86618514149129f143fae0a33e50d7c59c73d9c1))
* **server:** re-check membership after joining a call ([42091d3](https://github.com/Wilfreno/croom/commit/42091d30982d39e86a78d8223aa8fa5f160a7007))
* **server:** refuse calls into a blocked conversation ([c9b91a2](https://github.com/Wilfreno/croom/commit/c9b91a262c9318562e703ba47890bd1bda1414fb))
* **server:** refuse nickname changes in a blocked conversation ([ee2d43c](https://github.com/Wilfreno/croom/commit/ee2d43c026fde4ba3bb2f68251053aee88318b8f))
* **server:** refuse sending into a blocked conversation ([7c8519e](https://github.com/Wilfreno/croom/commit/7c8519e7b3b1cc539415715b1ce90c3aaf9af63d))
* **server:** stop saving member names as a new group's name ([268cf43](https://github.com/Wilfreno/croom/commit/268cf43d4522fd88ecf88dbb096f349861ac07a3))
* **server:** take removed and departing members out of a group call ([e71ebd4](https://github.com/Wilfreno/croom/commit/e71ebd4555646f9dac04175719e348b463c850b7))

## [1.4.0](https://github.com/Wilfreno/croom/compare/v1.3.0...v1.4.0) (2026-11-17)

### Features

* block and unblock one-to-one conversations ([46c2a16](https://github.com/Wilfreno/croom/commit/46c2a16e12dfad8289c3516359dcffce2e3614c0))

## [1.3.0](https://github.com/Wilfreno/croom/compare/v1.2.4...v1.3.0) (2026-11-17)

### Features

* **client:** add ConversationAvatar and use group photos ([9397f00](https://github.com/Wilfreno/croom/commit/9397f0091187f7020c37b65ddaed80561a75deeb))
* **client:** send messages optimistically with retry and resending state ([bfdc95c](https://github.com/Wilfreno/croom/commit/bfdc95c47018dde0f997276f2952a1823c5b835a))
* **client:** show group chats as a compact avatar group ([be7288a](https://github.com/Wilfreno/croom/commit/be7288af3f6badb8424f7010333774162ab2d5de))

### Bug Fixes

* **client:** make the auth pages responsive ([3b689e7](https://github.com/Wilfreno/croom/commit/3b689e7e74f0052fc02ac4c808e0988f4239ce1e))
* **client:** make the main app responsive ([af1dff7](https://github.com/Wilfreno/croom/commit/af1dff7c559582fc71dd2f237057e518d3d950d6))
* **client:** name conversations and show online status consistently ([3a8dc70](https://github.com/Wilfreno/croom/commit/3a8dc70f4f55e88a784affb7767ca1c81f5e0585))
* **client:** stop treating one-to-one chats as groups on the conversation page ([a72df2b](https://github.com/Wilfreno/croom/commit/a72df2b0e68aabcdd60f1735438254ec4aa1cf83))
* **server:** populate members when finding conversations by members ([2c26226](https://github.com/Wilfreno/croom/commit/2c2622629bdca10ad71525743b39c29228e3e28a))

## [1.2.4](https://github.com/Wilfreno/croom/compare/v1.2.3...v1.2.4) (2026-11-14)

### Bug Fixes

* **server:** authenticate sockets in handshake middleware ([5bf205c](https://github.com/Wilfreno/croom/commit/5bf205c8dec42af2b6968b9e6a792e1a524c5279))

## [1.2.3](https://github.com/Wilfreno/croom/compare/v1.2.2...v1.2.3) (2026-11-14)

### Bug Fixes

* **client:** stop redirecting the domain root to the base path ([26408ae](https://github.com/Wilfreno/croom/commit/26408aea3b139f580db904b807dc1ea712d47bd4))

## [1.2.2](https://github.com/Wilfreno/croom/compare/v1.2.1...v1.2.2) (2026-11-13)

### Bug Fixes

* **ci:** build the shared packages explicitly on deploy ([f6c2402](https://github.com/Wilfreno/croom/commit/f6c24026acc688b96ec832cdc587cd87e58fa277))

## [1.2.1](https://github.com/Wilfreno/croom/compare/v1.2.0...v1.2.1) (2026-11-13)

### Bug Fixes

* **server:** listen on 127.0.0.1 so socket.io gets every request ([66fd9f2](https://github.com/Wilfreno/croom/commit/66fd9f2d56276c5acfd0b5b70b16e4d6cc2edecc))

## [1.2.0](https://github.com/Wilfreno/croom/compare/v1.1.2...v1.2.0) (2026-11-13)

### Features

* **server:** log each request and response ([7a2c3ac](https://github.com/Wilfreno/croom/commit/7a2c3ac5fe2e0fe2f0ce4ee18e33ddc5f020877c))

## [1.1.2](https://github.com/Wilfreno/croom/compare/v1.1.1...v1.1.2) (2026-11-13)

### Bug Fixes

* **client:** redirect the bare root to the base path ([b20478d](https://github.com/Wilfreno/croom/commit/b20478d43f42e14b3a653c17e86326fdcd9a36a1))

## [1.1.1](https://github.com/Wilfreno/croom/compare/v1.1.0...v1.1.1) (2026-11-13)

### Bug Fixes

* **client:** patch Next.js and declare UPLOADTHING_TOKEN for turbo ([b687a34](https://github.com/Wilfreno/croom/commit/b687a3417e67762a36e9ff8a7e9eb9f11fe4d65f))
* **server:** build only src so the entry lands at dist/main.js ([2cde832](https://github.com/Wilfreno/croom/commit/2cde8322659d418790c2b242c749e26f36924081))

## [1.1.0](https://github.com/Wilfreno/croom/compare/v1.0.16...v1.1.0) (2026-11-13)

### Features

* **call:** add call screen with camera tile and camera controls ([3fe2ae6](https://github.com/Wilfreno/croom/commit/3fe2ae6d04456dc6af9c5a751bfbbdc786d5a2b6))
* **call:** add mediasoup SFU call signaling on the server ([1da6601](https://github.com/Wilfreno/croom/commit/1da660133a08b319d9f383c16cfe0ad0a1bc139f))
* **call:** connect the call screen to the SFU with remote participants ([4e4eef1](https://github.com/Wilfreno/croom/commit/4e4eef1dd734fdad0da389d75cf217a82674e440))
* **call:** ring conversation members with an incoming-call toast ([1916a4b](https://github.com/Wilfreno/croom/commit/1916a4b613ce33fded1ffc48649da1760ff04bed))
* **client:** rework signup into a multi-step OTP form ([f633301](https://github.com/Wilfreno/croom/commit/f6333010102fb997efd5ec9abb6543787390a517))
* **client:** serve the app under a configurable base path ([4b4ec7b](https://github.com/Wilfreno/croom/commit/4b4ec7bdad8b7069c7ebce60a2d7a391a54fb473))
* **conversation:** enable media viewer ([97def3c](https://github.com/Wilfreno/croom/commit/97def3c68dcccfe545f3d7036b31f9ace048480d))
* **enums:** give enums string values and add signup enums ([9bb7f21](https://github.com/Wilfreno/croom/commit/9bb7f21653cd4c1f70f3862516e8dc5663094a3d))
* **guards:** add rate limit package ([24b55f1](https://github.com/Wilfreno/croom/commit/24b55f1138b839e8d226f44c36558e12660c7f70))
* **message:** create conversation atomically with first message ([10b0ac7](https://github.com/Wilfreno/croom/commit/10b0ac72c1b5d54cd336007d0b3a94c67153a807))
* **message:** enable real time messaging ([d20fa15](https://github.com/Wilfreno/croom/commit/d20fa1549a20ae5607dc2f64333345cca126dae3))
* **message:** send conversation id and nicknames with socket message payloads ([9981bc1](https://github.com/Wilfreno/croom/commit/9981bc10115cc14dc26d004d6b875742630c1bae))
* **models:** add injectable mongoose model providers ([ec4a0f5](https://github.com/Wilfreno/croom/commit/ec4a0f59cba99f44a0d8c8fa1a1366ea3eefe64b))
* **packages:** add shared constants and utils packages ([80bd5f2](https://github.com/Wilfreno/croom/commit/80bd5f2a6c4cef40d40151cbbe659d47e93283ce))
* **react-email:** add email template preview app ([b0b9c64](https://github.com/Wilfreno/croom/commit/b0b9c64130b863adb342de3d95ae5292c0aee3ea))
* **schemas:** add OTP schemas and camelCase the user fields ([b7365c3](https://github.com/Wilfreno/croom/commit/b7365c31a44c90f12d0a1dbb66c7779f81fa8ba7))
* **server:** add mail module ([b08b07d](https://github.com/Wilfreno/croom/commit/b08b07d7891dfca07d5372300551920dbb6c8ac1))
* **server:** add OTP module ([e138b14](https://github.com/Wilfreno/croom/commit/e138b149d70c5aa91462c63f706455d80e53d8cb))
* **server:** add unified server response layer ([8bd1ba5](https://github.com/Wilfreno/croom/commit/8bd1ba59f1b853cb2a7657cc897f4cfdac46f2dd))
* **server:** implement user creation and availability checks ([b515eae](https://github.com/Wilfreno/croom/commit/b515eae1be9dd5975dd15d14eae484aa15c7e00c))
* **sidebar:** enable sidebar and serve user conversations from the nest server ([edf39f3](https://github.com/Wilfreno/croom/commit/edf39f350c4654f07869c1741f0eaab3a17d070c))
* **toast:** enable message toast ([68d9568](https://github.com/Wilfreno/croom/commit/68d9568f5aa5c23239193fa442d573668061bc5b))
* **types:** add auth context and response payload types ([10093dc](https://github.com/Wilfreno/croom/commit/10093dc58dcaafc33619e5dfea3995d455b2665d))
* **types:** split package into front-end and back-end entry points ([5f8a7ef](https://github.com/Wilfreno/croom/commit/5f8a7ef017ed4f77f00681a73d355b67a1f71349))

### Bug Fixes

* **auth:** wait for the session to load before redirecting ([cdcb018](https://github.com/Wilfreno/croom/commit/cdcb018e04ef5318efe627f5b5a0ef1ef5f9455a))
* **client:** fix bugs found while writing tests ([55429a6](https://github.com/Wilfreno/croom/commit/55429a62a812a556d38bbc406ac23daefe1baab0))
* **client:** import User from @repo/schemas ([6fda6d4](https://github.com/Wilfreno/croom/commit/6fda6d4c77ccbefccc4d569c9ed8ff181a487ce6))
* **client:** label the recovery OTP field and handle a failed code request ([611b2d4](https://github.com/Wilfreno/croom/commit/611b2d42ee9b262686c4575b3d31653e8709b893))
* **client:** make the production build pass ([fba763d](https://github.com/Wilfreno/croom/commit/fba763d16b08c36b28594b03abef8afc0e6f2287))
* **compose:** display user search result ([5c455ea](https://github.com/Wilfreno/croom/commit/5c455ea7f3af966463581684a576ddb530f4f0ee))
* **compose:** user compose search input ([9a317fb](https://github.com/Wilfreno/croom/commit/9a317fb987ee77393536d15c3763771980d8f748))
* **conversation:** active conversation section ([a8c486d](https://github.com/Wilfreno/croom/commit/a8c486d7b3d43cc5a0a16447b4fdb2da653a0215))
* **home:** add missing key to active conversation list ([de75239](https://github.com/Wilfreno/croom/commit/de752392689296cb2d19444f3a30ab60d153b9fc))
* **message:** store message sender as ObjectId ([3d77dfc](https://github.com/Wilfreno/croom/commit/3d77dfcdae145ba061d2295d02ee9ce33197d0ef))
* **models:** inject schemas correctly and cast ids to ObjectId ([b10c371](https://github.com/Wilfreno/croom/commit/b10c371da20eae06ec0c732aeebe2166c0c736e8))
* **server:** match CORS against the client's origin, not its full URL ([3440e6c](https://github.com/Wilfreno/croom/commit/3440e6c08d65d4c82bc62e00b8113154ff605f8e))
* **utils:** count characters between Z and a as symbols ([1abbe36](https://github.com/Wilfreno/croom/commit/1abbe36d897e6cfc6134488fba8f3c81fa344ec5))

## [1.0.16](https://github.com/Wilfreno/chatup/compare/v1.0.15...v1.0.16) (2025-03-26)


### Bug Fixes

* username does not have @ when logging in ([ce04c45](https://github.com/Wilfreno/chatup/commit/ce04c45c97dd907bfe57d40dda575c3de4c0f2ae))

## [1.0.15](https://github.com/Wilfreno/chatup/compare/v1.0.14...v1.0.15) (2025-03-15)


### Bug Fixes

* auth route uses old client origin ([282b58f](https://github.com/Wilfreno/chatup/commit/282b58ffeb001d47c6ba067fbb2a7b5e8b5ecb0d))

## [1.0.14](https://github.com/Wilfreno/chatup/compare/v1.0.13...v1.0.14) (2025-03-15)


### Bug Fixes

* double quotes on env gets remove ([f29fe5c](https://github.com/Wilfreno/chatup/commit/f29fe5cbc2571b0c07f586079fbc2f21746c6aee))

## [1.0.13](https://github.com/Wilfreno/chatup/compare/v1.0.12...v1.0.13) (2025-03-15)


### Bug Fixes

* deploying to ec2 instance creates ERR_PNPM_ENV_UNKNOWN_SUBCOMMAND This subcommand is not known ([7f2699a](https://github.com/Wilfreno/chatup/commit/7f2699a8699038af8950dd117494274da5262dca))

## [1.0.12](https://github.com/Wilfreno/chatup/compare/v1.0.11...v1.0.12) (2025-03-15)


### Bug Fixes

* goes to non existent /app instead of /server ([53c5ca7](https://github.com/Wilfreno/chatup/commit/53c5ca72ae3456630903571769b4fb9522c9ee47))

## [1.0.11](https://github.com/Wilfreno/chatup/compare/v1.0.10...v1.0.11) (2025-03-15)


### Bug Fixes

* deployment of files to ec2 instance ([666a571](https://github.com/Wilfreno/chatup/commit/666a571636d66bc23417778f8797feb1679463f5))

## [1.0.10](https://github.com/Wilfreno/chatup/compare/v1.0.9...v1.0.10) (2025-03-15)


### Bug Fixes

* deploy files to ec2 instance ([088bbad](https://github.com/Wilfreno/chatup/commit/088bbad2d825dda5af1cbb3e963af02780102362))

## [1.0.9](https://github.com/Wilfreno/chatup/compare/v1.0.8...v1.0.9) (2025-03-14)


### Bug Fixes

* disable base 64 encoding of .env while deploying to ec2 instance ([1ee9e1f](https://github.com/Wilfreno/chatup/commit/1ee9e1f2e922b09f9d0339e0bd159400b83df543))

## [1.0.8](https://github.com/Wilfreno/chatup/compare/v1.0.7...v1.0.8) (2025-03-14)


### Bug Fixes

* storing .env to ec2 instance with echo ([109d904](https://github.com/Wilfreno/chatup/commit/109d904c333feaa9fd5ae0d08f540b136919011d))

## [1.0.7](https://github.com/Wilfreno/chatup/compare/v1.0.6...v1.0.7) (2025-03-14)


### Bug Fixes

* improper storing of secrets to .env file on ec2 instancee ([ebbe396](https://github.com/Wilfreno/chatup/commit/ebbe396923a142c64a8d5b6662c758a4573d5aa6))

## [1.0.6](https://github.com/Wilfreno/chatup/compare/v1.0.5...v1.0.6) (2025-03-14)


### Bug Fixes

* delete redis subscription to NOTIFICATION channel ([d644f14](https://github.com/Wilfreno/chatup/commit/d644f14fb3250a9f7df18e3d8f5d7d822a32eec9))

## [1.0.5](https://github.com/Wilfreno/chatup/compare/v1.0.4...v1.0.5) (2025-03-14)


### Bug Fixes

* deploy to ec2 instance action pushes the server directory on ~/app/server instead of ~/app ([6824f3b](https://github.com/Wilfreno/chatup/commit/6824f3bd1f6935b972bd269f0e0a84f1b1cafe06))

## [1.0.4](https://github.com/Wilfreno/chatup/compare/v1.0.3...v1.0.4) (2025-03-14)


### Bug Fixes

* cors policy not accepting right domain name ([9f64161](https://github.com/Wilfreno/chatup/commit/9f6416162b3d900174a3fb07bfaa606afc51c317))

## [1.0.3](https://github.com/Wilfreno/chatup/compare/v1.0.2...v1.0.3) (2025-03-11)


### Bug Fixes

* does not go to server directory when connection to ec2 instance ([fd7e619](https://github.com/Wilfreno/chatup/commit/fd7e619083a5a4b30873734e041021f3ca49d662))
* run command for pushing files on ec2 instance action ([23133b9](https://github.com/Wilfreno/chatup/commit/23133b9baee9ec6d576bc243b7e3fca59679e599))
* typo on run command for pushing files on ec2 instance action ([fc0cdc8](https://github.com/Wilfreno/chatup/commit/fc0cdc8e8a400a195f3ec904c68b4b4f3c07bd02))
* use production instead of start ([3afca20](https://github.com/Wilfreno/chatup/commit/3afca208b15136dd79ca106485da2f734c46e01e))

## [1.0.2](https://github.com/Wilfreno/chatup/compare/v1.0.1...v1.0.2) (2025-03-11)


### Bug Fixes

* action for server deployment uses env instead of action secret directly ([9917d54](https://github.com/Wilfreno/chatup/commit/9917d542ec527699bbe3c63db1266c3c6d24d638))

## [1.0.1](https://github.com/Wilfreno/chatup/compare/v1.0.0...v1.0.1) (2025-03-11)


### Bug Fixes

*  SignupNavigateToLoginPage component is not wrapped with a Suspense component ([5ec2766](https://github.com/Wilfreno/chatup/commit/5ec276664d8588b766133e4ddbfca5e04f0318d0))

# 1.0.0 (2025-02-25)


### Bug Fixes

* active chat  incorrect link ([ab807c7](https://github.com/Wilfreno/chatup/commit/ab807c73c06e0a0302eb6777ebca1de060497c3f))
* active chat  incorrect link ([993de91](https://github.com/Wilfreno/chatup/commit/993de91ea1de70beb2d537c829c817e6d83a15dc))
* active conversation not displaying right ([acb287e](https://github.com/Wilfreno/chatup/commit/acb287ee1b6f9e21d32b2d3472419c89230b95eb))
* active conversation not displaying right ([cff1e6c](https://github.com/Wilfreno/chatup/commit/cff1e6cba12cd6ea704e4dd2662734a8e81f860a))
* active friend section into active conversation and fix user status not updating ([7e27c4b](https://github.com/Wilfreno/chatup/commit/7e27c4b2d18b62dc934ad15c24061feed69562ae))
* active friend section into active conversation and fix user status not updating ([0691c09](https://github.com/Wilfreno/chatup/commit/0691c09b730bdfdd01a825d5784b428942aa7c04))
* add nickname dialog wrong width ([5851b2d](https://github.com/Wilfreno/chatup/commit/5851b2d0548414483c95cefed3bc8f3c436cb002))
* change [conversation ,members] query to not include the requesting user to the query string ([a9ab024](https://github.com/Wilfreno/chatup/commit/a9ab024cb2568db46ec2c43fc312c741906fb360))
* change username bug where it defaults to "username" ([aa8b090](https://github.com/Wilfreno/chatup/commit/aa8b09013ce2c51e06f91e2e52024e2817828c1f))
* checking if the the user is a members before populating conversation object ([2cd91e0](https://github.com/Wilfreno/chatup/commit/2cd91e0440b2ef4aab97bea8f5d7ecf5d2bfc2ab))
* compose page UI ([4083a31](https://github.com/Wilfreno/chatup/commit/4083a31e494b88e856915e951539e53e5ec8f110))
* compose page UI ([733f0f0](https://github.com/Wilfreno/chatup/commit/733f0f051064f4dd864c25a5fbd6c4eb104080a5))
* compose section message not displaying right ([5cc2eb1](https://github.com/Wilfreno/chatup/commit/5cc2eb11d3cad3ab3fa5d2d009319be0c0ee5dfe))
* conversation list does not display of the conversation is online ([7a6b2bf](https://github.com/Wilfreno/chatup/commit/7a6b2bf17d974adfc392e8e6aac3a78303d259b7))
* conversation list does not display of the conversation is online ([77a4022](https://github.com/Wilfreno/chatup/commit/77a4022bb1d00fab11420b3dd40fd49f7d0cb1a4))
* conversation list not displaying name ([972b3f7](https://github.com/Wilfreno/chatup/commit/972b3f725af9293300f6cae028d0924cba674e4b))
* conversation list not displaying name ([850ed8a](https://github.com/Wilfreno/chatup/commit/850ed8a86a6eb037abc75c43aab4380be4ec5d8d))
* conversation message section not displaying right ([9670b06](https://github.com/Wilfreno/chatup/commit/9670b06a608246409ab32d4de21d01539a896a9a))
* conversation name customization not updating conversation name on conversation list ([af8a0d8](https://github.com/Wilfreno/chatup/commit/af8a0d8f135314215d0d5a49158aa226a042abd5))
* conversations list opt to use Link component instead of useRouter for navigation ([170d8c5](https://github.com/Wilfreno/chatup/commit/170d8c5f1991738d84794b6e6161d2d8aa41680f))
* conversations list opt to use Link component instead of useRouter for navigation ([33fc220](https://github.com/Wilfreno/chatup/commit/33fc22036b91d55d031aa80aecfc7a4d3fb7f12a))
* customize conversation photo dialog wrong width ([7fce479](https://github.com/Wilfreno/chatup/commit/7fce479bcf1553dd5f708042fb72ea45935a1ca4))
* data not set well on Add nicknames ([2f9fa86](https://github.com/Wilfreno/chatup/commit/2f9fa865439537007f375529959cf44605d75444))
* delete input text from change password when cancelled ([055c7e6](https://github.com/Wilfreno/chatup/commit/055c7e6036127cfc57928f0dce02dac267310e94))
* dialogs with wrong width ([b315aa1](https://github.com/Wilfreno/chatup/commit/b315aa1cb3ca1af851180730eab2cb937eac16bd))
* display no info on the conversation info bar when the account no longer exist ([e54c5b5](https://github.com/Wilfreno/chatup/commit/e54c5b521445b8ea18c1c9bf3d9c1436fc3d37c3))
* display sender avatar properly ([9026641](https://github.com/Wilfreno/chatup/commit/9026641f29a3806151f1ce4a0037620e75fbfa46))
* emoji only text displaying at the center ([af5c52a](https://github.com/Wilfreno/chatup/commit/af5c52a379cc40ddadc8e768debc3e71637d2705))
* enable  profile scope for google strategy ([f9c8c3e](https://github.com/Wilfreno/chatup/commit/f9c8c3e626e4b75d01f436d05ddbc6bd4acd5a8c))
* enable active conversation name change when group chat name gets updated ([eca4174](https://github.com/Wilfreno/chatup/commit/eca4174c7cc4346aa0e94affb8614a19e80d0559))
* enable to change all displayed photo ([7bdbc9f](https://github.com/Wilfreno/chatup/commit/7bdbc9feee4dbf2362bc87caa12f9d62f9ae0fd1))
* github workflows not running because github folder did not start with . ([b2944c4](https://github.com/Wilfreno/chatup/commit/b2944c4c89711d8ee104eb9bfd8668670ae72f17))
* group chat photo upload logic not implemented ([84cf7d0](https://github.com/Wilfreno/chatup/commit/84cf7d00973cc0489860985ce282bd4b9df383c4))
* group chat photo upload logic not implemented ([72b88b1](https://github.com/Wilfreno/chatup/commit/72b88b1ca666f0784766a52798c81d29cb22189d))
* hide back button when not on mobile device ([6fcf727](https://github.com/Wilfreno/chatup/commit/6fcf7272f5dee0fa8e9704f780822625276cb76a))
* home conversation message displaying id instead of name ([f4cb133](https://github.com/Wilfreno/chatup/commit/f4cb133a00b6fae788abd00e552128825933950f))
* home conversation not displaying the sender name right ([eac319d](https://github.com/Wilfreno/chatup/commit/eac319d91073039294543902a8edccd504ad72d0))
* home page does not have the right height when the sidebar is closed ([f7a96e0](https://github.com/Wilfreno/chatup/commit/f7a96e01cb3ff1f7a8ce4a64afad63cf71829fb7))
* if user is blocked, response should have the converastion info if it exist ([31e1dfa](https://github.com/Wilfreno/chatup/commit/31e1dfa2bd0e1a3b7cdd79c0fff7870d8509cfe7))
* ignore .env files ([db4641a](https://github.com/Wilfreno/chatup/commit/db4641aaf242482fe538f7620c0fd6ff62639dad))
* implement authentication on the dedicated server with passport.js ([d053ae3](https://github.com/Wilfreno/chatup/commit/d053ae36c7036ed6154e810fda0c4976301969c1))
* incorrect query for gettings the user to compose to ([b1de54c](https://github.com/Wilfreno/chatup/commit/b1de54ce5251a6aab24be7fb617339e4d021c477))
* info sidebar open toggle logic ([0652c54](https://github.com/Wilfreno/chatup/commit/0652c546ffbc0ba57376e0b74411cedda729decd))
* info sidebar to be closed by default while on mobile ([c7a7918](https://github.com/Wilfreno/chatup/commit/c7a79184b96a3ea3c9785fcbcd8236f970d0097d))
* info sidebar to open key misalignment ([f22449d](https://github.com/Wilfreno/chatup/commit/f22449df71d15d611ca9b99b43958c3b50fcc808))
* merge branches ([70b3d09](https://github.com/Wilfreno/chatup/commit/70b3d0938c4e15337ab61b77e1e7b8ff7614ca00))
* message input to be a block instead of absoluiteposition ([dc79faa](https://github.com/Wilfreno/chatup/commit/dc79faade68139952905858c6220b011c08d537a))
* message input to be a block instead of absoluiteposition ([d91224c](https://github.com/Wilfreno/chatup/commit/d91224ca62b6473100a1911d73f84e9716dbdd1c))
* message input will wot display if there no selected user on the compose page ([f2d9187](https://github.com/Wilfreno/chatup/commit/f2d9187d2960a8a3e7f8974b5ef07613e3710de6))
* message sen by has duplicated id ([d888730](https://github.com/Wilfreno/chatup/commit/d8887302c0274dde2880c1d9465bd6ff81976a79))
* messages does not scroll  all the way down ([19421e6](https://github.com/Wilfreno/chatup/commit/19421e6ad27968a073f949fb9a197b6f428594cc))
* messages does not scroll  all the way down ([26dc210](https://github.com/Wilfreno/chatup/commit/26dc210e80bee42595f0d9bd7ea22eee1cfb0273))
* nickname UI and remove input value when closing the dialog ([f6f6439](https://github.com/Wilfreno/chatup/commit/f6f64394486616f58e27534fdf2a3b2a2581eec0))
* nickname UI and remove input value when closing the dialog ([402599b](https://github.com/Wilfreno/chatup/commit/402599bf00beeeaabb0e79043820c73eae9631a0))
* remove .env ([42d23b2](https://github.com/Wilfreno/chatup/commit/42d23b2e95876c2c2e043f4f9ea0a1358837e6af))
* sign up form not redirecting and throwing errors properly ([ecec45a](https://github.com/Wilfreno/chatup/commit/ecec45a15c0fa22f7196d87992ab99d6ca790503))
* sign up form not redirecting and throwing errors properly ([8a7a278](https://github.com/Wilfreno/chatup/commit/8a7a278d586ac2c0672046a0981b56775dd4b4ef))
* text input not shrinking when sending long messages ([799dc8e](https://github.com/Wilfreno/chatup/commit/799dc8e6465a744ca7132dd0a226c268646086fc))
* toast message when the user is not currently on the right conversation page ([5204537](https://github.com/Wilfreno/chatup/commit/5204537e1581a11fe61dd914d231d26bcdef5608))
* type error on change conversation name ([7a73fdb](https://github.com/Wilfreno/chatup/commit/7a73fdbff49bb6b6f9b62a81a274d77ec2363fd2))
* type error on conversation manage admin and members ([04f8b8e](https://github.com/Wilfreno/chatup/commit/04f8b8e20293d9ccb48e004bb99106fd0f0ab068))


### Features

* compose conversation implemented ([6c54683](https://github.com/Wilfreno/chatup/commit/6c5468376c5e236cd200dd0e2e62e3817afb4ddb))
* compose conversation implemented ([6aa3fc0](https://github.com/Wilfreno/chatup/commit/6aa3fc0f17e823f917595f17a884baa78ce602be))
