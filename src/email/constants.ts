/** Gmail search — broad inbox scan; filtering happens in code */
export const GMAIL_RECENT_QUERY = 'newer_than:2d in:inbox';

/** Narrower fallback if inbox scan returns nothing */
export const GMAIL_OTP_QUERY =
  'newer_than:2d (verification OR verify OR code OR otp OR passcode OR login OR github OR gitlab OR microsoft OR amazon OR discord OR slack OR security OR 2fa OR password OR sign-in OR authenticate)';

export const GMAIL_MAX_MESSAGES = 20;

export const MICROSOFT_SCOPES = ['Mail.Read', 'offline_access', 'User.Read'];

export const YAHOO_SCOPES = ['mail-r'];
