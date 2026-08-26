/**
 * UI chrome strings for the risk pages, in the three supported languages. Advisory/band text comes
 * from the engine (advisory-templates.ts); this file is only page labels and buttons.
 * [VERIFY-kn] Kannada reviewed for the prototype; confirm with a native speaker before production.
 */
import type { Lang } from '@/lib/i18n/advisory-templates'

export interface UiStrings {
  appName: string
  fieldRiskTitle: string
  fieldRiskSubtitle: string
  predictName: string
  predictQuestion: string
  detectName: string
  detectQuestion: string
  liveMode: string
  demoMode: string
  scenario: string
  language: string
  worstFirst: string
  why: string
  whatToDo: string
  riskLevel: string
  accumulatedSeverity: string
  wetHours: string
  minTemp: string
  consecutiveDays: string
  method: string
  weatherSource: string
  lastUpdated: string
  district: string
  loading: string
  errorTitle: string
  retry: string
  openDetect: string
  notTrainedYet: string
  hutton: string
  wallin: string
  yes: string
  no: string
  hours: string
  days: string
  // Confirmation + monitoring (CONFIRM → MONITOR)
  confirmTitle: string
  confirmSprayed: string
  confirmSymptoms: string
  confirmNoChange: string
  confirmNeedExpert: string
  confirmRecorded: string
  monitoringLog: string
  expertTitle: string
  expertReferral: string
  listen: string
}

export const UI: Record<Lang, UiStrings> = {
  en: {
    appName: 'Prahari',
    fieldRiskTitle: 'Field Risk — early warning',
    fieldRiskSubtitle: 'Could disease become a problem soon? Weather + crop, checked against the Hutton and Wallin science.',
    predictName: 'Field Risk',
    predictQuestion: 'Could disease become a problem soon?',
    detectName: 'Check my crop',
    detectQuestion: 'Does my crop show disease now?',
    liveMode: 'Live forecast',
    demoMode: 'Demo',
    scenario: 'Scenario',
    language: 'Language',
    worstFirst: 'Worst first',
    why: 'Why?',
    whatToDo: 'What to do',
    riskLevel: 'Risk',
    accumulatedSeverity: 'Accumulated severity (DSV)',
    wetHours: 'Leaf-wet hours',
    minTemp: 'Coldest hour',
    consecutiveDays: 'Consecutive risky days',
    method: 'Method',
    weatherSource: 'Weather',
    lastUpdated: 'Updated',
    district: 'District',
    loading: 'Checking the weather…',
    errorTitle: 'Could not get live weather',
    retry: 'Try again',
    openDetect: 'Open “Check my crop”',
    notTrainedYet: 'Image detection is not wired to a trained model yet — see the honest status inside.',
    hutton: 'Hutton criterion',
    wallin: 'Wallin severity',
    yes: 'Yes',
    no: 'No',
    hours: 'h',
    days: 'days',
    confirmTitle: 'What is happening in this field?',
    confirmSprayed: 'I sprayed',
    confirmSymptoms: 'I see symptoms',
    confirmNoChange: 'No change',
    confirmNeedExpert: 'Need an expert',
    confirmRecorded: 'Recorded for this session (not saved to a server).',
    monitoringLog: 'Monitoring log',
    expertTitle: 'Talk to an expert',
    expertReferral:
      'Contact your local Krishi Vigyan Kendra (KVK) or agriculture extension officer for a reliable, in-person diagnosis.',
    listen: 'Listen',
  },
  hi: {
    appName: 'प्रहरी',
    fieldRiskTitle: 'खेत का जोखिम — पहले से चेतावनी',
    fieldRiskSubtitle: 'क्या जल्द ही बीमारी बढ़ सकती है? मौसम और फसल को हटन और वालिन विज्ञान से जाँचा गया।',
    predictName: 'खेत का जोखिम',
    predictQuestion: 'क्या जल्द ही बीमारी बढ़ सकती है?',
    detectName: 'मेरी फसल जाँचें',
    detectQuestion: 'क्या मेरी फसल में अभी बीमारी है?',
    liveMode: 'लाइव मौसम',
    demoMode: 'डेमो',
    scenario: 'परिदृश्य',
    language: 'भाषा',
    worstFirst: 'पहले सबसे ज़्यादा जोखिम',
    why: 'क्यों?',
    whatToDo: 'क्या करें',
    riskLevel: 'जोखिम',
    accumulatedSeverity: 'कुल गंभीरता (DSV)',
    wetHours: 'पत्ते गीले रहने के घंटे',
    minTemp: 'सबसे ठंडा घंटा',
    consecutiveDays: 'लगातार जोखिम वाले दिन',
    method: 'तरीका',
    weatherSource: 'मौसम',
    lastUpdated: 'अपडेट',
    district: 'ज़िला',
    loading: 'मौसम जाँचा जा रहा है…',
    errorTitle: 'लाइव मौसम नहीं मिल सका',
    retry: 'फिर कोशिश करें',
    openDetect: '“मेरी फसल जाँचें” खोलें',
    notTrainedYet: 'तस्वीर से पहचान अभी किसी ट्रेंड मॉडल से नहीं जुड़ी है — अंदर सही स्थिति देखें।',
    hutton: 'हटन नियम',
    wallin: 'वालिन गंभीरता',
    yes: 'हाँ',
    no: 'नहीं',
    hours: 'घंटे',
    days: 'दिन',
    confirmTitle: 'इस खेत में क्या हो रहा है?',
    confirmSprayed: 'मैंने छिड़काव किया',
    confirmSymptoms: 'मुझे लक्षण दिखे',
    confirmNoChange: 'कोई बदलाव नहीं',
    confirmNeedExpert: 'विशेषज्ञ चाहिए',
    confirmRecorded: 'इस सत्र के लिए दर्ज (सर्वर पर सहेजा नहीं गया)।',
    monitoringLog: 'निगरानी लॉग',
    expertTitle: 'विशेषज्ञ से बात करें',
    expertReferral:
      'भरोसेमंद, आमने-सामने पहचान के लिए अपने नज़दीकी कृषि विज्ञान केंद्र (KVK) या कृषि विस्तार अधिकारी से संपर्क करें।',
    listen: 'सुनें',
  },
  kn: {
    appName: 'ಪ್ರಹರಿ',
    fieldRiskTitle: 'ಹೊಲದ ಅಪಾಯ — ಮುಂಚಿನ ಎಚ್ಚರಿಕೆ',
    fieldRiskSubtitle: 'ಶೀಘ್ರದಲ್ಲೇ ರೋಗ ಸಮಸ್ಯೆಯಾಗಬಹುದೇ? ಹವಾಮಾನ ಮತ್ತು ಬೆಳೆಯನ್ನು ಹಟನ್ ಮತ್ತು ವಾಲಿನ್ ವಿಜ್ಞಾನದಿಂದ ಪರಿಶೀಲಿಸಲಾಗಿದೆ.',
    predictName: 'ಹೊಲದ ಅಪಾಯ',
    predictQuestion: 'ಶೀಘ್ರದಲ್ಲೇ ರೋಗ ಸಮಸ್ಯೆಯಾಗಬಹುದೇ?',
    detectName: 'ನನ್ನ ಬೆಳೆ ಪರಿಶೀಲಿಸಿ',
    detectQuestion: 'ನನ್ನ ಬೆಳೆಯಲ್ಲಿ ಈಗ ರೋಗವಿದೆಯೇ?',
    liveMode: 'ನೇರ ಹವಾಮಾನ',
    demoMode: 'ಡೆಮೋ',
    scenario: 'ಸನ್ನಿವೇಶ',
    language: 'ಭಾಷೆ',
    worstFirst: 'ಹೆಚ್ಚು ಅಪಾಯ ಮೊದಲು',
    why: 'ಏಕೆ?',
    whatToDo: 'ಏನು ಮಾಡಬೇಕು',
    riskLevel: 'ಅಪಾಯ',
    accumulatedSeverity: 'ಒಟ್ಟು ತೀವ್ರತೆ (DSV)',
    wetHours: 'ಎಲೆ ಒದ್ದೆ ಗಂಟೆಗಳು',
    minTemp: 'ಅತಿ ತಂಪಾದ ಗಂಟೆ',
    consecutiveDays: 'ಸತತ ಅಪಾಯದ ದಿನಗಳು',
    method: 'ವಿಧಾನ',
    weatherSource: 'ಹವಾಮಾನ',
    lastUpdated: 'ನವೀಕರಿಸಲಾಗಿದೆ',
    district: 'ಜಿಲ್ಲೆ',
    loading: 'ಹವಾಮಾನ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ…',
    errorTitle: 'ನೇರ ಹವಾಮಾನ ಸಿಗಲಿಲ್ಲ',
    retry: 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ',
    openDetect: '“ನನ್ನ ಬೆಳೆ ಪರಿಶೀಲಿಸಿ” ತೆರೆಯಿರಿ',
    notTrainedYet: 'ಚಿತ್ರ ಪತ್ತೆ ಇನ್ನೂ ತರಬೇತಿ ಪಡೆದ ಮಾದರಿಗೆ ಜೋಡಿಸಲಾಗಿಲ್ಲ — ಒಳಗೆ ನಿಜ ಸ್ಥಿತಿ ನೋಡಿ.',
    hutton: 'ಹಟನ್ ನಿಯಮ',
    wallin: 'ವಾಲಿನ್ ತೀವ್ರತೆ',
    yes: 'ಹೌದು',
    no: 'ಇಲ್ಲ',
    hours: 'ಗಂ',
    days: 'ದಿನ',
    confirmTitle: 'ಈ ಹೊಲದಲ್ಲಿ ಏನಾಗುತ್ತಿದೆ?',
    confirmSprayed: 'ನಾನು ಸಿಂಪಡಿಸಿದೆ',
    confirmSymptoms: 'ರೋಗ ಲಕ್ಷಣ ಕಂಡಿದೆ',
    confirmNoChange: 'ಬದಲಾವಣೆ ಇಲ್ಲ',
    confirmNeedExpert: 'ತಜ್ಞರ ಅಗತ್ಯವಿದೆ',
    confirmRecorded: 'ಈ ಅವಧಿಗೆ ದಾಖಲಿಸಲಾಗಿದೆ (ಸರ್ವರ್‌ನಲ್ಲಿ ಉಳಿಸಿಲ್ಲ).',
    monitoringLog: 'ಮೇಲ್ವಿಚಾರಣೆ ದಾಖಲೆ',
    expertTitle: 'ತಜ್ಞರೊಂದಿಗೆ ಮಾತನಾಡಿ',
    expertReferral:
      'ವಿಶ್ವಾಸಾರ್ಹ, ಖುದ್ದಾಗಿ ಪತ್ತೆಗಾಗಿ ನಿಮ್ಮ ಸ್ಥಳೀಯ ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರ (KVK) ಅಥವಾ ಕೃಷಿ ವಿಸ್ತರಣಾ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.',
    listen: 'ಕೇಳಿ',
  },
}
