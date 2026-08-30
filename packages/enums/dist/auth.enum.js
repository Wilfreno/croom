export var AuthServiceOptions;
(function (AuthServiceOptions) {
    AuthServiceOptions["WITH_EMAIL_AND_PASSWORD"] = "with_email_and_password";
    AuthServiceOptions["WITH_GOOGLE"] = "with_google";
})(AuthServiceOptions || (AuthServiceOptions = {}));
export var EmailStatus;
(function (EmailStatus) {
    EmailStatus["ALREADY_USED"] = "already_used";
    EmailStatus["AVAILABLE"] = "available";
    EmailStatus["INVALID"] = "invalid";
})(EmailStatus || (EmailStatus = {}));
export var OTPType;
(function (OTPType) {
    OTPType["SIGNUP"] = "SIGNUP";
    OTPType["RECOVER"] = "RECOVER";
})(OTPType || (OTPType = {}));
