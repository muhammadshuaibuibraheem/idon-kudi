// Alert Guard: parses a bank SMS and looks for scam signs.
// Pure functions, no DOM, so it runs in the browser and in node tests.
//
// IMPORTANT: this is a heuristic. It can never prove an alert is real.
// A normal-looking credit alert can still be forged, so the app always tells
// the user to confirm the balance in the bank app or by USSD.

const AMOUNT = '((?:\\d{1,3}(?:,\\d{3})+|\\d+)(?:\\.\\d{1,2})?)';
const CURRENCY = '(?:NGN|N|₦)\\s?';

const BALANCE_RE = new RegExp(
  '(?:avail(?:able)?\\.?\\s*)?bal(?:ance)?\\.?\\s*[:\\-]?\\s*' + CURRENCY + '?' + AMOUNT,
  'i'
);
const AMOUNT_RE = new RegExp('(?:^|[^A-Za-z0-9])' + CURRENCY + AMOUNT, 'i');

const CREDIT_RE = /\b(credit(?:ed)?|cr|deposit(?:ed)?|received|inflow)\b/i;
const DEBIT_RE = /\b(debit(?:ed)?|dr|withdraw(?:al|n)?|purchase|outflow|payment)\b/i;

const FLAGS = [
  {
    id: 'secret',
    weight: 4,
    test: (t) => {
      // Genuine alerts often end with "Never share your PIN or OTP". Remove such warning
      // sentences first so they are not mistaken for a request.
      const cleaned = t.replace(
        /[^.!?\n]*\b(never|do not|don't|dont|will not|won't)\b[^.!?\n]*\b(share|disclose|give|reveal|send|ask|provide)\b[^.!?\n]*/gi,
        ' '
      );
      return (
        /\b(pin|otp|bvn|nin|password|cvv|token)\b/i.test(cleaned) &&
        /\b(send|share|provide|confirm|verify|enter|reply|give|submit|update)\b/i.test(cleaned)
      );
    },
  },
  {
    id: 'link',
    weight: 3,
    test: (t) =>
      /(https?:\/\/|www\.|bit\.ly|tinyurl|\b[a-z0-9-]+\.(?:com|ng|net|org|co|xyz|info|ly|me|link|click)\b)/i.test(t),
  },
  {
    id: 'urgency',
    weight: 2,
    test: (t) =>
      /\b(urgent(?:ly)?|immediately|suspend(?:ed)?|block(?:ed)?|deactivat\w*|restrict(?:ed)?|expire[sd]?|final notice|within \d+\s*(?:hours?|hrs?|minutes?|mins?))\b/i.test(t),
  },
  {
    id: 'reversal',
    weight: 2,
    test: (t) =>
      /(sent by mistake|wrongly|wrong transfer|refund me|return(?:ing)? the money|reverse|reversal|pending credit|will reflect|should reflect|yet to reflect|will be credited shortly)/i.test(t),
  },
  {
    id: 'prize',
    weight: 2,
    test: (t) => /\b(won|winner|promo|loan approved|congratulations|giveaway|grant|free money)\b/i.test(t),
  },
];

export function parseAmount(str) {
  return Number(String(str).replace(/,/g, ''));
}

export function analyzeAlert(text, sender = '') {
  const raw = String(text || '').trim();
  const result = {
    type: 'unknown', // credit | debit | unknown
    amount: null,
    balance: null,
    flags: [],
    score: 0,
    verdict: 'normal', // normal | caution | suspicious
    empty: raw.length === 0,
  };
  if (result.empty) return result;

  const balMatch = raw.match(BALANCE_RE);
  if (balMatch) result.balance = parseAmount(balMatch[1]);

  // Remove the balance clause so it is not mistaken for the transaction amount.
  const withoutBalance = balMatch ? raw.replace(balMatch[0], ' ') : raw;
  const amtMatch = withoutBalance.match(AMOUNT_RE);
  if (amtMatch) result.amount = parseAmount(amtMatch[1]);

  const isCredit = CREDIT_RE.test(withoutBalance);
  const isDebit = DEBIT_RE.test(withoutBalance);
  if (isCredit && !isDebit) result.type = 'credit';
  else if (isDebit && !isCredit) result.type = 'debit';
  else if (isCredit && isDebit) {
    // Both words appear. The first one mentioned usually describes the transaction.
    result.type = withoutBalance.search(CREDIT_RE) < withoutBalance.search(DEBIT_RE) ? 'credit' : 'debit';
  }

  for (const f of FLAGS) {
    if (f.test(raw)) result.flags.push({ id: f.id, weight: f.weight });
  }
  // Bank alerts normally come from a name (e.g. "GTBANK"), not a personal number.
  if (sender && /^\+?[\d\s-]{7,}$/.test(String(sender).trim())) {
    result.flags.push({ id: 'phoneSender', weight: 3 });
  }
  if (result.type === 'credit' && result.balance === null) {
    result.flags.push({ id: 'noBalance', weight: 1 });
  }

  result.score = result.flags.reduce((s, f) => s + f.weight, 0);
  result.verdict = result.score >= 3 ? 'suspicious' : result.score >= 1 ? 'caution' : 'normal';
  return result;
}
