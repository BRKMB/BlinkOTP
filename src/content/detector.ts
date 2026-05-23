export interface OtpFieldGroup {
  elements: HTMLInputElement[];
  mode: 'single' | 'split';
  confidence: number;
}

const OTP_HINT_PATTERN =
  /(?:otp|one[- ]?time|verification\s*code|verify\s*code|2fa|mfa|passcode|security\s*code|login\s*code|auth(?:entication)?\s*code|confirm(?:ation)?\s*code|challenge\s*code)/i;

const ENTER_CODE_PROMPT_PATTERN =
  /\b(?:enter(?:\s+the)?\s+(?:(?:verification|security|login|one[- ]?time)\s+)?(?:code|passcode|otp)|verification\s+code\s+sent|code\s+sent\s+to)\b/i;

const EMAIL_PATTERN = /\b(?:e-?mail|inbox|@[\w.-]+\.\w{2,})\b/i;

const PHONE_SMS_PATTERN =
  /\b(?:\bsms\b|text\s+message|your\s+phone|mobile\s+number|phone\s+number|via\s+text|sent\s+(?:you\s+)?a\s+text)\b/i;

/** Profile / account forms — never treat as OTP. */
const NON_OTP_FIELD_PATTERN =
  /\b(?:^name$|user[-_]?name|display[-_]?name|full[-_]?name|first[-_]?name|last[-_]?name|profile[-_]?name|public[-_]?name|bio|biography|company|location|search|query|title|subject|address|city|country|website|url|twitter|handle|nickname|pronouns|organization|description|memo|note|comment|message|repository|repo[-_]?name)\b/i;

const NON_OTP_URL_PATTERN =
  /\/settings\/(?:profile|account|appearance|billing|notifications|repositories|keys|applications|developer|pages|moderation)(?:\/|$|\?)/i;

const SPLIT_MAX_BOXES = 8;
const SPLIT_MIN_BOXES = 4;

const IGNORED_INPUT_TYPES = new Set([
  'password',
  'email',
  'hidden',
  'checkbox',
  'radio',
  'submit',
  'button',
  'file',
  'image',
  'search',
  'url',
  'date',
  'datetime-local',
]);

function sampleVerificationText(root: ParentNode = document): string {
  const chunks: string[] = [document.title];
  for (const sel of [
    'h1',
    'h2',
    'main',
    '[role="main"]',
    '#responsive_page_content',
    '.application-main',
    'form',
    '[role="dialog"]',
  ]) {
    const el = root.querySelector(sel);
    if (el?.textContent) chunks.push(el.textContent);
  }
  return chunks.join(' ').replace(/\s+/g, ' ').slice(0, 6000);
}

function inputContext(el: HTMLInputElement): string {
  const parts = [
    el.getAttribute('name') ?? '',
    el.getAttribute('id') ?? '',
    el.getAttribute('placeholder') ?? '',
    el.getAttribute('aria-label') ?? '',
    el.getAttribute('autocomplete') ?? '',
    el.className?.toString() ?? '',
    nearbyLabelText(el),
  ];
  return parts.join(' ').toLowerCase();
}

function nearbyLabelText(el: HTMLInputElement): string {
  const id = el.id;
  if (id) {
    const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label?.textContent) return label.textContent;
  }
  const parent = el.closest('form, [role="group"], fieldset, .form-group, div');
  return parent?.textContent?.slice(0, 400) ?? '';
}

export function isNonOtpSettingsUrl(href = location.href): boolean {
  try {
    const { pathname } = new URL(href);
    if (NON_OTP_URL_PATTERN.test(pathname)) return true;
    if (/\/settings\/profile/i.test(pathname)) return true;
  } catch {
    /* ignore */
  }
  return false;
}

export function isNonOtpField(el: HTMLInputElement): boolean {
  const ctx = inputContext(el);
  if (NON_OTP_FIELD_PATTERN.test(ctx)) return true;
  if (/\b(?:^|\s)name(?:\s|$)/.test(ctx) && !OTP_HINT_PATTERN.test(ctx)) return true;
  if (/\b(?:bio|profile|display|username|user\s*name)\b/.test(ctx) && !OTP_HINT_PATTERN.test(ctx)) {
    return true;
  }
  return false;
}

export function hasEnterCodePrompt(root: ParentNode = document): boolean {
  return ENTER_CODE_PROMPT_PATTERN.test(sampleVerificationText(root));
}

export function fieldHasStrongOtpSignal(el: HTMLInputElement): boolean {
  if (isNonOtpField(el)) return false;
  const ac = (el.getAttribute('autocomplete') ?? '').toLowerCase();
  if (ac === 'one-time-code') return true;
  const ctx = inputContext(el);
  if (OTP_HINT_PATTERN.test(ctx)) return true;
  if (/^otp$|otp_|_otp|app_otp|verification_code|passcode|2fa|mfa/.test(ctx)) return true;
  if (el.inputMode === 'numeric' && el.maxLength > 0 && el.maxLength <= 10) return true;
  return false;
}

function scoreInput(el: HTMLInputElement): number {
  if (isNonOtpField(el)) return 0;

  let score = 0;
  const type = (el.getAttribute('type') ?? 'text').toLowerCase();
  const ctx = inputContext(el);

  if ((el.getAttribute('autocomplete') ?? '').toLowerCase() === 'one-time-code') score += 0.6;
  if (type === 'tel' || type === 'number') score += 0.1;
  if (OTP_HINT_PATTERN.test(ctx)) score += 0.45;
  if (/otp|passcode|verification|token|2fa|mfa|sudo|challenge/.test(ctx)) score += 0.25;
  if (el.maxLength > 0 && el.maxLength <= 12) score += 0.12;
  if (el.inputMode === 'numeric') score += 0.08;

  return score;
}

function isVisible(el: HTMLElement): boolean {
  const style = getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 8 && rect.height > 8;
}

function isCodeCandidateInput(el: HTMLInputElement): boolean {
  const type = (el.getAttribute('type') ?? 'text').toLowerCase();
  if (IGNORED_INPUT_TYPES.has(type)) return false;
  if (!isVisible(el) || el.disabled || isNonOtpField(el)) return false;
  return true;
}

export function isPhoneOrSmsOnlyPage(root: ParentNode = document): boolean {
  const text = sampleVerificationText(root);
  if (!PHONE_SMS_PATTERN.test(text)) return false;
  return !EMAIL_PATTERN.test(text);
}

function findSplitGroups(root: ParentNode): OtpFieldGroup[] {
  const inputs = [...root.querySelectorAll<HTMLInputElement>('input')].filter(
    (el) => isVisible(el) && !el.disabled && !el.readOnly && !isNonOtpField(el),
  );

  const groups: OtpFieldGroup[] = [];
  const used = new Set<HTMLInputElement>();

  for (let i = 0; i < inputs.length; i++) {
    const start = inputs[i];
    if (used.has(start)) continue;
    if ((start.maxLength === 1 || start.size === 1) && scoreInput(start) >= 0.25) {
      const chain: HTMLInputElement[] = [start];
      let j = i + 1;
      while (j < inputs.length && chain.length < SPLIT_MAX_BOXES) {
        const next = inputs[j];
        const prev = chain[chain.length - 1];
        const close =
          Math.abs(next.getBoundingClientRect().left - prev.getBoundingClientRect().right) < 80;
        if (close && (next.maxLength === 1 || next.maxLength <= 2) && scoreInput(next) >= 0.2) {
          chain.push(next);
          j++;
        } else break;
      }
      if (chain.length >= SPLIT_MIN_BOXES && chain.length <= SPLIT_MAX_BOXES) {
        chain.forEach((el) => used.add(el));
        const avg = chain.reduce((s, el) => s + scoreInput(el), 0) / chain.length;
        groups.push({ elements: chain, mode: 'split', confidence: avg + 0.3 });
      }
    }
  }

  return groups;
}

export function detectOtpFields(root: ParentNode = document): OtpFieldGroup[] {
  const singles: OtpFieldGroup[] = [];
  const inputs = [...root.querySelectorAll<HTMLInputElement>('input')].filter(
    (el) => isCodeCandidateInput(el) && !el.readOnly,
  );

  for (const el of inputs) {
    const score = scoreInput(el);
    if (score >= 0.45) {
      singles.push({ elements: [el], mode: 'single', confidence: score });
    }
  }

  const splits = findSplitGroups(root);
  const all = [...singles, ...splits].sort((a, b) => b.confidence - a.confidence);

  const deduped: OtpFieldGroup[] = [];
  const seen = new Set<HTMLInputElement>();
  for (const g of all) {
    if (g.elements.some((el) => seen.has(el))) continue;
    g.elements.forEach((el) => seen.add(el));
    deduped.push(g);
  }

  return deduped;
}

/**
 * OTP step only: verification copy + OTP-like field (not profile name, search, etc.).
 */
export function isOtpEntryReady(root: ParentNode = document): OtpFieldGroup | null {
  if (isNonOtpSettingsUrl()) return null;
  if (isPhoneOrSmsOnlyPage(root)) return null;

  const pagePrompt = hasEnterCodePrompt(root);
  const ranked = detectOtpFields(root);

  for (const group of ranked) {
    const el = group.elements[0];
    if (fieldHasStrongOtpSignal(el)) {
      if (pagePrompt || group.confidence >= 0.55 || group.mode === 'split') return group;
    }
  }

  if (!pagePrompt) return null;

  for (const group of ranked) {
    const el = group.elements[0];
    if (group.confidence >= 0.5 && !isNonOtpField(el)) return group;
  }

  return null;
}

export function watchOtpFields(onChange: (groups: OtpFieldGroup[]) => void): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const run = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      const ready = isOtpEntryReady();
      onChange(ready ? [ready] : []);
    }, 120);
  };

  const observer = new MutationObserver(run);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style', 'hidden', 'disabled', 'maxlength', 'autocomplete', 'type'],
  });

  window.addEventListener('popstate', run);
  const origPush = history.pushState.bind(history);
  const origReplace = history.replaceState.bind(history);
  history.pushState = (...args) => {
    origPush(...args);
    run();
  };
  history.replaceState = (...args) => {
    origReplace(...args);
    run();
  };

  run();
  return () => {
    observer.disconnect();
    window.removeEventListener('popstate', run);
    history.pushState = origPush;
    history.replaceState = origReplace;
    if (timer) clearTimeout(timer);
  };
}
