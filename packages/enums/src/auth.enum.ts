export enum AuthServiceOptions {
  WITH_EMAIL_AND_PASSWORD = 'with_email_and_password',
  WITH_GOOGLE = 'with_google',
}

export enum EmailStatus {
  ALREADY_USED = 'already_used',
  AVAILABLE = 'available',
  INVALID = 'invalid',
}

export enum OTPType {
  SIGNUP = 'SIGNUP',
  RECOVER = 'RECOVER',
}
