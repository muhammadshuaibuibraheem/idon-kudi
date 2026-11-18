// Transfer Guard: a read-back check BEFORE the user sends money in their bank app.
// It never moves money. It only helps catch wrong amounts (extra zeros) and wrong accounts.

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const SCALES = [
  ['million', 1e6],
  ['thousand', 1e3],
];

export const HIGH_VALUE = 50000; // naira; asks for a second confirmation at or above this
export const ACCOUNT_LENGTH = 10; // Nigerian NUBAN account numbers have 10 digits

export function numberToWords(n) {
  n = Math.floor(Number(n));
  if (!Number.isFinite(n) || n < 0) return '';
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
  if (n < 1000) {
    return ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' + numberToWords(n % 100) : '');
  }
  for (const [name, size] of SCALES) {
    if (n >= size) {
      const head = numberToWords(Math.floor(n / size));
      const rest = n % size;
      const glue = rest && rest < 100 ? ' and ' : ' ';
      return head + ' ' + name + (rest ? glue + numberToWords(rest) : '');
    }
  }
  return String(n);
}

const WORD_VALUES = {};
ONES.forEach((w, i) => (WORD_VALUES[w] = i));
TENS.forEach((w, i) => { if (w) WORD_VALUES[w] = i * 10; });

// Understands: "5000", "5,000", "₦5,000.50", "5k", "5 thousand", "five thousand five hundred".
export function parseSpokenAmount(input) {
  if (input === null || input === undefined) return null;
  let s = String(input).toLowerCase().trim();
  s = s.replace(/₦|ngn|naira|\bn(?=\d)/g, ' ').replace(/,/g, '').trim();
  if (!s) return null;

  let m = s.match(/^(\d+(?:\.\d+)?)\s*(k|thousand|m|million)?$/);
  if (m) {
    const base = Number(m[1]);
    const mult = m[2] === 'k' || m[2] === 'thousand' ? 1e3 : m[2] === 'm' || m[2] === 'million' ? 1e6 : 1;
    return base * mult;
  }

  // English number words.
  const tokens = s.replace(/-/g, ' ').split(/\s+/).filter((w) => w && w !== 'and');
  if (!tokens.length) return null;
  let total = 0;
  let current = 0;
  for (const w of tokens) {
    if (w in WORD_VALUES) current += WORD_VALUES[w];
    else if (w === 'hundred') current = (current || 1) * 100;
    else if (w === 'thousand') { total += (current || 1) * 1e3; current = 0; }
    else if (w === 'million') { total += (current || 1) * 1e6; current = 0; }
    else return null;
  }
  return total + current;
}

const DIGIT_WORDS = { zero: 0, oh: 0, o: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9 };

// Turns dictated text like "zero one two 3 4 five" into "012345". Unknown words are ignored.
export function spokenToDigits(text) {
  return String(text || '')
    .toLowerCase()
    .split(/[\s,.-]+/)
    .map((w) => (/^\d+$/.test(w) ? w : w in DIGIT_WORDS ? String(DIGIT_WORDS[w]) : ''))
    .join('');
}

export function normalizeAccount(input) {
  return String(input || '').replace(/\D/g, '');
}

// "0123456789" -> "0 1 2, 3 4 5, 6 7 8 9" so text-to-speech reads digit by digit with pauses.
export function spellDigits(digits) {
  const d = String(digits).split('');
  const groups = [d.slice(0, 3), d.slice(3, 6), d.slice(6)].filter((g) => g.length);
  return groups.map((g) => g.join(' ')).join(', ');
}

export function formatNaira(n) {
  return Number(n).toLocaleString('en-NG', { maximumFractionDigits: 2 });
}

// Returns what to say and which checks apply. `knownAccounts` is a list of digit strings.
export function assessTransfer({ amountInput, accountInput, knownAccounts = [] }) {
  const amount = parseSpokenAmount(amountInput);
  const account = normalizeAccount(accountInput);
  const issues = [];

  if (amount === null || !(amount > 0)) issues.push('noAmount');
  if (account.length !== ACCOUNT_LENGTH) issues.push('badAccount');

  const valid = issues.length === 0;
  const high = valid && amount >= HIGH_VALUE;
  const newRecipient = valid && !knownAccounts.includes(account);
  return {
    valid,
    issues,
    amount,
    account,
    accountLength: account.length,
    amountWords: amount > 0 ? numberToWords(amount) : '',
    amountDigits: amount > 0 ? formatNaira(amount) : '',
    spokenAccount: spellDigits(account),
    high,
    newRecipient,
    confirmsNeeded: high ? 2 : 1,
  };
}
