"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OTPType = exports.EmailStatus = exports.AuthServiceOptions = void 0;
var AuthServiceOptions;
(function (AuthServiceOptions) {
    AuthServiceOptions["WITH_EMAIL_AND_PASSWORD"] = "with_email_and_password";
    AuthServiceOptions["WITH_GOOGLE"] = "with_google";
})(AuthServiceOptions || (exports.AuthServiceOptions = AuthServiceOptions = {}));
var EmailStatus;
(function (EmailStatus) {
    EmailStatus["ALREADY_USED"] = "already_used";
    EmailStatus["AVAILABLE"] = "available";
    EmailStatus["INVALID"] = "invalid";
})(EmailStatus || (exports.EmailStatus = EmailStatus = {}));
var OTPType;
(function (OTPType) {
    OTPType["SIGNUP"] = "SIGNUP";
    OTPType["RECOVER"] = "RECOVER";
})(OTPType || (exports.OTPType = OTPType = {}));
