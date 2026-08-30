"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckUserDataType = exports.UserStatus = void 0;
var UserStatus;
(function (UserStatus) {
    UserStatus["OFFLINE"] = "offline";
    UserStatus["ONLINE"] = "online";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var CheckUserDataType;
(function (CheckUserDataType) {
    CheckUserDataType["EMAIL"] = "email";
    CheckUserDataType["USER_NAME"] = "username";
})(CheckUserDataType || (exports.CheckUserDataType = CheckUserDataType = {}));
