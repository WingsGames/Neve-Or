import { Language } from '../types';

export const translations = {
  he: {
    start: 'התחל את המשחק',
    devMode: 'כניסה למצב מפתח (Dev Mode)',
    backToMap: 'חזור למפה',
    stepBack: 'צעד אחורה',
    locked: 'נעול',
    completed: 'הושלם',
    open: 'פתוח למשחק',
    next: 'המשך',
    challenge: 'המשך לאתגר',
    finishLevel: 'סיים שלב וחזור למפה',
    finishGame: 'סיים משחק',
    moreInfo: 'מידע נוסף והרחבה',
    close: 'סגור',
    understood: 'הבנתי, סגור',
    mapTitle: 'מפת העיר',
    gameTitle: 'נווה אור',
    loading: 'טוען...',
    closeDev: 'סגור ועבור למשחק',
    correct: 'כל הכבוד!',
    correctAnswer: 'תשובה נכונה!',
    tryAgain: 'טעות! נסו שוב',
    codeCracked: 'הקוד פוצח!',
    codeLabel: 'הקוד הסודי',
    accessDenied: 'גישה נדחתה: קוד שגוי',
    question: 'שאלה',
    of: 'מתוך',
    mission: 'משימה',
    socialMedia: 'רשת חברתית',
    newsAlert: 'מבזק חדשות',
    likes: 'לייקים',
    
    chooseLocation: 'בחר מיקום כדי לשמוע את התושבים',
    visited: '✓ ביקרת כאן',
    clickToListen: 'לחץ להאזנה',
    finishedListening: 'סיימתי להקשיב',
    proceedToDecision: 'עבור להחלטה',
    visitMore: 'בקר בעוד',
    locations: 'מוקדים',
    
    balloonsInst: '🎈 פוצצו רק את הבלונים שמראים פגיעה בחופש הביטוי!',
    shieldInst: '🛡️ הגנו על מי שביטחונו נפגע!',
    
    yourChoice: 'הבחירה שלך:',

    rotateDevice: 'נא לסובב את המכשיר למצב מאוזן 🔄'
  },
  en: {
    start: 'Start Game',
    devMode: 'Enter Dev Mode',
    backToMap: 'Back to Map',
    stepBack: 'Step Back',
    locked: 'Locked',
    completed: 'Completed',
    open: 'Open',
    next: 'Next',
    challenge: 'Go to Challenge',
    finishLevel: 'Finish Level & Back to Map',
    finishGame: 'Finish Game',
    moreInfo: 'More Info',
    close: 'Close',
    understood: 'Close',
    mapTitle: 'City Map',
    gameTitle: 'Neve Or',
    loading: 'Loading...',
    closeDev: 'Close & Play',
    correct: 'Well Done!',
    correctAnswer: 'Correct Answer!',
    tryAgain: 'Wrong! Try Again',
    codeCracked: 'Code Cracked!',
    codeLabel: 'Secret Code',
    accessDenied: 'Access Denied: Wrong Code',
    question: 'Question',
    of: 'of',
    mission: 'MISSION',
    socialMedia: 'SOCIAL MEDIA',
    newsAlert: 'NEWS ALERT',
    likes: 'Likes',
    
    chooseLocation: 'Select a location to hear the residents',
    visited: '✓ Visited',
    clickToListen: 'Click to listen',
    finishedListening: 'Finished listening',
    proceedToDecision: 'Proceed to Decision',
    visitMore: 'Visit',
    locations: 'more locations',
    
    balloonsInst: '🎈 Pop only the balloons that show a violation of Freedom of Speech!',
    shieldInst: '🛡️ Protect the vulnerable!',
    
    yourChoice: 'Your Choice:',

    rotateDevice: 'Please rotate your device to landscape 🔄'
  },
  ar: {
    start: 'ابدأ اللعبة',
    devMode: 'وضع المطور',
    backToMap: 'العودة إلى الخريطة',
    stepBack: 'رجوع',
    locked: 'مغلق',
    completed: 'مكتمل',
    open: 'مفتوح',
    next: 'استمر',
    challenge: 'الذهاب للتحدي',
    finishLevel: 'إنهاء المرحلة والعودة',
    finishGame: 'إنهاء اللعبة',
    moreInfo: 'معلومات إضافية',
    close: 'إغلاق',
    understood: 'فهمت، إغلاق',
    mapTitle: 'خريطة المدينة',
    gameTitle: 'واحة الضوء',
    loading: 'جار التحميل...',
    closeDev: 'إغلاق وتشغيل',
    correct: 'أحسنت!',
    correctAnswer: 'إجابة صحيحة!',
    tryAgain: 'خطأ! حاول مرة أخرى',
    codeCracked: 'تم كسر الرمز!',
    codeLabel: 'الرمز السري',
    accessDenied: 'تم رفض الوصول: رمز خاطئ',
    question: 'سؤال',
    of: 'من',
    mission: 'مهمة',
    socialMedia: 'وسائل التواصل',
    newsAlert: 'خبر عاجل',
    likes: 'إعجاب',
    
    chooseLocation: 'اختر موقعًا للاستماع إلى السكان',
    visited: '✓ زرت هنا',
    clickToListen: 'اضغط للاستماع',
    finishedListening: 'انتهيت من الاستماع',
    proceedToDecision: 'انتقل إلى القرار',
    visitMore: 'قم بزيارة',
    locations: 'مواقع أخرى',
    
    balloonsInst: '🎈 فجروا فقط البالونات التي تظهر انتهاكاً لحرية التعبير!',
    shieldInst: '🛡️ احمِ من تضرر أمنه الشخصي!',
    
    yourChoice: 'اختيارك:',

    rotateDevice: 'يرجى تدوير الجهاز إلى الوضع الأفقي 🔄'
  }
};

export const t = (key: keyof typeof translations['he'], lang: Language) => {
  return translations[lang][key] || translations['he'][key];
};

export const getDir = (lang: Language) => {
  return lang === 'en' ? 'ltr' : 'rtl';
};