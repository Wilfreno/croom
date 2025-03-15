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
