import type { OtpCandidate } from './types';

/** Detect verification-style emails — brands allowed here only */
const VERIFICATION_EMAIL_HINT =
  /\b(verification|verify|verified|code|otp|one[- ]?time|passcode|login|log\s*in|sign[- ]?in|signin|security|2fa|two[- ]?factor|authenticate|authentication|confirm|password|token|magic|device|pin|auth)\b/i;

/** Scoring context near a code — no brand names (avoids boosting "GITHUB") */
const CODE_CONTEXT_HINT =
  /\b(verification|verify|code|otp|passcode|pin|token|password|enter|copy|use|following|below|expires)\b/i;

const LETTER_ONLY_BLOCKLIST = new Set([
  'GITHUB',
  'GITLAB',
  'GOOGLE',
  'GMAIL',
  'EMAIL',
  'LOGIN',
  'LOGINS',
  'SIGNIN',
  'VERIFY',
  'CODE',
  'OTP',
  'TOKEN',
  'CLICK',
  'HERE',
  'HTTPS',
  'HTTP',
  'MICROSOFT',
  'AMAZON',
  'DISCORD',
  'SLACK',
  'TWITTER',
  'APPLE',
  'FACEBOOK',
  'STRIPE',
  'PAYPAL',
  'MANUAL',
  'INBOX',
  'MAIL',
  'PASSWORD',
  'SECURE',
  'ACCESS',
  'CONFIRM',
  'SUBMIT',
  'BUTTON',
  'ACCOUNT',
  'SETTINGS',
  'SECURITY',
  'DEVICE',
  'BROWSER',
  'WINDOW',
  'MOBILE',
  'DESKTOP',
  'CHROME',
  'BRAVE',
  'SAFARI',
  'FIREFOX',
  'NOTICE',
  'HELLO',
  'THANKS',
  'PLEASE',
  'REPLY',
  'UNSUB',
  'HOURS',
  'MINUTES',
  'SECONDS',
  'TODAY',
  'GITHUBCOM',
]);

const PLACEHOLDER_CODES = new Set([
  '000000',
  '111111',
  '123456',
  '654321',
  '0000',
  '1111',
  '1234',
  '12345',
  '12345678',
]);

const YEAR_PATTERN = /^(19|20)\d{2}$/;
const PHONE_PATTERN = /^\+?\d{10,15}$/;

const MIN_CODE_LENGTH = 3;
const MAX_CODE_LENGTH = 16;

interface ScoredMatch {
  code: string;
  confidence: number;
  format: OtpCandidate['format'];
  source: OtpCandidate['source'];
}

/** Strip spaces/punctuation; split digits from glued English (28421706THIS → 28421706) */
function normalizeCode(raw: string): string {
  const compact = raw.trim().replace(/[\s\-_.]/g, '').toUpperCase();
  const gluedWord = compact.match(/^(\d{4,12})([A-Z]{2,})$/);
  if (gluedWord) return gluedWord[1];
  const digitsOnly = compact.match(/^(\d{4,12})$/);
  if (digitsOnly) return digitsOnly[1];
  return compact;
}

/** Final code used for fill/copy — never append stray words like THIS */
export function sanitizeOtpCode(code: string): string {
  const n = normalizeCode(code);
  if (/^\d{3,12}$/.test(n)) return n;
  if (/^[A-Z0-9]+$/.test(n) && /\d/.test(n) && /[A-Z]/.test(n)) {
    if (!/^\d+[A-Z]{3,}$/.test(n)) return n;
  }
  const leading = n.match(/^(\d{4,12})/);
  if (leading) return leading[1];
  return n;
}

function isPlaceholder(code: string): boolean {
  const n = normalizeCode(code);
  if (PLACEHOLDER_CODES.has(n)) return true;
  if (/^(\d)\1{2,11}$/.test(n)) return true;
  return false;
}

/** Reject brand names and plain English words mistaken as codes */
function isWordNotCode(code: string): boolean {
  if (LETTER_ONLY_BLOCKLIST.has(code)) return true;
  if (!/\d/.test(code) && /^[A-Z]+$/.test(code)) {
    return code.length >= 4;
  }
  return false;
}

function rejectFalsePositive(code: string, context: string): boolean {
  const n = normalizeCode(code);
  if (n.length < MIN_CODE_LENGTH || n.length > MAX_CODE_LENGTH) return true;
  if (isWordNotCode(n)) return true;
  if (YEAR_PATTERN.test(n)) return true;
  if (PHONE_PATTERN.test(n)) return true;
  if (/^\$?\d{1,3}(,\d{3})*(\.\d{2})?$/.test(n)) return true;
  if (/\b(order|tracking|invoice|receipt)\b/i.test(context) && n.length >= 10 && /^\d+$/.test(n)) {
    return true;
  }
  return false;
}

function scoreMatch(
  raw: string,
  source: OtpCandidate['source'],
  text: string,
  nearKeyword: boolean,
  explicitLabel: boolean,
): ScoredMatch | null {
  const code = sanitizeOtpCode(normalizeCode(raw));
  if (code.length < MIN_CODE_LENGTH || code.length > MAX_CODE_LENGTH) return null;
  if (!/^[A-Z0-9]+$/.test(code)) return null;
  if (isPlaceholder(code)) return null;
  if (rejectFalsePositive(code, text)) return null;

  if (!/\d/.test(code)) return null;

  const hasLetter = /[A-Z]/.test(code);
  let confidence = 0.4;
  const format: OtpCandidate['format'] =
    hasLetter ? 'alphanumeric' : /-|\s|_/.test(raw) ? 'grouped' : 'numeric';

  if (explicitLabel) confidence += 0.35;
  if (nearKeyword) confidence += 0.15;
  if (source === 'subject') confidence += 0.1;
  if (CODE_CONTEXT_HINT.test(text)) confidence += 0.08;
  if (/^\d{6,8}$/.test(code)) confidence += 0.15;
  if (/^\d{4,8}$/.test(code)) confidence += 0.1;
  if (format === 'alphanumeric' && hasLetter) confidence += 0.08;

  if (confidence > 1) confidence = 1;
  return { code, confidence, format, source };
}

const LABELED_PATTERNS: RegExp[] = [
  /\b(?:sudo\s+)?authentication\s+code\s*:\s*(\d{4,12})\b/gi,
  /\b(?:verification\s+code|one[- ]?time(?:\s+code)?|security\s+code|login\s+code)\s*:\s*(\d{4,12})\b/gi,
  /\b(?:passcode|otp|pin|code|token)\s*[:#=]\s*(\d{4,12})\b/gi,
  /\b(?:passcode|otp|pin|code|token)\s*[:#=]\s*([A-Z0-9]*\d[A-Z0-9]{2,8})\b/gi,
  /\b(?:is|use|enter|copy)\s+(?:the\s+)?(?:code\s+)?(\d{4,12})\b/gi,
  /\b(\d{6,8})\s*(?:is your|is the)\s*(?:verification|security|login|authentication)?\s*code\b/gi,
];

const NUMERIC_PATTERNS: RegExp[] = [
  /\b(\d{4,12})\b/g,
  /\b(\d{2,4}[-\s_.]\d{2,4}[-\s_.]?\d{0,4})\b/g,
];

/** Alphanumeric OTP only — must mix letters+digits without "28421706THIS" glue */
const ALPHANUM_PATTERNS: RegExp[] = [
  /\b([A-Z]{1,3}\d{2,5}[A-Z0-9]{0,4})\b/g,
  /\b(\d{2,4}[A-Z]{1,3}\d{0,4})\b/g,
];

function extractFromText(text: string, source: OtpCandidate['source']): ScoredMatch[] {
  const matches: ScoredMatch[] = [];
  const plain = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const nearKeyword = CODE_CONTEXT_HINT.test(plain);

  for (const pattern of LABELED_PATTERNS) {
    pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(plain)) !== null) {
      const raw = m[1];
      const scored = scoreMatch(raw, source, plain, nearKeyword, true);
      if (scored) matches.push(scored);
    }
  }

  for (const pattern of NUMERIC_PATTERNS) {
    pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(plain)) !== null) {
      const scored = scoreMatch(m[1], source, plain, nearKeyword, false);
      if (scored) matches.push(scored);
    }
  }

  for (const pattern of ALPHANUM_PATTERNS) {
    pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(plain)) !== null) {
      const scored = scoreMatch(m[1], source, plain, nearKeyword, false);
      if (scored) matches.push(scored);
    }
  }

  return matches;
}

export function extractOtpCandidates(
  subject: string,
  body: string,
  snippet: string,
): OtpCandidate[] {
  const all: ScoredMatch[] = [
    ...extractFromText(subject, 'subject'),
    ...extractFromText(body, 'body'),
    ...extractFromText(snippet, 'snippet'),
  ];

  const byCode = new Map<string, OtpCandidate>();
  for (const m of all) {
    const existing = byCode.get(m.code);
    if (!existing || m.confidence > existing.confidence) {
      byCode.set(m.code, {
        code: m.code,
        confidence: m.confidence,
        format: m.format,
        source: m.source,
      });
    }
  }

  return [...byCode.values()].sort((a, b) => {
    const aDigits = (a.code.match(/\d/g) ?? []).length;
    const bDigits = (b.code.match(/\d/g) ?? []).length;
    if (bDigits !== aDigits) return bDigits - aDigits;
    return b.confidence - a.confidence;
  });
}

const MIN_VIABLE_CONFIDENCE = 0.45;

export function pickBestCandidate(candidates: OtpCandidate[]): OtpCandidate | null {
  const withDigit = candidates.filter((c) => /\d/.test(c.code));
  const viable = withDigit.filter((c) => c.confidence >= MIN_VIABLE_CONFIDENCE);
  return viable[0] ?? withDigit[0] ?? null;
}

export function isVerificationEmail(subject: string, body: string, snippet: string): boolean {
  const combined = `${subject} ${snippet} ${body}`.slice(0, 8000);
  if (VERIFICATION_EMAIL_HINT.test(combined)) return true;
  if (/\[\s*GitHub\s*\]/i.test(subject)) return true;
  if (/\[\s*[\w.]+\s*\]/i.test(subject)) return true;
  if (/noreply@github\.com|noreply|no-reply|mailer|notify|security@|account@/i.test(combined)) {
    return true;
  }
  return false;
}

export function emailLikelyHasOtp(
  subject: string,
  body: string,
  snippet: string,
  candidates: OtpCandidate[],
): boolean {
  if (!isVerificationEmail(subject, body, snippet)) return false;
  return pickBestCandidate(candidates) !== null;
}
