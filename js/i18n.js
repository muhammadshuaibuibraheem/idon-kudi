// Strings in English (en) and Hausa (ha).
// NOTE: the Hausa text was written without a native-speaker review. Have a Hausa speaker
// (ideally a blind or low-vision user) check every string before real deployment.
// To add Yoruba or Igbo, add a new top-level key with the same keys and a <option> in index.html.

export const STRINGS = {
  en: {
    appName: 'Idon Kudi',
    tagline: 'Your eye for money',
    tabNotes: 'Notes',
    tabAlerts: 'Alerts',
    tabTransfer: 'Transfer',
    tabTeach: 'Teach',
    language: 'Language',
    screenReaderMode: 'I use a screen reader (the app will not speak aloud)',

    // Notes
    notesIntro: 'Hold a naira note flat in front of the camera, in good light.',
    scanStart: 'Start scanning',
    scanStop: 'Stop scanning',
    torchOn: 'Flashlight on',
    torchOff: 'Flashlight off',
    noModel: 'I have not been taught any notes yet. Go to the Teach tab and take photos of each note first.',
    needTwo: 'I only know the {d} naira note so far. Teach me at least one more different note in the Teach tab, so I can tell them apart.',
    scanning: 'Scanning. Hold the note still.',
    tooDark: 'It is too dark. Turn on the flashlight or move near a light.',
    notSure: 'I am not sure. Hold the note flat and steady in good light.',
    noteIs: 'This looks like a {n} naira note.',
    noteIsLow: 'This might be a {n} naira note, but I am not fully sure. Try again.',
    cameraError: 'I cannot use the camera. Please allow camera access in your browser settings.',
    scanStopped: 'Scanning stopped.',
    noteWord: { 5: 'five', 10: 'ten', 20: 'twenty', 50: 'fifty', 100: 'one hundred', 200: 'two hundred', 500: 'five hundred', 1000: 'one thousand' },

    // Alerts
    alertsIntro: 'Paste or share a bank text message here and I will check it for scam signs. Tip: in your Messages app, choose Share and pick Idon Kudi.',
    alertSender: 'Sender name or number (optional)',
    alertText: 'Message text',
    alertPaste: 'Paste from clipboard',
    alertCheck: 'Check message',
    alertEmpty: 'There is no message to check. Paste the text first.',
    normalCredit: 'This looks like a normal credit alert of {amount} naira. But anyone can fake a text. Check your balance in your bank app or by USSD before you hand over goods.',
    normalDebit: 'This looks like a normal debit alert of {amount} naira.',
    normalUnknown: 'I could not find an amount or a clear credit or debit in this message.',
    cautionHead: 'Be careful. This message has {n} warning sign(s).',
    suspiciousHead: 'Warning. This message is very likely a scam. Do not act on it.',
    neverShare: 'Never share your PIN or OTP with anyone.',
    flag_secret: 'It asks for a PIN, OTP, BVN or password. Banks never ask for these by message.',
    flag_link: 'It contains a web link. Real banks rarely send links in alerts.',
    flag_urgency: 'It pushes you to act urgently or threatens to block your account.',
    flag_reversal: 'It talks about a pending credit or reversal. Fake alerts often use this.',
    flag_prize: 'It promises a prize, loan or free money.',
    flag_phoneSender: 'It came from an ordinary phone number. Bank alerts usually come from a name.',
    flag_noBalance: 'It shows no balance. Most bank alerts include one.',

    // Transfer
    transferIntro: 'Before you send money in your bank app, type or say the amount and account number. I will read them back so you can catch mistakes. I do not move any money.',
    tfAmount: 'Amount in naira (for example 5000 or five thousand)',
    tfAccount: 'Account number (10 digits)',
    tfBank: 'Bank name (optional)',
    tfCheck: 'Read it back',
    tfConfirm: 'Yes, it is correct',
    tfCancel: 'No, cancel',
    tfSpeak: 'Speak',
    tfReadback: 'You are sending {words} naira, that is {amount}, to account number {digits}{bank}. Is this correct?',
    tfBankPart: ', at {bank}',
    tfHigh: 'This is a large amount. Listen again: {words} naira. Confirm once more to continue.',
    tfNewRecipient: 'You have not sent to this account before. Check the account name in your bank app first.',
    tfBadAccount: 'An account number has 10 digits. I heard {n}. Please check it.',
    tfNoAmount: 'I could not understand the amount. Try digits, like 5000.',
    tfConfirmed: 'Confirmed. Now finish the transfer in your bank app. I do not move money.',
    tfCancelled: 'Cancelled. Nothing was sent.',
    tfListening: 'Listening.',
    tfHeard: 'I heard: {text}',
    tfNoSpeech: 'Voice input is not available on this phone. Please type.',

    // Teach
    teachIntro: 'Teach me your notes. Pick a note, hold it in front of the camera, and press Capture. Use different lighting, front and back, new and old notes. Aim for at least 3 captures per note, in different places.',
    teachPick: 'Which note?',
    teachCapture: 'Capture 10 photos',
    teachCapturing: 'Capturing. Slowly tilt the note.',
    teachDone: 'Done. I now have {n} samples of the {d} naira note.',
    teachCounts: 'Samples so far',
    teachCheck: 'Check my accuracy',
    teachAccuracy: 'Held-out accuracy is {pct} percent on {n} samples.',
    teachWeakest: 'Weakest note: {d} naira at {pct} percent. Capture more of it, in different places.',
    teachNotEnough: 'Not enough data yet. Capture at least 2 different notes in at least 2 separate sessions.',
    teachExport: 'Export data',
    teachImport: 'Import data',
    teachClear: 'Delete all my data',
    teachCleared: 'All saved samples were deleted.',
    teachImported: 'Imported {n} samples.',
    teachPrivacy: 'Only numbers describing colour patterns are saved on this phone. No photos are stored or sent anywhere.',
    teachCameraFirst: 'The camera must be on. Press Start camera.',
    noVoice: 'No Hausa voice is installed on this phone, so I may sound wrong. Turn on screen reader mode, or install a Hausa voice in your phone text-to-speech settings.',
    cameraStart: 'Start camera',
    cameraStop: 'Stop camera',
  },

  ha: {
    appName: 'Idon Kudi',
    tagline: 'Idonka a kan kuɗi',
    tabNotes: 'Takardun kuɗi',
    tabAlerts: 'Saƙonni',
    tabTransfer: 'Aikawa',
    tabTeach: 'Koyarwa',
    language: 'Harshe',
    screenReaderMode: 'Ina amfani da na’urar karatu (manhajar ba za ta yi magana ba)',

    notesIntro: 'Ka riƙe takardar naira a tsaye a gaban kyamara, a wuri mai haske.',
    scanStart: 'Fara dubawa',
    scanStop: 'Daina dubawa',
    torchOn: 'Kunna fitila',
    torchOff: 'Kashe fitila',
    noModel: 'Ban koyi kowace takarda ba tukuna. Ka je shafin Koyarwa ka ɗauki hotunan kowace takarda tukuna.',
    needTwo: 'Na san takardar naira {d} kawai har yanzu. Ka koya mini aƙalla wata takarda daban a shafin Koyarwa, domin in iya bambance su.',
    scanning: 'Ina dubawa. Ka riƙe takardar babu motsi.',
    tooDark: 'Wuri ya yi duhu. Ka kunna fitila ko ka matsa kusa da haske.',
    notSure: 'Ban tabbata ba. Ka riƙe takardar a tsaye, a wuri mai haske.',
    noteIs: 'Wannan takardar naira {n} ce.',
    noteIsLow: 'Wannan mai yiwuwa takardar naira {n} ce, amma ban cika tabbata ba. Ka sake gwadawa.',
    cameraError: 'Ba zan iya amfani da kyamara ba. Don Allah ka ba da izinin kyamara a saitin burauzarka.',
    scanStopped: 'An daina dubawa.',
    noteWord: { 5: 'biyar', 10: 'goma', 20: 'ashirin', 50: 'hamsin', 100: 'dari', 200: 'dari biyu', 500: 'dari biyar', 1000: 'dubu ɗaya' },

    alertsIntro: 'Ka manna ko ka tura saƙon banki a nan, zan duba maka alamun yaudara. Shawara: a manhajar Saƙonni, ka zaɓi Share ka zaɓi Idon Kudi.',
    alertSender: 'Sunan ko lambar mai aikawa (ba dole ba)',
    alertText: 'Rubutun saƙon',
    alertPaste: 'Manna daga clipboard',
    alertCheck: 'Duba saƙon',
    alertEmpty: 'Babu saƙon da zan duba. Ka manna rubutun tukuna.',
    normalCredit: 'Wannan yana kama da saƙon shigowar kuɗi na naira {amount}. Amma kowa na iya ƙirƙirar saƙo. Ka duba ragowar kuɗinka a manhajar banki ko USSD kafin ka ba da kaya.',
    normalDebit: 'Wannan yana kama da saƙon fitar kuɗi na naira {amount}.',
    normalUnknown: 'Ban sami adadin kuɗi ko shigowa ko fita a cikin saƙon ba.',
    cautionHead: 'Ka yi hankali. Wannan saƙon yana da alamun gargaɗi {n}.',
    suspiciousHead: 'Gargaɗi. Wannan saƙon da alama yaudara ne. Kada ka yi komai da shi.',
    neverShare: 'Kada ka ba kowa PIN ko OTP naka.',
    flag_secret: 'Yana neman PIN, OTP, BVN ko kalmar sirri. Banki ba ya neman waɗannan ta saƙo.',
    flag_link: 'Yana ɗauke da hanyar intanet (link). Bankuna ba kasafai suke aika link a saƙon kuɗi ba.',
    flag_urgency: 'Yana matsa maka ka yi gaggawa ko ya yi barazanar rufe asusunka.',
    flag_reversal: 'Yana magana kan kuɗin da ke jiran shiga ko dawowa. Saƙon ƙarya yakan yi haka.',
    flag_prize: 'Yana yi maka alƙawarin kyauta, rance ko kuɗin kyauta.',
    flag_phoneSender: 'Ya fito daga lambar waya ta yau da kullum. Saƙonnin banki galibi suna fitowa da suna.',
    flag_noBalance: 'Ba ya nuna ragowar kuɗi. Yawancin saƙonnin banki suna nuna.',

    transferIntro: 'Kafin ka aika kuɗi a manhajar bankinka, ka rubuta ko ka faɗi adadin da lambar asusu. Zan karanta maka su domin ka kama kuskure. Ni ba na motsa kuɗi.',
    tfAmount: 'Adadin kuɗi a naira (misali 5000)',
    tfAccount: 'Lambar asusu (lambobi 10)',
    tfBank: 'Sunan banki (ba dole ba)',
    tfCheck: 'Karanta mini',
    tfConfirm: 'Ee, daidai ne',
    tfCancel: 'A’a, a fasa',
    tfSpeak: 'Yi magana',
    tfReadback: 'Za ka aika naira {amount} zuwa asusu mai lamba {digits}{bank}. Daidai ne?',
    tfBankPart: ', a {bank}',
    tfHigh: 'Wannan kuɗi ne mai yawa. Ka sake saurara: naira {amount}. Ka tabbatar sau ɗaya kuma.',
    tfNewRecipient: 'Ba ka taɓa aika wa wannan asusu ba. Ka tabbatar da sunan mai asusun a manhajar bankinka tukuna.',
    tfBadAccount: 'Lambar asusu tana da lambobi 10. Na ji {n}. Don Allah ka duba.',
    tfNoAmount: 'Ban fahimci adadin kuɗin ba. Ka gwada da lambobi, kamar 5000.',
    tfConfirmed: 'An tabbatar. Yanzu ka kammala aikawar a manhajar bankinka. Ni ba na motsa kuɗi.',
    tfCancelled: 'An fasa. Ba a aika komai ba.',
    tfListening: 'Ina saurara.',
    tfHeard: 'Na ji: {text}',
    tfNoSpeech: 'Wannan wayar ba ta da shigar da murya. Don Allah ka rubuta.',

    teachIntro: 'Ka koya mini takardun kuɗinka. Ka zaɓi takarda, ka riƙe ta a gaban kyamara, ka danna Ɗauka. Ka yi amfani da haske daban-daban, gaba da baya, sabuwa da tsohuwa. Ka yi aƙalla ɗauka 3 ga kowace takarda, a wurare daban-daban.',
    teachPick: 'Wace takarda?',
    teachCapture: 'Ɗauki hotuna 10',
    teachCapturing: 'Ina ɗauka. Ka karkatar da takardar a hankali.',
    teachDone: 'An gama. Yanzu ina da samfura {n} na takardar naira {d}.',
    teachCounts: 'Samfuran da aka ɗauka',
    teachCheck: 'Duba daidaiton aiki na',
    teachAccuracy: 'Daidaiton aiki shi ne kashi {pct} cikin ɗari a kan samfura {n}.',
    teachWeakest: 'Takardar da ta fi rauni: naira {d} a kashi {pct}. Ka ɗauki ƙarin hotunanta a wurare daban-daban.',
    teachNotEnough: 'Bayanai ba su isa ba tukuna. Ka ɗauki aƙalla takardu 2 daban-daban a zama 2 daban-daban.',
    teachExport: 'Fitar da bayanai',
    teachImport: 'Shigar da bayanai',
    teachClear: 'Goge dukkan bayanaina',
    teachCleared: 'An goge dukkan samfuran da aka adana.',
    teachImported: 'An shigar da samfura {n}.',
    teachPrivacy: 'Lambobin da ke bayyana tsarin launi kawai ake adanawa a wannan wayar. Ba a adana hotuna ko aika su ko’ina.',
    teachCameraFirst: 'Dole kyamara ta kasance a kunne. Ka danna Kunna kyamara.',
    noVoice: 'Wannan wayar ba ta da muryar Hausa, don haka ina iya yin magana ba daidai ba. Ka kunna yanayin na’urar karatu, ko ka sanya muryar Hausa a saitin text-to-speech na wayarka.',
    cameraStart: 'Kunna kyamara',
    cameraStop: 'Kashe kyamara',
  },
};

export function t(lang, key, vars = {}) {
  const dict = STRINGS[lang] || STRINGS.en;
  let s = dict[key];
  if (s === undefined) s = STRINGS.en[key];
  if (typeof s !== 'string') return key;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : ''));
}

// What the app says for a note prediction. Uses the spoken word for the denomination
// in Hausa, digits elsewhere, so the voice never has to read "1000" in an unknown way.
export function noteMessage(lang, denomination, sure) {
  const word = (STRINGS[lang].noteWord || {})[denomination] || String(denomination);
  return t(lang, sure ? 'noteIs' : 'noteIsLow', { n: lang === 'ha' ? word : denomination });
}

// Builds the full spoken/written answer for an alert analysis result.
export function alertMessage(lang, r) {
  if (r.empty) return t(lang, 'alertEmpty');
  const parts = [];
  const amount = r.amount !== null ? r.amount.toLocaleString('en-NG') : '';

  if (r.verdict === 'suspicious') parts.push(t(lang, 'suspiciousHead'));
  else if (r.verdict === 'caution') parts.push(t(lang, 'cautionHead', { n: r.flags.length }));
  else if (r.type === 'credit' && r.amount !== null) parts.push(t(lang, 'normalCredit', { amount }));
  else if (r.type === 'debit' && r.amount !== null) parts.push(t(lang, 'normalDebit', { amount }));
  else parts.push(t(lang, 'normalUnknown'));

  const ordered = [...r.flags].sort((a, b) => b.weight - a.weight);
  for (const f of ordered) parts.push(t(lang, 'flag_' + f.id));

  // Even a "caution" credit alert should still get the balance-check reminder.
  if (r.verdict === 'caution' && r.type === 'credit') parts.push(t(lang, 'normalCredit', { amount }));
  if (r.verdict !== 'normal') parts.push(t(lang, 'neverShare'));
  return parts.join(' ');
}

export function transferMessages(lang, a, bankName = '') {
  const msgs = [];
  if (a.issues.includes('noAmount')) msgs.push(t(lang, 'tfNoAmount'));
  if (a.issues.includes('badAccount')) msgs.push(t(lang, 'tfBadAccount', { n: a.accountLength }));
  if (msgs.length) return { problems: msgs, readback: '' };

  const bank = bankName ? t(lang, 'tfBankPart', { bank: bankName }) : '';
  const readback = t(lang, 'tfReadback', {
    words: a.amountWords, amount: a.amountDigits, digits: a.spokenAccount, bank,
  });
  const extra = [];
  if (a.newRecipient) extra.push(t(lang, 'tfNewRecipient'));
  return { problems: [], readback: [readback, ...extra].join(' ') };
}
