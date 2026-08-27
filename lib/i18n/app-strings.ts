/**
 * App-level UI copy for the PRAVAAH shell and the pages that are not covered by ui-strings.ts
 * (which stays focused on the Field Risk / detect chrome). English is primary; Hindi and Kannada
 * are provided for the farmer-facing surfaces. [VERIFY-kn] Kannada is prototype-quality — confirm
 * with a native speaker before production.
 *
 * PRAVAAH is the product name shown to users. Internal identifiers (PRAHARI, model IDs, API routes)
 * are intentionally NOT changed.
 */
import type { Lang } from '@/lib/i18n/advisory-templates'
import type { NavKey } from '@/components/app-shell/nav'

export interface AppStrings {
  brandTagline: string
  nav: Record<NavKey, string>
  more: string
  menu: string
  language: string
  demoTest: string
  liveData: string
  demoTitle: string
  demoBody: string
  goLive: string
  scenario: string
  scenarioLabels: Record<string, string>

  // Home
  homeHello: string
  homeSub: string
  homeToday: string
  homeUpdated: string
  homeSourceLive: string
  homeSourceDemo: string
  homeAllClearTitle: string
  homeAllClearBody: string
  homeWatchTitle: string // "{n}" placeholder
  homeWatchBody: string
  homeActTitle: string // "{n}" placeholder
  homeActBody: string
  homeFieldsTitle: string
  homeViewAllFields: string
  homeQuickTitle: string
  homeQCheck: string
  homeQCheckSub: string
  homeQForecast: string
  homeQForecastSub: string
  homeQMandi: string
  homeQMandiSub: string
  homeNoWeatherTitle: string
  homeNoWeatherBody: string

  // Fields
  fieldsTitle: string
  fieldsSub: string
  fieldArea: string
  fieldSown: string
  fieldStatus: string
  fieldWhatToDo: string
  fieldViewForecast: string

  // Alerts
  alertsTitle: string
  alertsSub: string
  sevUrgent: string
  sevAttention: string
  sevWatch: string
  sevInfo: string
  alertWhere: string
  alertWhy: string
  alertWhat: string
  alertsAllClearTitle: string
  alertsAllClearBody: string

  // Insights
  insightsTitle: string
  insightsSub: string
  insStatusDist: string
  insSafe: string
  insWatch: string
  insAct: string
  insPerField: string
  insDsvProgress: string
  insWetHours: string
  insColdest: string
  insRiskyDays: string
  insWindow: string

  // Settings
  settingsTitle: string
  settingsSub: string
  setLanguage: string
  setLanguageBody: string
  setDemo: string
  setDemoBody: string
  setAbout: string
  setAboutBody: string
  setDataSources: string
  setDataSourcesBody: string

  // Common
  retry: string
  loading: string
  unavailable: string
}

const NAV_EN: Record<NavKey, string> = {
  home: 'Home',
  fields: 'My Fields',
  cropHealth: 'Crop Health',
  fieldRisk: 'Field Risk',
  mandi: 'Mandi',
  alerts: 'Alerts',
  insights: 'Insights',
  settings: 'Settings',
}
const NAV_HI: Record<NavKey, string> = {
  home: 'होम',
  fields: 'मेरे खेत',
  cropHealth: 'फसल की सेहत',
  fieldRisk: 'खेत का जोखिम',
  mandi: 'मंडी',
  alerts: 'चेतावनियाँ',
  insights: 'विश्लेषण',
  settings: 'सेटिंग्स',
}
const NAV_KN: Record<NavKey, string> = {
  home: 'ಮುಖಪುಟ',
  fields: 'ನನ್ನ ಹೊಲಗಳು',
  cropHealth: 'ಬೆಳೆ ಆರೋಗ್ಯ',
  fieldRisk: 'ಹೊಲದ ಅಪಾಯ',
  mandi: 'ಮಂಡಿ',
  alerts: 'ಎಚ್ಚರಿಕೆಗಳು',
  insights: 'ವಿಶ್ಲೇಷಣೆ',
  settings: 'ಸೆಟ್ಟಿಂಗ್ಸ್',
}

const SCEN_EN = { blight_outbreak: 'Blight outbreak', borderline_watch: 'Borderline', dry_spell: 'Dry spell' }
const SCEN_HI = { blight_outbreak: 'झुलसा प्रकोप', borderline_watch: 'सीमा रेखा', dry_spell: 'सूखा दौर' }
const SCEN_KN = { blight_outbreak: 'ಬ್ಲೈಟ್ ಏಕಾಏಕಿ', borderline_watch: 'ಗಡಿ ಮಟ್ಟ', dry_spell: 'ಒಣ ಅವಧಿ' }

export const APP_STRINGS: Record<Lang, AppStrings> = {
  en: {
    brandTagline: 'Agricultural Intelligence',
    nav: NAV_EN,
    more: 'More',
    menu: 'Menu',
    language: 'Language',
    demoTest: 'Demo / Test mode',
    liveData: 'Live data',
    demoTitle: 'Demo / Test mode is on',
    demoBody: 'You are viewing a saved weather scenario, not live conditions. Switch it off to use the live forecast for your district.',
    goLive: 'Use live data',
    scenario: 'Scenario',
    scenarioLabels: SCEN_EN,

    homeHello: 'Your farm today',
    homeSub: 'A quick look at what needs your attention right now.',
    homeToday: "What's happening on my farm",
    homeUpdated: 'Updated',
    homeSourceLive: 'Live weather forecast',
    homeSourceDemo: 'Demo scenario',
    homeAllClearTitle: 'All clear today',
    homeAllClearBody: 'Conditions are calm across your fields. No disease action is needed right now — keep up your normal checks.',
    homeWatchTitle: 'Keep an eye on {n}',
    homeWatchBody: 'Weather is becoming favorable for disease in these fields. No spraying needed yet, but check the plants.',
    homeActTitle: 'Action needed in {n}',
    homeActBody: 'Conditions strongly favor disease. Open the field to see what to do and when.',
    homeFieldsTitle: 'Your fields',
    homeViewAllFields: 'View all fields',
    homeQuickTitle: 'Quick actions',
    homeQCheck: 'Check a leaf',
    homeQCheckSub: 'Photograph a leaf you are worried about',
    homeQForecast: 'See the forecast',
    homeQForecastSub: 'Weather-based disease risk for each field',
    homeQMandi: 'Market prices',
    homeQMandiSub: 'Latest government mandi rates',
    homeNoWeatherTitle: 'Live weather is unavailable',
    homeNoWeatherBody: 'We could not reach the weather service, so today’s field status cannot be shown. Please try again, or switch on Demo mode to explore the app.',

    fieldsTitle: 'My Fields',
    fieldsSub: 'The plots you farm and their status today.',
    fieldArea: 'Area',
    fieldSown: 'Sown',
    fieldStatus: 'Status',
    fieldWhatToDo: 'What to do',
    fieldViewForecast: 'View forecast',

    alertsTitle: 'Alerts',
    alertsSub: 'Sorted by how urgent they are.',
    sevUrgent: 'Urgent',
    sevAttention: 'Attention',
    sevWatch: 'Watch',
    sevInfo: 'Info',
    alertWhere: 'Where',
    alertWhy: 'Why',
    alertWhat: 'What to do',
    alertsAllClearTitle: 'No alerts right now',
    alertsAllClearBody: 'Conditions are calm across your fields. We’ll flag anything that needs your attention here.',

    insightsTitle: 'Insights',
    insightsSub: 'A read on your fields from the current forecast — real numbers only, no invented history.',
    insStatusDist: 'Field status right now',
    insSafe: 'Safe',
    insWatch: 'Watch',
    insAct: 'Act',
    insPerField: 'By field',
    insDsvProgress: 'Disease severity toward spray threshold',
    insWetHours: 'Leaf-wet hours',
    insColdest: 'Coldest hour',
    insRiskyDays: 'Consecutive risky days',
    insWindow: 'Based on the current forecast window for your district.',

    settingsTitle: 'Settings',
    settingsSub: 'Language, demo mode, and where the data comes from.',
    setLanguage: 'Language',
    setLanguageBody: 'Choose the language used across the app.',
    setDemo: 'Demo / Test mode',
    setDemoBody: 'Show saved weather scenarios instead of the live forecast. Useful for demos in dry weather when live risk is low.',
    setAbout: 'About PRAVAAH',
    setAboutBody: 'PRAVAAH gives small farmers an early warning for crop disease from weather, an image check for leaves, and honest market prices — in their own language.',
    setDataSources: 'Data sources',
    setDataSourcesBody: 'Weather: Open-Meteo. Market prices: data.gov.in / AGMARKNET. Leaf diagnosis: a PlantVillage-trained image classifier. Field risk uses the Hutton criterion and Wallin severity.',

    retry: 'Try again',
    loading: 'Loading…',
    unavailable: 'Unavailable',
  },

  hi: {
    brandTagline: 'कृषि इंटेलिजेंस',
    nav: NAV_HI,
    more: 'और',
    menu: 'मेन्यू',
    language: 'भाषा',
    demoTest: 'डेमो / टेस्ट मोड',
    liveData: 'लाइव डेटा',
    demoTitle: 'डेमो / टेस्ट मोड चालू है',
    demoBody: 'आप एक सहेजा हुआ मौसम परिदृश्य देख रहे हैं, लाइव स्थिति नहीं। अपने ज़िले का लाइव पूर्वानुमान देखने के लिए इसे बंद करें।',
    goLive: 'लाइव डेटा उपयोग करें',
    scenario: 'परिदृश्य',
    scenarioLabels: SCEN_HI,

    homeHello: 'आज आपका खेत',
    homeSub: 'अभी किस बात पर ध्यान देना है, एक झलक।',
    homeToday: 'मेरे खेत में क्या हो रहा है',
    homeUpdated: 'अपडेट',
    homeSourceLive: 'लाइव मौसम पूर्वानुमान',
    homeSourceDemo: 'डेमो परिदृश्य',
    homeAllClearTitle: 'आज सब ठीक है',
    homeAllClearBody: 'आपके खेतों में स्थिति शांत है। अभी बीमारी के लिए कुछ करने की ज़रूरत नहीं — सामान्य जाँच जारी रखें।',
    homeWatchTitle: '{n} पर नज़र रखें',
    homeWatchBody: 'इन खेतों में मौसम बीमारी के लिए अनुकूल हो रहा है। अभी छिड़काव की ज़रूरत नहीं, पर पौधे देखें।',
    homeActTitle: '{n} में कार्रवाई ज़रूरी',
    homeActBody: 'स्थिति बीमारी के लिए बहुत अनुकूल है। खेत खोलकर देखें कि क्या और कब करना है।',
    homeFieldsTitle: 'आपके खेत',
    homeViewAllFields: 'सभी खेत देखें',
    homeQuickTitle: 'तुरंत काम',
    homeQCheck: 'पत्ता जाँचें',
    homeQCheckSub: 'जिस पत्ते की चिंता है उसकी फोटो लें',
    homeQForecast: 'पूर्वानुमान देखें',
    homeQForecastSub: 'हर खेत के लिए मौसम आधारित जोखिम',
    homeQMandi: 'मंडी भाव',
    homeQMandiSub: 'ताज़ा सरकारी मंडी दरें',
    homeNoWeatherTitle: 'लाइव मौसम उपलब्ध नहीं',
    homeNoWeatherBody: 'हम मौसम सेवा तक नहीं पहुँच सके, इसलिए आज की खेत स्थिति नहीं दिखाई जा सकती। फिर कोशिश करें, या ऐप देखने के लिए डेमो मोड चालू करें।',

    fieldsTitle: 'मेरे खेत',
    fieldsSub: 'आपके खेत और आज उनकी स्थिति।',
    fieldArea: 'क्षेत्रफल',
    fieldSown: 'बुवाई',
    fieldStatus: 'स्थिति',
    fieldWhatToDo: 'क्या करें',
    fieldViewForecast: 'पूर्वानुमान देखें',

    alertsTitle: 'चेतावनियाँ',
    alertsSub: 'ज़रूरत के अनुसार क्रमबद्ध।',
    sevUrgent: 'तुरंत',
    sevAttention: 'ध्यान दें',
    sevWatch: 'निगरानी',
    sevInfo: 'सूचना',
    alertWhere: 'कहाँ',
    alertWhy: 'क्यों',
    alertWhat: 'क्या करें',
    alertsAllClearTitle: 'अभी कोई चेतावनी नहीं',
    alertsAllClearBody: 'आपके खेतों में स्थिति शांत है। ध्यान देने योग्य कुछ भी हम यहाँ दिखाएँगे।',

    insightsTitle: 'विश्लेषण',
    insightsSub: 'मौजूदा पूर्वानुमान से आपके खेतों की स्थिति — केवल असली आँकड़े, कोई मनगढ़ंत इतिहास नहीं।',
    insStatusDist: 'अभी खेतों की स्थिति',
    insSafe: 'सुरक्षित',
    insWatch: 'निगरानी',
    insAct: 'कार्रवाई',
    insPerField: 'खेत अनुसार',
    insDsvProgress: 'छिड़काव सीमा की ओर बीमारी की गंभीरता',
    insWetHours: 'पत्ते गीले घंटे',
    insColdest: 'सबसे ठंडा घंटा',
    insRiskyDays: 'लगातार जोखिम वाले दिन',
    insWindow: 'आपके ज़िले के मौजूदा पूर्वानुमान पर आधारित।',

    settingsTitle: 'सेटिंग्स',
    settingsSub: 'भाषा, डेमो मोड, और डेटा कहाँ से आता है।',
    setLanguage: 'भाषा',
    setLanguageBody: 'ऐप में उपयोग होने वाली भाषा चुनें।',
    setDemo: 'डेमो / टेस्ट मोड',
    setDemoBody: 'लाइव पूर्वानुमान के बजाय सहेजे हुए मौसम परिदृश्य दिखाएँ। सूखे मौसम में डेमो के लिए उपयोगी जब लाइव जोखिम कम हो।',
    setAbout: 'PRAVAAH के बारे में',
    setAboutBody: 'PRAVAAH छोटे किसानों को मौसम से फसल रोग की पूर्व-चेतावनी, पत्तों की तस्वीर जाँच, और ईमानदार मंडी भाव देता है — उनकी अपनी भाषा में।',
    setDataSources: 'डेटा स्रोत',
    setDataSourcesBody: 'मौसम: Open-Meteo। मंडी भाव: data.gov.in / AGMARKNET। पत्ता पहचान: PlantVillage पर प्रशिक्षित इमेज क्लासिफायर। खेत जोखिम हटन नियम और वालिन गंभीरता का उपयोग करता है।',

    retry: 'फिर कोशिश करें',
    loading: 'लोड हो रहा है…',
    unavailable: 'उपलब्ध नहीं',
  },

  kn: {
    brandTagline: 'ಕೃಷಿ ಇಂಟೆಲಿಜೆನ್ಸ್',
    nav: NAV_KN,
    more: 'ಇನ್ನಷ್ಟು',
    menu: 'ಮೆನು',
    language: 'ಭಾಷೆ',
    demoTest: 'ಡೆಮೋ / ಟೆಸ್ಟ್ ಮೋಡ್',
    liveData: 'ನೇರ ಡೇಟಾ',
    demoTitle: 'ಡೆಮೋ / ಟೆಸ್ಟ್ ಮೋಡ್ ಚಾಲ್ತಿಯಲ್ಲಿದೆ',
    demoBody: 'ನೀವು ಉಳಿಸಿದ ಹವಾಮಾನ ಸನ್ನಿವೇಶವನ್ನು ನೋಡುತ್ತಿದ್ದೀರಿ, ನೇರ ಸ್ಥಿತಿಯಲ್ಲ. ನಿಮ್ಮ ಜಿಲ್ಲೆಯ ನೇರ ಮುನ್ಸೂಚನೆಗಾಗಿ ಇದನ್ನು ಆಫ್ ಮಾಡಿ.',
    goLive: 'ನೇರ ಡೇಟಾ ಬಳಸಿ',
    scenario: 'ಸನ್ನಿವೇಶ',
    scenarioLabels: SCEN_KN,

    homeHello: 'ಇಂದು ನಿಮ್ಮ ಹೊಲ',
    homeSub: 'ಈಗ ಏನಿಗೆ ಗಮನ ಬೇಕು ಎಂಬ ಸಂಕ್ಷಿಪ್ತ ನೋಟ.',
    homeToday: 'ನನ್ನ ಹೊಲದಲ್ಲಿ ಏನಾಗುತ್ತಿದೆ',
    homeUpdated: 'ನವೀಕರಿಸಲಾಗಿದೆ',
    homeSourceLive: 'ನೇರ ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ',
    homeSourceDemo: 'ಡೆಮೋ ಸನ್ನಿವೇಶ',
    homeAllClearTitle: 'ಇಂದು ಎಲ್ಲವೂ ಸರಿ',
    homeAllClearBody: 'ನಿಮ್ಮ ಹೊಲಗಳಲ್ಲಿ ಸ್ಥಿತಿ ಶಾಂತವಾಗಿದೆ. ಈಗ ರೋಗಕ್ಕೆ ಯಾವುದೇ ಕ್ರಮ ಬೇಕಿಲ್ಲ — ಸಾಮಾನ್ಯ ಪರಿಶೀಲನೆ ಮುಂದುವರಿಸಿ.',
    homeWatchTitle: '{n} ಮೇಲೆ ಗಮನವಿಡಿ',
    homeWatchBody: 'ಈ ಹೊಲಗಳಲ್ಲಿ ಹವಾಮಾನ ರೋಗಕ್ಕೆ ಅನುಕೂಲವಾಗುತ್ತಿದೆ. ಇನ್ನೂ ಸಿಂಪಡಣೆ ಬೇಕಿಲ್ಲ, ಆದರೆ ಗಿಡಗಳನ್ನು ನೋಡಿ.',
    homeActTitle: '{n} ನಲ್ಲಿ ಕ್ರಮ ಅಗತ್ಯ',
    homeActBody: 'ಸ್ಥಿತಿ ರೋಗಕ್ಕೆ ಬಲವಾಗಿ ಅನುಕೂಲವಾಗಿದೆ. ಏನು ಮತ್ತು ಯಾವಾಗ ಮಾಡಬೇಕೆಂದು ಹೊಲ ತೆರೆದು ನೋಡಿ.',
    homeFieldsTitle: 'ನಿಮ್ಮ ಹೊಲಗಳು',
    homeViewAllFields: 'ಎಲ್ಲಾ ಹೊಲ ನೋಡಿ',
    homeQuickTitle: 'ತ್ವರಿತ ಕ್ರಮಗಳು',
    homeQCheck: 'ಎಲೆ ಪರಿಶೀಲಿಸಿ',
    homeQCheckSub: 'ಚಿಂತೆಯ ಎಲೆಯ ಫೋಟೋ ತೆಗೆಯಿರಿ',
    homeQForecast: 'ಮುನ್ಸೂಚನೆ ನೋಡಿ',
    homeQForecastSub: 'ಪ್ರತಿ ಹೊಲಕ್ಕೆ ಹವಾಮಾನ ಆಧಾರಿತ ಅಪಾಯ',
    homeQMandi: 'ಮಾರುಕಟ್ಟೆ ಬೆಲೆ',
    homeQMandiSub: 'ಇತ್ತೀಚಿನ ಸರ್ಕಾರಿ ಮಂಡಿ ದರಗಳು',
    homeNoWeatherTitle: 'ನೇರ ಹವಾಮಾನ ಲಭ್ಯವಿಲ್ಲ',
    homeNoWeatherBody: 'ಹವಾಮಾನ ಸೇವೆಯನ್ನು ತಲುಪಲಾಗಲಿಲ್ಲ, ಆದ್ದರಿಂದ ಇಂದಿನ ಹೊಲ ಸ್ಥಿತಿ ತೋರಿಸಲಾಗದು. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ, ಅಥವಾ ಆ್ಯಪ್ ನೋಡಲು ಡೆಮೋ ಮೋಡ್ ಆನ್ ಮಾಡಿ.',

    fieldsTitle: 'ನನ್ನ ಹೊಲಗಳು',
    fieldsSub: 'ನೀವು ಬೆಳೆಯುವ ಹೊಲಗಳು ಮತ್ತು ಇಂದಿನ ಸ್ಥಿತಿ.',
    fieldArea: 'ವಿಸ್ತೀರ್ಣ',
    fieldSown: 'ಬಿತ್ತನೆ',
    fieldStatus: 'ಸ್ಥಿತಿ',
    fieldWhatToDo: 'ಏನು ಮಾಡಬೇಕು',
    fieldViewForecast: 'ಮುನ್ಸೂಚನೆ ನೋಡಿ',

    alertsTitle: 'ಎಚ್ಚರಿಕೆಗಳು',
    alertsSub: 'ತುರ್ತಿನ ಆಧಾರದ ಮೇಲೆ ವಿಂಗಡಿಸಲಾಗಿದೆ.',
    sevUrgent: 'ತುರ್ತು',
    sevAttention: 'ಗಮನ',
    sevWatch: 'ನಿಗಾ',
    sevInfo: 'ಮಾಹಿತಿ',
    alertWhere: 'ಎಲ್ಲಿ',
    alertWhy: 'ಏಕೆ',
    alertWhat: 'ಏನು ಮಾಡಬೇಕು',
    alertsAllClearTitle: 'ಈಗ ಯಾವುದೇ ಎಚ್ಚರಿಕೆ ಇಲ್ಲ',
    alertsAllClearBody: 'ನಿಮ್ಮ ಹೊಲಗಳಲ್ಲಿ ಸ್ಥಿತಿ ಶಾಂತವಾಗಿದೆ. ಗಮನ ಬೇಕಾದ ಯಾವುದನ್ನಾದರೂ ಇಲ್ಲಿ ತೋರಿಸುತ್ತೇವೆ.',

    insightsTitle: 'ವಿಶ್ಲೇಷಣೆ',
    insightsSub: 'ಪ್ರಸ್ತುತ ಮುನ್ಸೂಚನೆಯಿಂದ ನಿಮ್ಮ ಹೊಲಗಳ ಸ್ಥಿತಿ — ನಿಜವಾದ ಅಂಕಿಅಂಶಗಳು ಮಾತ್ರ, ಕಲ್ಪಿತ ಇತಿಹಾಸವಿಲ್ಲ.',
    insStatusDist: 'ಈಗ ಹೊಲಗಳ ಸ್ಥಿತಿ',
    insSafe: 'ಸುರಕ್ಷಿತ',
    insWatch: 'ನಿಗಾ',
    insAct: 'ಕ್ರಮ',
    insPerField: 'ಹೊಲದ ಪ್ರಕಾರ',
    insDsvProgress: 'ಸಿಂಪಡಣೆ ಮಿತಿಯತ್ತ ರೋಗ ತೀವ್ರತೆ',
    insWetHours: 'ಎಲೆ ಒದ್ದೆ ಗಂಟೆಗಳು',
    insColdest: 'ಅತಿ ತಂಪಾದ ಗಂಟೆ',
    insRiskyDays: 'ಸತತ ಅಪಾಯದ ದಿನಗಳು',
    insWindow: 'ನಿಮ್ಮ ಜಿಲ್ಲೆಯ ಪ್ರಸ್ತುತ ಮುನ್ಸೂಚನೆ ಆಧಾರಿತ.',

    settingsTitle: 'ಸೆಟ್ಟಿಂಗ್ಸ್',
    settingsSub: 'ಭಾಷೆ, ಡೆಮೋ ಮೋಡ್, ಮತ್ತು ಡೇಟಾ ಎಲ್ಲಿಂದ ಬರುತ್ತದೆ.',
    setLanguage: 'ಭಾಷೆ',
    setLanguageBody: 'ಆ್ಯಪ್‌ನಲ್ಲಿ ಬಳಸುವ ಭಾಷೆಯನ್ನು ಆರಿಸಿ.',
    setDemo: 'ಡೆಮೋ / ಟೆಸ್ಟ್ ಮೋಡ್',
    setDemoBody: 'ನೇರ ಮುನ್ಸೂಚನೆಯ ಬದಲು ಉಳಿಸಿದ ಹವಾಮಾನ ಸನ್ನಿವೇಶಗಳನ್ನು ತೋರಿಸಿ. ಒಣ ಹವಾಮಾನದಲ್ಲಿ ಡೆಮೋಗೆ ಉಪಯುಕ್ತ.',
    setAbout: 'PRAVAAH ಬಗ್ಗೆ',
    setAboutBody: 'PRAVAAH ಸಣ್ಣ ರೈತರಿಗೆ ಹವಾಮಾನದಿಂದ ಬೆಳೆ ರೋಗದ ಮುಂಚಿನ ಎಚ್ಚರಿಕೆ, ಎಲೆಗಳ ಚಿತ್ರ ಪರಿಶೀಲನೆ, ಮತ್ತು ಪ್ರಾಮಾಣಿಕ ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳನ್ನು — ಅವರ ಸ್ವಂತ ಭಾಷೆಯಲ್ಲಿ ನೀಡುತ್ತದೆ.',
    setDataSources: 'ಡೇಟಾ ಮೂಲಗಳು',
    setDataSourcesBody: 'ಹವಾಮಾನ: Open-Meteo. ಮಂಡಿ ಬೆಲೆ: data.gov.in / AGMARKNET. ಎಲೆ ಪತ್ತೆ: PlantVillage ತರಬೇತಿ ಪಡೆದ ಚಿತ್ರ ವರ್ಗೀಕಾರ. ಹೊಲ ಅಪಾಯ ಹಟನ್ ನಿಯಮ ಮತ್ತು ವಾಲಿನ್ ತೀವ್ರತೆ ಬಳಸುತ್ತದೆ.',

    retry: 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ',
    loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ…',
    unavailable: 'ಲಭ್ಯವಿಲ್ಲ',
  },
}

/** Tiny placeholder formatter: fmt('Action needed in {n}', { n: '2 fields' }). */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`))
}
