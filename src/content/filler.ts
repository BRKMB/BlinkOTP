import { sanitizeOtpCode } from '../shared/otp-extractor';
import type { OtpFieldGroup } from './detector';

const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
  HTMLInputElement.prototype,
  'value',
)?.set;

function setNativeValue(el: HTMLInputElement, value: string): void {
  const tracker = (el as HTMLInputElement & { _valueTracker?: { setValue: (v: string) => void } })
    ._valueTracker;
  if (tracker) tracker.setValue(el.value);

  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(el, value);
  } else {
    el.value = value;
  }

  el.dispatchEvent(
    new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertReplacementText',
      data: value,
    }),
  );
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function tryInsertText(el: HTMLInputElement, value: string): boolean {
  el.focus();
  el.select();
  try {
    return document.execCommand('insertText', false, value);
  } catch {
    return false;
  }
}

function dispatchKey(el: HTMLInputElement, key: string): void {
  el.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
  );
  el.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
}

export function fillOtpGroup(group: OtpFieldGroup, code: string): boolean {
  const normalized = sanitizeOtpCode(code);
  if (!normalized) return false;

  if (group.mode === 'single') {
    const el = group.elements[0];
    el.focus();
    el.click();
    setNativeValue(el, '');
    if (!tryInsertText(el, normalized)) {
      setNativeValue(el, normalized);
    }
    dispatchKey(el, 'Enter');
    const current = el.value.replace(/\s/g, '');
    const want = normalized.replace(/\s/g, '');
    return current === want || current.includes(want);
  }

  const boxes = group.elements;
  boxes[0].focus();
  const pasteEvent = new ClipboardEvent('paste', {
    bubbles: true,
    cancelable: true,
    clipboardData: new DataTransfer(),
  });
  pasteEvent.clipboardData?.setData('text/plain', normalized);
  const pasted = boxes[0].dispatchEvent(pasteEvent);

  if (!pasted) {
    for (let i = 0; i < boxes.length && i < normalized.length; i++) {
      boxes[i].focus();
      setNativeValue(boxes[i], normalized[i] ?? '');
    }
  }

  boxes[boxes.length - 1]?.dispatchEvent(new Event('blur', { bubbles: true }));
  return true;
}

export function tryAutoSubmit(root: ParentNode = document): void {
  const form = root.querySelector('form');
  if (!form) return;

  const buttons = [...form.querySelectorAll<HTMLButtonElement>('button, input[type="submit"]')];
  const match = buttons.find((btn) => {
    const text = `${btn.textContent ?? ''} ${btn.value ?? ''} ${btn.getAttribute('aria-label') ?? ''}`.toLowerCase();
    return /verify|continue|submit|confirm|next|log\s?in|sign\s?in/.test(text);
  });

  if (match && !match.disabled) {
    setTimeout(() => match.click(), 1000);
  }
}
