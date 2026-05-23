const ESP_DOMAINS = new Set([
  'sendgrid.net',
  'mailgun.org',
  'amazonses.com',
  'sparkpostmail.com',
  'mandrillapp.com',
  'postmarkapp.com',
  'mailchimp.com',
  'constantcontact.com',
  'hubspotemail.net',
  'salesforce.com',
  'google.com',
  'microsoft.com',
]);

function normalizeHost(host: string): string {
  return host.toLowerCase().replace(/^www\./, '');
}

function extractDomain(emailOrDomain: string): string {
  const trimmed = emailOrDomain.trim().toLowerCase();
  const angle = trimmed.match(/<([^>]+)>/);
  const addr = angle ? angle[1] : trimmed;
  const at = addr.lastIndexOf('@');
  if (at >= 0) return addr.slice(at + 1);
  return normalizeHost(addr);
}

function baseLabel(domain: string): string {
  const parts = domain.split('.').filter(Boolean);
  if (parts.length < 2) return domain;
  return parts[parts.length - 2];
}

/** Lenient brand matching: same registrable label or subdomain relationship */
export function domainsAlign(senderDomain: string, siteHost: string): boolean {
  const sender = normalizeHost(extractDomain(senderDomain));
  const site = normalizeHost(siteHost);

  if (!sender || !site) return true;
  if (sender === site) return true;
  if (site.endsWith(`.${sender}`) || sender.endsWith(`.${site}`)) return true;

  if (ESP_DOMAINS.has(sender) || ESP_DOMAINS.has(site)) return true;

  const senderBase = baseLabel(sender);
  const siteBase = baseLabel(site);
  if (senderBase && siteBase && senderBase === siteBase) return true;
  if (senderBase === 'github' && siteBase === 'github') return true;
  if (sender.includes('github') && site.includes('github')) return true;

  const senderTokens = new Set(sender.split(/[.-]/).filter((t) => t.length > 2));
  for (const token of site.split(/[.-]/)) {
    if (token.length > 2 && senderTokens.has(token)) return true;
  }

  return false;
}

export function domainMismatchWarning(senderDomain: string, siteHost: string): string | null {
  if (domainsAlign(senderDomain, siteHost)) return null;
  return `Sender (${senderDomain}) may not match this site (${siteHost}). Confirm before using this code.`;
}
