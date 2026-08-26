/**
 * Advisory text templates — the four-part script (WHICH FIELD → WHAT → WHY → WHEN).
 *
 * 🔴 Adding a language is a DATA edit here, never a code change. hi + en are ported verbatim from
 * Prahari pipeline/config/advisory_templates.yaml. kn (Kannada) is authored for this MVP.
 *
 * [VERIFY-kn] The Kannada strings below were written for the prototype and should be reviewed by a
 * native speaker before being shown to real farmers. They are kept short and simple on purpose.
 *
 * Sentences are deliberately SHORT and vocabulary SIMPLE — it improves comprehension in every
 * dialect at once, which matters more than the language count suggests.
 */

export type Lang = 'en' | 'hi' | 'kn'
export type Band = 'safe' | 'watch' | 'act'

export interface AdvisoryTemplate {
  name: string
  disease: string
  crops: Record<string, string>
  which: string // uses {field}
  what: Record<Band, string> // uses {crop}, {disease}
  whyWet: string // uses {wet_hours}
  whyDry: string
  whyTooHot: string
  whyTooCold: string
  whenSafe: string
  whenWatch: string
  whenAct: string // uses {window}
  whenActNoWindow: string
  bandLabel: Record<Band, string>
  action: Record<Band, string>
}

export const ADVISORY_TEMPLATES: Record<Lang, AdvisoryTemplate> = {
  hi: {
    name: 'हिंदी',
    disease: 'झुलसा',
    crops: { potato: 'आलू' },
    which: 'आपके {field} में',
    what: {
      safe: '{crop} की {disease} बीमारी का कोई खतरा नहीं है।',
      watch: '{crop} की {disease} बीमारी का खतरा बन रहा है।',
      act: '{crop} की {disease} बीमारी का खतरा है।',
    },
    whyWet: 'पिछली रातों में {wet_hours} घंटे तक पत्ते गीले रहे।',
    whyDry: 'मौसम सूखा है, नमी कम है।',
    whyTooHot: 'नमी तो है, पर गर्मी ज़्यादा है — इतनी गर्मी में यह बीमारी नहीं बढ़ती।',
    whyTooCold: 'नमी तो है, पर ठंड ज़्यादा है — इतनी ठंड में यह बीमारी नहीं बढ़ती।',
    whenSafe: 'कुछ नहीं करना है। खेत देखते रहें।',
    whenWatch: 'दवा तैयार रखें और खेत देखते रहें।',
    whenAct: '{window} छिड़काव करें।',
    whenActNoWindow: 'मौसम खुलने पर सुबह जल्दी छिड़काव करें।',
    bandLabel: { safe: 'सुरक्षित', watch: 'ध्यान दें', act: 'छिड़काव करें' },
    action: { safe: 'कुछ नहीं करना है', watch: 'दवा तैयार रखें', act: 'बताए समय पर छिड़काव करें' },
  },
  en: {
    name: 'English',
    disease: 'late blight',
    crops: { potato: 'potato' },
    which: 'In your {field},',
    what: {
      safe: 'there is no {disease} risk to your {crop}.',
      watch: '{disease} risk to your {crop} is building.',
      act: 'there is a {disease} risk to your {crop}.',
    },
    whyWet: 'Leaves stayed wet for {wet_hours} hours on recent nights.',
    whyDry: 'The weather is dry and humidity is low.',
    whyTooHot: 'It is humid, but too hot — this disease does not develop in this heat.',
    whyTooCold: 'It is humid, but too cold — this disease does not develop in this cold.',
    whenSafe: 'Nothing to do. Keep watching your field.',
    whenWatch: 'Get medicine ready and keep checking your field.',
    whenAct: 'Spray {window}.',
    whenActNoWindow: 'Spray early in the morning once the weather clears.',
    bandLabel: { safe: 'Safe', watch: 'Watch', act: 'Act' },
    action: { safe: 'Nothing to do', watch: 'Get medicine ready', act: 'Spray in the window shown' },
  },
  kn: {
    name: 'ಕನ್ನಡ',
    disease: 'ಅಂಗಮಾರಿ',
    crops: { potato: 'ಆಲೂಗಡ್ಡೆ' },
    which: 'ನಿಮ್ಮ {field} ನಲ್ಲಿ,',
    what: {
      safe: 'ನಿಮ್ಮ {crop} ಬೆಳೆಗೆ {disease} ರೋಗದ ಅಪಾಯವಿಲ್ಲ.',
      watch: 'ನಿಮ್ಮ {crop} ಬೆಳೆಗೆ {disease} ರೋಗದ ಅಪಾಯ ಹೆಚ್ಚುತ್ತಿದೆ.',
      act: 'ನಿಮ್ಮ {crop} ಬೆಳೆಗೆ {disease} ರೋಗದ ಅಪಾಯವಿದೆ.',
    },
    whyWet: 'ಇತ್ತೀಚಿನ ರಾತ್ರಿಗಳಲ್ಲಿ ಎಲೆಗಳು {wet_hours} ಗಂಟೆ ಒದ್ದೆಯಾಗಿದ್ದವು.',
    whyDry: 'ಹವಾಮಾನ ಒಣಗಿದೆ, ತೇವಾಂಶ ಕಡಿಮೆ ಇದೆ.',
    whyTooHot: 'ತೇವಾಂಶವಿದೆ, ಆದರೆ ತುಂಬಾ ಸೆಕೆ ಇದೆ — ಈ ಸೆಕೆಯಲ್ಲಿ ಈ ರೋಗ ಬೆಳೆಯುವುದಿಲ್ಲ.',
    whyTooCold: 'ತೇವಾಂಶವಿದೆ, ಆದರೆ ತುಂಬಾ ಚಳಿ ಇದೆ — ಈ ಚಳಿಯಲ್ಲಿ ಈ ರೋಗ ಬೆಳೆಯುವುದಿಲ್ಲ.',
    whenSafe: 'ಏನೂ ಮಾಡಬೇಕಿಲ್ಲ. ನಿಮ್ಮ ಹೊಲವನ್ನು ಗಮನಿಸುತ್ತಿರಿ.',
    whenWatch: 'ಔಷಧಿಯನ್ನು ಸಿದ್ಧವಾಗಿಟ್ಟುಕೊಳ್ಳಿ ಮತ್ತು ಹೊಲವನ್ನು ಪರಿಶೀಲಿಸುತ್ತಿರಿ.',
    whenAct: '{window} ಸಿಂಪಡಿಸಿ.',
    whenActNoWindow: 'ಹವಾಮಾನ ತಿಳಿಯಾದ ಮೇಲೆ ಬೆಳಿಗ್ಗೆ ಬೇಗ ಸಿಂಪಡಿಸಿ.',
    bandLabel: { safe: 'ಸುರಕ್ಷಿತ', watch: 'ಗಮನಿಸಿ', act: 'ಸಿಂಪಡಿಸಿ' },
    action: { safe: 'ಏನೂ ಮಾಡಬೇಕಿಲ್ಲ', watch: 'ಔಷಧಿ ಸಿದ್ಧವಾಗಿಡಿ', act: 'ತಿಳಿಸಿದ ಸಮಯದಲ್ಲಿ ಸಿಂಪಡಿಸಿ' },
  },
}
