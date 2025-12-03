import { GameNode, NodeType, InteractionType, Language } from './types';

// CENTRALIZED STORAGE KEY
// Bump version to force reset for new content
export const STORAGE_KEY = 'neve_or_game_state_v18_gh_assets';

// --- IMAGES (Updated to use local assets from public/assets folder) ---
const IMG = {
  INTRO: './assets/intro.jpg',
  HUB: './assets/hub.jpg',
  SCHOOL_LIOR: './assets/school_lior.jpg',
  TOWN_SQUARE: './assets/town_square.jpg',
  CITY_HALL: './assets/city_hall.jpg',
  CITY_HALL_SQUARE: './assets/city_hall_sub_sub_square.jpg',
  CITY_HALL_CAFE: './assets/city_hall_sub_sub_cafe.jpg',
  CITY_HALL_NEIGHBORHOOD: './assets/city_hall_sub_sub_neighborhood.jpg',
  CITY_HALL_SCHOOL: './assets/city_hall_sub_sub_school.jpg',
  FREEDOM_INTRO: './assets/city_hall.jpg', // Reusing city hall background as per original design
  SCHOOL_TAMARA: './assets/school_tamara.jpg',
  NEWSPAPER: './assets/newspaper.jpg',
  COURT: './assets/supreme_court.jpg',
};

// Item Images (Keeping on Firebase as they were not listed in the new assets folder)
const ITEMS = {
  TOWN_SQUARE_1: 'https://firebasestorage.googleapis.com/v0/b/neve-or.firebasestorage.app/o/items%2Ftown_square_item_1_1764689621233.jpg?alt=media',
  TOWN_SQUARE_2: 'https://firebasestorage.googleapis.com/v0/b/neve-or.firebasestorage.app/o/items%2Ftown_square_item_2_1764689655281.jpg?alt=media',
  TOWN_SQUARE_3: 'https://firebasestorage.googleapis.com/v0/b/neve-or.firebasestorage.app/o/items%2Ftown_square_item_3_1764689637587.jpg?alt=media',
  TOWN_SQUARE_4: 'https://firebasestorage.googleapis.com/v0/b/neve-or.firebasestorage.app/o/items%2Ftown_square_item_4_1764689673228.jpg?alt=media',
  FREEDOM_1: 'https://firebasestorage.googleapis.com/v0/b/neve-or.firebasestorage.app/o/items%2Fintro_freedom_speech_item_1_1764689708232.jpg?alt=media',
  FREEDOM_2: 'https://firebasestorage.googleapis.com/v0/b/neve-or.firebasestorage.app/o/items%2Fintro_freedom_speech_item_2_1764689735483.jpg?alt=media',
  FREEDOM_3: 'https://firebasestorage.googleapis.com/v0/b/neve-or.firebasestorage.app/o/items%2Fintro_freedom_speech_item_3_1764689722534.jpg?alt=media',
  FREEDOM_4: 'https://firebasestorage.googleapis.com/v0/b/neve-or.firebasestorage.app/o/items%2Fintro_freedom_speech_item_4_1764689748089.jpg?alt=media',
};

// NOTE: Only the first scenario (school_lior) is unlocked initially.
// The rest are isLocked: true.

const HE_NODES: GameNode[] = [
    {
      id: 'HUB_CONFIG',
      title: 'הגדרות מפה',
      type: NodeType.HUB,
      isLocked: false,
      isCompleted: false,
      data: {
        description: '',
        backgroundImage: IMG.HUB,
        dialog: [],
        interactionType: InteractionType.NONE,
        decisionQuestion: '',
        options: []
      }
    },
    {
      id: 'intro',
      title: 'פתיח - נווה אור',
      type: NodeType.INTRO,
      isLocked: false,
      isCompleted: false,
      data: {
        description: 'ברוכים הבאים לנווה אור, עיר דיגיטלית שבה כל החלטה שלכם משפיעה על חיי התושבים בה. כאן תגלו שזכויות אדם לא תמיד מתממשות בקלות. במהלך המשחק תיכנסו לנעליהם של תלמידים, עיתונאים, ושופטים. הבחירות שלכם יקבעו אם הזכות תוגן, תופר, או תזכה באיזון הראוי. אין "פתרון מושלם" – יש אחריות וחשיבה ביקורתית. האם תצליחו למצוא את האיזון?',
        backgroundImage: IMG.INTRO,
        decisionQuestion: 'האם תצליחו למצוא את האיזון?',
        options: [{ id: 'start', text: 'התחל את המשחק', feedback: 'המשחק מתחיל עכשיו.' }],
        dialog: [],
        interactionType: InteractionType.NONE
      }
    },
    {
      id: 'school_lior',
      title: '1. הבחירה של ליאור',
      type: NodeType.SCENARIO,
      isLocked: false, // FIRST LEVEL UNLOCKED
      isCompleted: false,
      coordinates: { x: 15, y: 28 },
      data: {
        description: 'ליאור מגלה שבמבנה בית הספר שלו יש סדקים מסוכנים בתקרה, עם סכנת קריסה וודאית. הוא מדווח למנהל, אבל המנהל אומר: "אין תקציב לתיקונים עכשיו".',
        backgroundImage: IMG.SCHOOL_LIOR,
        dialog: [
           { id: '1', speaker: 'ליאור', text: 'המנהל, התקרה מתפוררת! זה ממש מסוכן.', mood: 'concerned' },
           { id: '2', speaker: 'המנהל', text: 'אני יודע, אבל אין תקציב לתיקונים כרגע. יהיה בסדר.', mood: 'neutral' }
        ],
        interactionType: InteractionType.MULTIPLE_CHOICE,
        interactionData: {
          question: 'איזו זכות מופרת במקרה הזה?',
          answers: [
            { id: '1', text: 'הזכות לחינוך', correct: false },
            { id: '2', text: 'הזכות לחיים ולביטחון אישי', correct: true },
            { id: '3', text: 'חופש הביטוי', correct: false },
            { id: '4', text: 'הזכות לפרטיות', correct: false }
          ]
        },
        decisionQuestion: 'ליאור צריך לקבל החלטה: איך הוא יגן על הזכות לחיים ולביטחון האישי של תלמידי בית הספר?',
        options: [
          { id: 'opt1', text: 'לתעד את הסדקים ולפנות למשרד החינוך או לרשות המקומית.', feedback: 'יתרון: פנייה לגורם בכיר שמחויב לבטיחות. חיסרון: התהליך עלול להיות איטי.' },
          { id: 'opt2', text: 'להתארגן עם עוד תלמידים ולהחתים עצומה, ולהציג אותה למנהל.', feedback: 'יתרון: כוח קבוצתי מייצר לחץ. חיסרון: המנהל עלול לכעוס או להתעלם.' },
          { id: 'opt3', text: 'להתקשר להורים וליידע אותם על הסכנה.', feedback: 'יתרון: הורים יכולים לפעול במהירות ולעיתים יותר משפיעים. חיסרון: זה יכול ליצור עימות בין ההורים לבית הספר.' },
          { id: 'opt4', text: 'לא לעשות כלום – "אולי הסדקים לא באמת מסוכנים כל כך".', feedback: 'יתרון: אף אחד לא מתעצבן. חיסרון: הסכנה נשארת, וייתכן שתקרה תאונה.' }
        ],
        moreInfoTitle: 'הזכות לחיים ולביטחון',
        moreInfoContent: 'במצבים שיש בהם סכנה ממשית לחיים או לביטחון האישי, פעולה מהירה היא הכרחית. כשמדובר בבטיחות, הזמן הוא גורם מציל חיים. התגובה המהירה היא ההבדל בין תאונה לבין מניעה.'
      }
    },
    {
      id: 'town_square',
      title: '2. הגנה על המרחב',
      type: NodeType.SCENARIO,
      isLocked: true, // LOCKED
      isCompleted: false,
      coordinates: { x: 35, y: 65 },
      data: {
        description: 'מטרה: לזהות מתי הביטחון האישי של אדם נפגע ולבחור מה המדינה צריכה לעשות. גררו את "המגן" רק לסיטואציות שמבטאות פגיעה בביטחון האישי.',
        backgroundImage: IMG.TOWN_SQUARE,
        dialog: [],
        interactionType: InteractionType.DRAG_SHIELD,
        interactionData: {
          items: [
            { id: '1', text: 'ילד עם טלפון שמאוימים עליו ברשת', isDanger: true, image: ITEMS.TOWN_SQUARE_1 },
            { id: '2', text: 'אדם הולך לתומו ברחוב', isDanger: false, image: ITEMS.TOWN_SQUARE_2 },
            { id: '3', text: 'אדם מותקף ברחוב באלימות', isDanger: true, image: ITEMS.TOWN_SQUARE_3 },
            { id: '4', text: 'אזרח משוחח עם שוטר בצורה נעימה', isDanger: false, image: ITEMS.TOWN_SQUARE_4 }
          ]
        },
        decisionQuestion: 'האם הגנת על כולם?',
        options: [{ id: 'ok', text: 'המשך', feedback: 'ביטחון אישי הוא לא מותרות – הוא זכות בסיסית שכל מדינה חייבת להבטיח.' }],
        moreInfoTitle: 'ביטחון אישי',
        moreInfoContent: 'הזכות לביטחון אישי כוללת: הגנה מפני אלימות, תקיפה או איום, שמירה על פרטיות ומניעת פגיעה גופנית ונפשית. זוהי אחריות המדינה.'
      }
    },
    {
      id: 'city_hall',
      title: '3. העיר שמצלמת הכול',
      type: NodeType.SCENARIO,
      isLocked: true, // LOCKED
      isCompleted: false,
      coordinates: { x: 50, y: 25 },
      data: {
        description: 'נווה אור מתמודדת עם עלייה בפשיעה. ראש העיר שוקל להוסיף אלפי מצלמות AI עם זיהוי פנים. הוא מבקש ממך, היועץ לזכויות אדם, לדבר עם התושבים לפני שתמליץ.',
        backgroundImage: IMG.CITY_HALL,
        dialog: [
          { id: '1', speaker: 'ראש העיר', text: 'אני רוצה שתדבר עם שלושה תושבים ותשמע מהם איך הם מרגישים. רק אחר כך תמליץ לי מה נכון לעשות.', mood: 'neutral' }
        ],
        interactionType: InteractionType.CITY_HALL_SUB_LOCATIONS,
        subScenes: [
          {
            id: 'sub_square',
            title: 'הכיכר המרכזית',
            icon: '⛲',
            backgroundImage: IMG.CITY_HALL_SQUARE,
            dialog: [
              { id: '1', speaker: 'תושב מבוגר', text: 'פעם פחדתי לצאת מהבית בלילה. מאז שהתקינו מצלמות, אני סוף סוף מרגיש בטוח. אם יש פושע – יתפסו אותו מיד. זה שווה הכול.', mood: 'happy' },
              { id: '2', speaker: 'מידע', text: 'רמז לתלמיד: הזכות לביטחון אישי כוללת הגנה מפני סכנה ופגיעה בגוף ובחיים.', mood: 'neutral' }
            ]
          },
          {
            id: 'sub_cafe',
            title: 'בית קפה',
            icon: '☕',
            backgroundImage: IMG.CITY_HALL_CAFE,
            dialog: [
              { id: '1', speaker: 'צעירה עם מחשב', text: 'אתה מבין? אני לא עושה כלום רע, אבל אני מרגישה שמישהו תמיד צופה בי. כל תנועה שלי מוקלטת. ככה לא מרגישים חופשיים. ביטחון? אולי. אבל גם פחד.', mood: 'concerned' },
              { id: '2', speaker: 'מידע', text: 'רמז לתלמיד: הזכות לפרטיות מגנה על האדם מפני מעקב וחדירה לחייו האישיים.', mood: 'neutral' }
            ]
          },
          {
            id: 'sub_neighborhood',
            title: 'שכונת מגורים',
            icon: '🏘️',
            backgroundImage: IMG.CITY_HALL_NEIGHBORHOOD,
            dialog: [
              { id: '1', speaker: 'נער', text: 'יש לי חבר אתיופי. הוא אומר שכל פעם שהוא עובר ליד מצלמה, הוא חושש שהמערכת תחשוב שהוא חשוד.', mood: 'concerned' },
              { id: '2', speaker: 'מידע', text: 'רמז לתלמיד: טכנולוגיית זיהוי פנים של הבינה המלאכותית לא מושלמת ויכולה להפלות בגלל הטיות.', mood: 'neutral' }
            ]
          },
          {
            id: 'sub_school',
            title: 'בית ספר',
            icon: '🏫',
            backgroundImage: IMG.CITY_HALL_SCHOOL,
            dialog: [
              { id: '1', speaker: 'תלמיד', text: 'אם היו פה שוטרים שמכירים אותנו, כמו מפקחים קבועים מהקהילה, היינו מרגישים יותר בטוחים בלי מצלמות. ביטחון זה לא רק מי שמצלם אותך, זה גם מי שמקשיב לך.', mood: 'neutral' },
              { id: '2', speaker: 'מידע', text: 'רמז לתלמיד: ביטחון אמיתי מבוסס גם על אמון ושיתוף פעולה בין האזרחים למדינה.', mood: 'neutral' }
            ]
          }
        ],
        decisionQuestion: 'מהו הפתרון שיבטיח ביטחון אמיתי לתושבי העיר "נווה אור"?',
        options: [
          { id: '1', text: 'להציב מצלמות חכמות בכל העיר', feedback: 'שיעור הפשיעה יורד, אבל רבים מהתושבים מרגישים שמאבדים את החופש. מסר: ביטחון פיזי הושג, אך הפרטיות נפגעה.' },
          { id: '2', text: 'להשקיע בשיטור קהילתי ובנוכחות אנושית', feedback: 'יש נוכחות אנושית וחיבור קהילתי, אבל מספר מקרי הפשיעה לא יורד משמעותית. מסר: ביטחון חברתי עולה, אך חסרה הגנה טכנולוגית.' },
          { id: '3', text: 'לשלב בין מצלמות בפיקוח הדוק לשיטור קהילתי', feedback: 'מצלמות מוצבות רק במוקדי סיכון, תחת פיקוח ושקיפות. שיעור הפשיעה יורד, ותחושת החופש נשמרת. האיזון בין ביטחון לפרטיות יוצר ביטחון אמיתי.' }
        ],
        moreInfoTitle: 'האיזון הראוי',
        moreInfoContent: `האיזון הראוי בין הזכות לביטחון אישי לבין הזכות לפרטיות מחייב בחינה של מידתיות והכרחיות השימוש באמצעי המעקב.

שתי הזכויות הן זכויות יסוד מוכרות במשפט הישראלי, המעוגנות בפסיקת בית המשפט העליון ובחוק-יסוד: כבוד האדם וחירותו.
מצד אחד, למדינה אחריות להגן על חיי אזרחיה ולשמור על ביטחונם; מצד שני, הזכות לפרטיות מגנה על האדם מפני חדירה למרחב חייו האישיים ומעקב בלתי סביר מצד השלטון.
לפיכך, שימוש במצלמות חכמות וזיהוי פנים יכול להיות מוצדק רק אם הוא עומד בעקרונות הבאים:
תכלית ראויה –  המעקב נועד למנוע פשיעה ממשית או סכנה ביטחונית ולא לשימוש כללי או פוליטי.
מידתיות –  יש להשתמש באמצעי הפוגעני פחות האפשרי (למשל, טשטוש פנים של אנשים שאינם חשודים).
הגבלת שימוש –  המידע יישמר רק לזמן הדרוש למטרה לשמה נאסף ולא יועבר לגורמים לא מוסמכים.
פיקוח ושקיפות –  נדרש מנגנון פיקוח עצמאי ודיווח לציבור על היקף השימוש במצלמות.
במילים אחרות,  ביטחון הציבור אינו גובר אוטומטית על הזכות לפרטיות, אלא רק במידה הדרושה והמידתית לשם שמירה אמיתית על שלום הציבור, תוך שמירה על ערכי הדמוקרטיה וזכויות האדם.`
      }
    },
    {
      id: 'intro_freedom_speech',
      title: '4. הקול שלי',
      type: NodeType.SCENARIO,
      isLocked: true, // LOCKED
      isCompleted: false,
      coordinates: { x: 72, y: 56 },
      data: {
        description: 'המשימה: פוצצו רק את הבלונים שמראים פגיעה בחופש הביטוי!',
        backgroundImage: IMG.FREEDOM_INTRO, 
        dialog: [],
        interactionType: InteractionType.BALLOONS,
        interactionData: {
          items: [
            { id: '1', text: 'מותר לי להביע דעה גם אם היא לא פופולרית', isCorrect: false, image: ITEMS.FREEDOM_1 },
            { id: '2', text: 'אסור לי לדבר נגד הממשלה', isCorrect: true, image: ITEMS.FREEDOM_2 },
            { id: '3', text: 'אסור לי להעביר ביקורת על מוסדות המדינה', isCorrect: true, image: ITEMS.FREEDOM_3 },
            { id: '4', text: 'מותר לי לכתוב ביקורת בעיתון', isCorrect: false, image: ITEMS.FREEDOM_4 }
          ]
        },
        decisionQuestion: 'סיימתם את המשימה',
        options: [{ id: 'ok', text: 'המשך', feedback: 'הקול שלך חשוב – שמור עליו, השתמש בו באחריות. חופש הביטוי אינו מוחלט (אסור להסית או לפגוע בשם הטוב), אבל הוא זכות יסוד.' }],
        moreInfoTitle: 'חופש הביטוי',
        moreInfoContent: 'חופש הביטוי כולל את הזכות לומר דעה, להביע ביקורת ולפרסם מידע, ולהפגין. הגבלות מותרות רק כשהביטוי מסכן חיים או פוגע בזכויות אחרות בצורה לא מידתית.'
      }
    },
    {
      id: 'school_tamara',
      title: '5. מחאת התלמידים',
      type: NodeType.SCENARIO,
      isLocked: true, // LOCKED
      isCompleted: false,
      coordinates: { x: 88, y: 35 },
      data: {
        description: 'תמרה, תלמידת י\', כותבת פוסט בפייסבוק נגד המנהלת שביטלה את מועצת התלמידים ללא התייעצות. היא מכנה אותה "דיקטטורית".',
        backgroundImage: IMG.SCHOOL_TAMARA,
        digitalContent: {
          type: 'POST',
          author: 'תמרה',
          content: 'המנהלת שלנו דיקטטורית ופוגעת בחופש הביטוי! ביטלה את מועצת בלי לשאול אף אחד. איך אנחנו אמורים ללמוד דמוקרטיה כשאין לנו קול?',
          likes: 150
        },
        dialog: [
          { id: '1', speaker: 'המנהלת גב\' כהן', text: 'תמרה, קראת לי דיקטטורית בפני מאות אנשים! זה פוגע בכבודי ובסמכותי.', mood: 'angry' },
          { id: '2', speaker: 'תמרה', text: 'אבל יש לי חופש ביטוי! הבעתי דעה על מדיניות שפוגעת בנו.', mood: 'concerned' },
          { id: '3', speaker: 'המחנך דני', text: 'שתיכן צודקות חלקית. מותר לבקר, אבל "דיקטטורית" זו תקיפה אישית.', mood: 'neutral' }
        ],
        interactionType: InteractionType.NONE,
        // PHASE 1
        decisionQuestion: 'חלק א\': מה צריך לקרות עם תמרה?',
        options: [
          { id: '1', text: 'להשעות את תמרה מיד! - אי אפשר לקרוא למנהלת \'דיקטטורית\' בפומבית.', feedback: 'תגובה חריפה מדי. לתלמידים יש זכות לחופש ביטוי.' },
          { id: '2', text: 'תמרה יכולה לבקר את ההחלטה, אבל צריכה לשנות לניסוח ביקורתי שלא מעליב.', feedback: 'נכון. חופש הביטוי חשוב אך אינו מוחלט. יש לשמור על כבוד האדם.' },
          { id: '3', text: 'תמרה יכולה לכתוב מה שהיא רוצה - חופש הביטוי מוחלט.', feedback: 'לא מדויק. חופש הביטוי אינו מתיר לשון הרע.' }
        ],
        moreInfoTitle: 'זכויות התלמיד - חופש הביטוי',
        moreInfoContent: 'אמנת זכויות הילד (סעיף 13) וחוק יסוד כבוד האדם מעניקים לתלמידים חופש ביטוי, אך הוא כפוף לשמירה על כבודם של אחרים.',
        
        // PHASE 2 (Secondary Dilemma)
        secondaryDecisionQuestion: 'חלק ב\': האם למנהלת סמכות לבטל את המועצה?',
        secondaryOptions: [
           { id: '1', text: 'כן, המנהלת רשאית לבטל - היא הסמכות הבכירה בבית הספר', feedback: 'לא נכון. חוק זכויות התלמיד מגן על המועצה.' },
           { id: '2', text: 'המנהלת יכולה להגביל פעילות, אבל חוק זכויות התלמיד אוסר לבטל אותה', feedback: 'תשובה נכונה! חוק זכויות התלמיד מחייב קיום מועצת תלמידים.' },
           { id: '3', text: 'המנהלת יכולה לבטל אם יש רוב של תלמידים שמסמיכים', feedback: 'לא מדויק. החוק מחייב את קיום המועצה ללא קשר לרוב רגעי.' }
        ],
        secondaryMoreInfoTitle: 'חוק זכויות התלמיד - סעיף 13',
        secondaryMoreInfoContent: 'חוק זכויות התלמיד (סעיף 13) קובע שמוסד חינוך יעודד הקמת מועצת תלמידים ולא יעשה כל פעולה למנוע את הקמתה. אמנת זכויות הילד מעניקה לילדים זכות השתתפות בהחלטות. לפיכך, ביטול מועצת התלמידים מהווה הפרת חוק. המנהל רשאי לקבוע תקנון פעילות, אך אינו רשאי לבטל אותה לחלוטין.'
      }
    },
    {
      id: 'newspaper_office',
      title: '6. מערכת העיתון',
      type: NodeType.SCENARIO,
      isLocked: true, // LOCKED
      isCompleted: false,
      coordinates: { x: 20, y: 70 },
      data: {
        description: 'מערכת העיתון "הדופק" פרסמה כתבה: "הממשלה דוחקת עיתונאים ומסתירה מידע". שר הפנים הורה לסגור את העיתון ל-10 ימים בטענה לפגיעה בביטחון.',
        backgroundImage: IMG.NEWSPAPER,
        digitalContent: {
          type: 'ARTICLE',
          title: 'הדופק',
          content: 'חשיפה: הממשלה דוחקת עיתונאים עצמאיים ומסתירה מידע קריטי מהציבור.',
          author: 'מערכת הדופק'
        },
        dialog: [
          { id: '1', speaker: 'עורך העיתון', text: 'קיבלנו הודעה על סגירה מיידית! מה עושים?', mood: 'concerned' },
          { id: '2', speaker: 'כתבת', text: 'חייבים להילחם בזה. זו סתימת פיות.', mood: 'angry' }
        ],
        interactionType: InteractionType.NONE,
        decisionQuestion: 'איך תגיבו כצוות העיתון?',
        options: [
          { id: '1', text: 'לפרסם פוסט חריף נוסף: "לא ישתיקו אותנו!"', feedback: 'זה עלול להחמיר את המצב.' },
          { id: '2', text: 'לפנות לעורך דין ולהגיש עתירה לבג"ץ', feedback: 'צעד נכון. הדרך הדמוקרטית להתמודד עם החלטה שלטונית.' },
          { id: '3', text: 'להוריד את הכתבה ולהתנצל', feedback: 'כניעה מהירה מדי שפוגעת בחופש העיתונות.' }
        ],
        moreInfoTitle: 'חופש העיתונות',
        moreInfoContent: 'חופש העיתונות הוא נגזרת של חופש הביטוי. המקרה מזכיר את פרשת "קול העם" (1953) שבה בוטל צו סגירה לעיתון.'
      }
    },
    {
      id: 'supreme_court',
      title: '7. בית המשפט',
      type: NodeType.SCENARIO,
      isLocked: true, // LOCKED
      isCompleted: false,
      coordinates: { x: 50, y: 85 },
      data: {
        description: 'אתם עכשיו שופטי בג"ץ. העיתון עתר נגד שר הפנים.',
        backgroundImage: IMG.COURT,
        dialog: [
          { id: '1', speaker: 'נציג הממשלה', text: 'המדינה חייבת לשמור על ביטחון הציבור. המאמר הזה עלול לגרום למהומות.', mood: 'neutral' },
          { id: '2', speaker: 'עורך העיתון', text: 'אין כאן סכנה אמיתית, רק ביקורת. בדמוקרטיה מותר לבקר את השלטון.', mood: 'neutral' }
        ],
        interactionType: InteractionType.NONE,
        decisionQuestion: 'כשופטים, מה תהיה פסיקתכם?',
        options: [
          { id: '1', text: 'לבטל את הצו – חופש הביטוי גובר', feedback: 'נכון מאוד. זהו העיקרון שנקבע בבג"ץ קול העם (1953).' },
          { id: '2', text: 'לאשר את הצו – עדיף למנוע סכנה', feedback: 'זו גישה מחמירה שנדחתה בפסיקה ההיסטורית.' },
          { id: '3', text: 'לצמצם את הצו לסגירה קצרה יותר', feedback: 'עדיין מדובר בפגיעה קשה ולא מידתית.' }
        ],
        moreInfoTitle: 'מבחן הודאות הקרובה',
        moreInfoContent: 'בפסק דין "קול העם" קבע בית המשפט: אסור להגביל חופש ביטוי אלא אם קיימת "ודאות קרובה לפגיעה ממשית בביטחון המדינה".'
      }
    },
    {
      id: 'quiz_finale',
      title: '8. פיצוח הקוד',
      type: NodeType.QUIZ,
      isLocked: true, // LOCKED
      isCompleted: false,
      coordinates: { x: 85, y: 70 },
      data: {
        description: 'ענו על השאלות כדי לקבל את הספרות לקוד הסודי ולסיים את המשחק.',
        dialog: [],
        interactionType: InteractionType.CODE_CRACKER,
        interactionData: {
          questions: [
            { 
              id: 'q1', 
              question: 'באיזו שנה הייתה הכרזת האמנה בדבר זכויות האדם?', 
              options: [{text: '1947', value: 0}, {text: '1967', value: 0}, {text: '1948', value: 3}, {text: '1946', value: 0}],
              explanation: '1948 - הספרה לקוד היא 3'
            },
            { 
              id: 'q2', 
              question: 'באיזו שנה חוקק חוק יסוד כבוד האדם וחירותו?', 
              options: [{text: '1996', value: 0}, {text: '1992', value: 2}, {text: '1987', value: 0}, {text: '1990', value: 0}],
              explanation: '1992 - הספרה לקוד היא 2'
            },
            { 
              id: 'q3', 
              question: 'מדינת ישראל היא צד ל-? אמנות מרכזיות בתחומי זכויות אדם', 
              options: [{text: '9', value: 0}, {text: '5', value: 0}, {text: '8', value: 0}, {text: '7', value: 4}],
              explanation: 'הספרה לקוד היא 4. מדינת ישראל הינה צד לשבע האמנות המרכזיות בתחומי זכויות אדם (בנושאי זכויות אזרחיות ופוליטיות, זכויות כלכליות, חברתיות ותרבותיות, ביעור כל צורות האפליה הגזעית, ביעור כל צורות האפליה נגד נשים, איסור עינויים, זכויות ילדים ושוויון זכויות לאנשים עם מוגבלויות).'
            },
            { 
              id: 'q4', 
              question: 'באיזה חודש מציינים את היום הבינלאומי למאבק בגזענות?', 
              options: [{text: 'דצמבר', value: 0}, {text: 'מרץ', value: 2}, {text: 'פברואר', value: 0}, {text: 'אוגוסט', value: 0}],
              explanation: 'מרץ - הספרה לקוד היא 2'
            }
          ]
        },
        decisionQuestion: 'הקוד פוצח!',
        options: [], 
        moreInfoTitle: 'כל הכבוד! פיצחתם',
        moreInfoContent: 'זכויות האדם הן זכויות יסוד שמבטיחות שכל אחד ואחת יחיו בכבוד, חופש ובביטחון. הן מאפשרות לנו לחיות בחברה שוויונית וצודקת, לשמור על חירותנו ולכבד את האחר.\n\nלכן חשוב להמשיך ללמוד על זכויות האדם, להבין את האתגרים שבהגנה עליהן, ולהיאבק כדי שהן ימומשו לכולם – תמיד, בכל מקום. כל פעולה למען זכויות האדם עושה את העולם שלנו צודק ובטוח יותר.'
      }
    }
];

const AR_NODES: GameNode[] = [
    {
      id: 'HUB_CONFIG',
      title: 'إعدادات الخريطة',
      type: NodeType.HUB,
      isLocked: false,
      isCompleted: false,
      data: {
        description: '',
        backgroundImage: IMG.HUB,
        dialog: [],
        interactionType: InteractionType.NONE,
        decisionQuestion: '',
        options: []
      }
    },
    {
      id: 'intro',
      title: 'مقدمة - نيفي أور',
      type: NodeType.INTRO,
      isLocked: false,
      isCompleted: false,
      data: {
        description: 'أهلًا وسهلًا بكم في واحة الضوء/نفيه أور، مدينة ديجيتاليّة حيث كلّ قرار لكم فيها يؤثّر على حياة سكّانها. هنا ستكتشفون أن حقّوق الإنسان لا تتحقّق دائمًا بسهولة. خلال اللعبة، ستلعبون دور طلّاب وصحفيين وقُضاة. ستحدّد اختياراتكم ما إذا كان سيتمّ حماية الحقّ أو انتهاكه. لا يوجد "حلّ مثاليّ" بل مسؤوليّة وتفكير نقديّ. هل ستتمكّنون من إيجاد التوازن؟',
        backgroundImage: IMG.INTRO,
        decisionQuestion: 'هل ستتمكّنون من إيجاد التوازن؟',
        options: [{ id: 'start', text: 'ابدأ اللعبة', feedback: 'الآن نبدأ اللعبة.' }],
        dialog: [],
        interactionType: InteractionType.NONE
      }
    },
    {
      id: 'school_lior',
      title: '1. خيار أمير',
      type: NodeType.SCENARIO,
      isLocked: false,
      isCompleted: false,
      coordinates: { x: 15, y: 28 },
      data: {
        description: 'يكتشف أمير أن في مبنى مدرسته تصدّعات خطيرة في السقف، مع احتماليّة مؤكّدة لحدوث انهيار. أبلغ المدير، لكن المدير قال: "لا توجد ميزانيّة للإصلاحات الآن".',
        backgroundImage: IMG.SCHOOL_LIOR,
        dialog: [
           { id: '1', speaker: 'أمير', text: 'حضرة المدير، هناك تصدّعات خطيرة في السقف! هذا مخيف حقًا.', mood: 'concerned' },
           { id: '2', speaker: 'المدير', text: 'أعرف يا أمير. لكن لا توجد ميزانيّة للإصلاحات حاليًا. سيكون كل شيء على ما يرام.', mood: 'neutral' }
        ],
        interactionType: InteractionType.MULTIPLE_CHOICE,
        interactionData: {
          question: 'أي حقّ يُنتهك هُنا؟',
          answers: [
            { id: '1', text: 'الحقّ في التعليم', correct: false },
            { id: '2', text: 'الحقّ في الحياة والأمن الشخصيّ', correct: true },
            { id: '3', text: 'حرّيّة التعبير', correct: false },
            { id: '4', text: 'الحقّ في الخصوصيّة', correct: false }
          ]
        },
        decisionQuestion: 'على أمير اتّخاذ قرار: كيف سيحمي حقّ طلاب المدرسة في الحياة والأمن الشخصيّ؟',
        options: [
          { id: 'opt1', text: 'توثيق التصدّعات والتواصل مع وزارة التعليم أو السلطة المحلية.', feedback: 'الفضيلة: التواصل مع مسؤول كبير ملتزم بالسلامة. النقيصة: قد تكون العمليّة بطيئة.' },
          { id: 'opt2', text: 'تنظيم الطلاب وتوقيع عريضة وتقديمها للمدير.', feedback: 'الفضيلة: قوّة المجموعة تُولّد ضغطًا. النقيصة: قد يغضب المدير أو يتجاهل.' },
          { id: 'opt3', text: 'الاتصال بأولياء الأمور وإبلاغهم بالخطر.', feedback: 'الفضيلة: يمكن لأولياء الأمور التصرّف بسرعة وتأثيرهم قوي. النقيصة: قد يُؤدّي ذلك إلى صراع بين الأهل والمدرسة.' },
          { id: 'opt4', text: 'عدم القيام بأيّ شيء - "ربما التشققات ليست خطيرة جداً".', feedback: 'الفضيلة: لا أحد ينزعج. النقيصة: يبقى الخطر قائمًا، وقد يقع حادث.' }
        ],
        moreInfoTitle: 'الحق في الحياة والأمن',
        moreInfoContent: 'في الحالات التي يكون فيها خطر حقّيقيّ على الحياة أو السلامة الشخصيّة، يكون اتّخاذ إجراء سريع أمرًا ضروريًّا. عندما يتعلّق الأمر بالسلامة، فإن الوقت عامل يُنقذ الحياة. الاستجابة السريعة هي الفرق بين الحادث وبين الوقاية.'
      }
    },
    {
      id: 'town_square',
      title: '2. حماية الحيّز',
      type: NodeType.SCENARIO,
      isLocked: true,
      isCompleted: false,
      coordinates: { x: 35, y: 65 },
      data: {
        description: 'الهدف: تحديد حالات انتهاك السلامة الشخصيّة واختيار الإجراءات. استخدم "الدرع" فقط في المواقف التي تُمثل انتهاكًا للسلامة الشخصيّة.',
        backgroundImage: IMG.TOWN_SQUARE,
        dialog: [],
        interactionType: InteractionType.DRAG_SHIELD,
        interactionData: {
          items: [
            { id: '1', text: 'طفل يحمل هاتفًا ويتعرّض للتهديد عبر الإنترنت', isDanger: true, image: ITEMS.TOWN_SQUARE_1 },
            { id: '2', text: 'شخص يمشي في الشارع', isDanger: false, image: ITEMS.TOWN_SQUARE_2 },
            { id: '3', text: 'شخص يتعرّض للاعتداء في الشارع', isDanger: true, image: ITEMS.TOWN_SQUARE_3 },
            { id: '4', text: 'مواطن يحميه ضابط شرطة', isDanger: false, image: ITEMS.TOWN_SQUARE_4 }
          ]
        },
        decisionQuestion: 'هل قمت بحماية الجميع؟',
        options: [{ id: 'ok', text: 'استمر', feedback: 'السلامة الشخصيّة ليست ترفًا، بل حقّ أساسيّ يجب على كلّ دولة ضمانه.' }],
        moreInfoTitle: 'السلامة الشخصية',
        moreInfoContent: 'يشمل الحقّ في السلامة الشخصيّة: الحماية من العنف أو الاعتداء أو التهديد، الحفاظ على الخصوصيّة ومنع الأذى الجسديّ والنفسيّ.'
      }
    },
    {
      id: 'city_hall',
      title: '3. البلدية',
      type: NodeType.SCENARIO,
      isLocked: true,
      isCompleted: false,
      coordinates: { x: 50, y: 25 },
      data: {
        description: 'تواجه مدينة "واحة الضوء" زيادة في الجريمة. يفكّر رئيس البلدية في تركيب كاميرات ذكيّة (AI). يطلب منك كمستشار حقوق الإنسان مساعدته في القرار.',
        backgroundImage: IMG.CITY_HALL,
        dialog: [
          { id: '1', speaker: 'رئيس البلدية', text: 'أريدك أن تتحدّث/ي إلى ثلاثة من السكان وتستمع إلى آرائهم. عندها فقط ستنصحني بما هو الصواب فعله؟', mood: 'neutral' }
        ],
        interactionType: InteractionType.CITY_HALL_SUB_LOCATIONS,
        subScenes: [
          {
            id: 'sub_square',
            title: 'الساحة المركزية',
            icon: '⛲',
            backgroundImage: IMG.CITY_HALL_SQUARE,
            dialog: [
              { id: '1', speaker: 'مواطن مُسنّ', text: 'من قبل، كنت أخشى مغادرة المنزل ليلًا. منذ أن ركّبوا الكاميرات، أشعر بالأمان أخيرًا. في حال كان هناك مجرم، فسيتمّ القبض عليه فورًا.', mood: 'happy' },
              { id: '2', speaker: 'معلومة', text: 'إشارة للطالب: يشمل الحقّ في الأمن الشخصيّ الحماية من المخاطر والأذى الجسديّ والنفسيّ.', mood: 'neutral' }
            ]
          },
          {
            id: 'sub_cafe',
            title: 'المقهى',
            icon: '☕',
            backgroundImage: IMG.CITY_HALL_CAFE,
            dialog: [
              { id: '1', speaker: 'شابّة', text: 'أنا لا أفعل شيئًا خاطئًا، لكنني أشعر دائمًا وكأن أحدهم يراقبني. كلّ حركة أقوم بها تُسجَّل. هذا ليس شعورًا بالحرّيّة.', mood: 'concerned' },
              { id: '2', speaker: 'معلومة', text: 'إشارة للطالب: الحقّ في الخصوصيّة يحمي الشخص من المراقبة والتطفّل على حياته الشخصيّة.', mood: 'neutral' }
            ]
          },
          {
            id: 'sub_neighborhood',
            title: 'حيّ سكنيّ',
            icon: '🏘️',
            backgroundImage: IMG.CITY_HALL_NEIGHBORHOOD,
            dialog: [
              { id: '1', speaker: 'فتى', text: 'لي صديق إثيوبيّ. يقول إنه في كلّ مرّة يمرّ فيها من أمام كاميرا، يخشى أن يظن "النظام" أنه مشتبه به.', mood: 'concerned' },
              { id: '2', speaker: 'معلومة', text: 'إشارة للطالب: تقنيّة التعرّف على الوجه بالذكاء الاصطناعيّ ليست مثاليّة، وقد تُميِّز بسبب التحيّز.', mood: 'neutral' }
            ]
          },
          {
            id: 'sub_school',
            title: 'المدرسة',
            icon: '🏫',
            backgroundImage: IMG.CITY_HALL_SCHOOL,
            dialog: [
              { id: '1', speaker: 'طالب', text: 'لو كان هناك عناصر شرطة يعرفوننا، مثل مراقبين من أبناء المجتمع، لشعرنا بأمان أكبر بدون كاميرات. الأمن يشمل من يستمع إليك.', mood: 'neutral' },
              { id: '2', speaker: 'معلومة', text: 'إشارة للطالب: الأمن الحقّيقيّ يرتكز، أيضًا، على الثقة والتعاون بين المواطنين والدولة.', mood: 'neutral' }
            ]
          }
        ],
        decisionQuestion: 'ما الحلّ الذي يضمن أمنًا حقّيقيًّا لسكّان المدينة؟',
        options: [
          { id: '1', text: 'وضع كاميرات ذكيّة في جميع أنحاء المدينة', feedback: 'معدّل الجريمة ينخفض، لكن السكان يشعرون بفقدان حرّيتهم. الأمن الماديّ تحقق، لكن الخصوصيّة مُهدّدة.' },
          { id: '2', text: 'الاستثمار في الشرطة الجماهيريّة', feedback: 'الأمن الاجتماعيّ يتزايد، لكن الحمايّة التكنولوجيّة غائبة.' },
          { id: '3', text: 'دمج الكاميرات الخاضعة للإشراف مع الشرطة', feedback: 'تُوضع الكاميرات في مناطق الخطر فقط تحت إشراف. تنخفض الجريمة، ويبقى الشعور بالحرّيّة. التوازن يخلق أمنًا حقيقيًّا.' }
        ],
        moreInfoTitle: 'التوازن المناسب',
        moreInfoContent: `يتطلب التوازن السليم بين الحق في الأمن الشخصي والحق في الخصوصية فحص تناسب وضرورة استخدام وسائل المراقبة.

كلا الحقين هما حقان أساسيان معترف بهما في القانون الإسرائيلي، ومرسخان في أحكام المحكمة العليا وفي قانون أساس: كرامة الإنسان وحريته.
من ناحية، تقع على عاتق الدولة مسؤولية حماية حياة مواطنيها والحفاظ على أمنهم؛ ومن ناحية أخرى، يحمي الحق في الخصوصية الإنسان من التدخل في حيز حياته الشخصية والمراقبة غير المعقولة من قبل السلطة.
لذلك، لا يمكن تبرير استخدام الكاميرات الذكية والتعرف على الوجه إلا إذا استوفى المبادئ التالية:
غاية مناسبة – المراقبة تهدف لمنع جريمة فعلية أو خطر أمني وليس للاستخدام العام أو السياسي.
التناسب – يجب استخدام الوسيلة الأقل ضرراً قدر الإمكان (على سبيل المثال، تشويش وجوه الأشخاص غير المشتبه بهم).
تقييد الاستخدام – سيتم حفظ المعلومات فقط للوقت اللازم للغرض الذي جمعت من أجله ولن يتم نقلها إلى جهات غير مصرح لها.
الرقابة والشفافية – مطلوب آلية رقابة مستقلة وتقديم تقارير للجمهور حول نطاق استخدام الكاميرات.
بكلمات أخرى، الأمن العام لا يتغلب تلقائياً على الحق في الخصوصية، بل فقط بالقدر اللازم والمتناسب للحفاظ الحقيقي على السلامة العامة، مع الحفاظ على قيم الديمقراطية وحقوق الإنسان.`
      }
    },
    {
      id: 'intro_freedom_speech',
      title: '4. صوتي',
      type: NodeType.SCENARIO,
      isLocked: true, // LOCKED
      isCompleted: false,
      coordinates: { x: 72, y: 56 },
      data: {
        description: 'المهمة: تفجير البالونات التي تُجسّد انتهاكًا لحرّيّة التعبير فقط.',
        backgroundImage: IMG.FREEDOM_INTRO, 
        dialog: [],
        interactionType: InteractionType.BALLOONS,
        interactionData: {
          items: [
            { id: '1', text: 'يُسمح لي بالتعبير عن رأي حتّى لو لا يحظى بشعبيّة', isCorrect: false, image: ITEMS.FREEDOM_1 },
            { id: '2', text: 'لا يُسمح لي بالتحدّث في نقد الحكومة', isCorrect: true, image: ITEMS.FREEDOM_2 },
            { id: '3', text: 'لا يُسمح لي بانتقاد مؤسّسات الدولة', isCorrect: true, image: ITEMS.FREEDOM_3 },
            { id: '4', text: 'يُسمح لي بكتابة مراجعة في صحيفة', isCorrect: false, image: ITEMS.FREEDOM_4 }
          ]
        },
        decisionQuestion: 'انتهت المهمة',
        options: [{ id: 'ok', text: 'استمر', feedback: 'صوتك مهمّ - احمِه، واستخدمه بمسؤوليّة.' }],
        moreInfoTitle: 'حرّيّة التعبير',
        moreInfoContent: 'حرّيّة التعبير حق أساسي، لكنها ليست مُطلقة. يُحظر نشر التشهير، أو التحريض على العنف، أو العنصريّة. ويُحظر، أيضًا، الكشف عن المعلومات الشخصيّة دون إذن.'
      }
    },
    {
      id: 'school_tamara',
      title: '5. ربى',
      type: NodeType.SCENARIO,
      isLocked: true, // LOCKED
      isCompleted: false,
      coordinates: { x: 88, y: 35 },
      data: {
        description: 'كتبت ربى، طالبة في الصف العاشر، منشورًا على فيسبوك تنتقد فيه بشدّة المديرة التي ألغت مجلس الطلّاب، ووصفتها بـ"الديكتاتورية".',
        backgroundImage: IMG.SCHOOL_TAMARA,
        digitalContent: {
          type: 'POST',
          author: 'ربى',
          content: 'مديرتنا ديكتاتوريّة وتنتهك حرّيّة الطلاب! ألغت مجلس الطلّاب دون استشارة أحد. كيف نتعلّم الديمقراطيّة ونحن لا صوت لنا؟',
          likes: 150
        },
        dialog: [
          { id: '1', speaker: 'المديرة السيدة شاهين', text: 'ربى، لقد وصفتني بالديكتاتورة أمام مئات الأشخاص! هذا يمسّ كرامتي وسلطتي كمديرة.', mood: 'angry' },
          { id: '2', speaker: 'ربى', text: 'لكن لديّ حرّيّة تعبير! لقد عبّرتُ فقط عن رأيي في سياسة تضرّ بنا.', mood: 'concerned' },
          { id: '3', speaker: 'المعلم اياد', text: 'كلاكما مُحقّان جزئيًّا. ربى، من حقّكِ الانتقاد، ولكن هناك فرق بين النقد والهجوم الشخصي.', mood: 'neutral' }
        ],
        interactionType: InteractionType.NONE,
        // PHASE 1
        decisionQuestion: 'الجزء الأول: ما الذي ينبغي أن يحدث؟',
        options: [
          { id: '1', text: 'إبعاد ربى فورًا عن التعليم! - لا يمكنك وصف المديرة بـ "الديكتاتورية" علنًا.', feedback: 'رد فعل مبالغ فيه. للطلاب الحق في حرية التعبير.' },
          { id: '2', text: 'يُمكن لربى انتقاد القرار، لكن عليها التغيير إلى صياغة نقدية غير مهينة.', feedback: 'صحيح. حرّيّة التعبير مهمّة ولكنها ليست مُطلقة. يجب الحفاظ على الكرامة.' },
          { id: '3', text: 'يُمكن لربى كتابة ما تشاء - حرية التعبير مطلقة.', feedback: 'غير دقيق. حرّيّة التعبير لا تسمح بالتشهير.' }
        ],
        moreInfoTitle: 'حقوق الطالب',
        moreInfoContent: 'تمنح معاهدة حقوق الطفل وقانون الأساس الطلاب حرية التعبير والمشاركة.',
        
        // PHASE 2
        secondaryDecisionQuestion: 'الجزء الثاني: ماذا عن صلاحيّة مديرة المدرسة في حلّ مجلس الطلّاب؟',
        secondaryOptions: [
           { id: '1', text: 'يحقّ للمديرة حلّ المجلس - فهي أعلى سلطة في المدرسة', feedback: 'خطأ. قانون حقوق الطلاب يحمي المجلس.' },
           { id: '2', text: 'يحقّ للمديرة تقييد أنشطة المجلس، إلا أن قانون حقوق الطلّاب يحظر إلغاؤه وحلّه', feedback: 'إجابة صحيحة! يلزم القانون وجود مجلس طلابي.' },
           { id: '3', text: 'يحقّ للمديرة حلّ المجلس إذا وافقت أغلبيّة الطلاب على ذلك', feedback: 'غير دقيق. القانون يلزم بوجود المجلس بغض النظر عن الأغلبية.' }
        ],
        secondaryMoreInfoTitle: 'قانون حقوق الطلاب',
        secondaryMoreInfoContent: 'ينصّ قانون حقوق الطلاب (المادة ١٣) على أن المؤسّسة التعليميّة يجب أن تشجّع على إنشاء مجلس طلابيّ، ولا يجوز لها اتّخاذ أي إجراء لمنع إنشائه. تمنح معاهدة حقوق الطفل الأطفال الحقّ في المشاركة في القرارات التي تؤثّر عليهم. لذلك، يُعدّ إلغاء مجلس الطلّاب انتهاكًا للقانون. يجوز للمديرة تحديد قواعد عمل المجلس، ولكن لا يجوز لها إلغاؤه كلّيًّا.'
      }
    },
    {
      id: 'newspaper_office',
      title: '6. صحيفة "النبض"',
      type: NodeType.SCENARIO,
      isLocked: true, // LOCKED
      isCompleted: false,
      coordinates: { x: 20, y: 70 },
      data: {
        description: 'نشرت صحيفة "النبض" تقريرًا: "الحكومة تقمع الصحفيّين وتُخفي المعلومات". قرّر وزير الداخليّة تعليق نشاط الصحيفة لـ 10 أيام.',
        backgroundImage: IMG.NEWSPAPER,
        digitalContent: {
          type: 'ARTICLE',
          title: 'النبض',
          content: 'الحكومة تقمع الصحفيّين المستقلّين وتُخفي المعلومات عن الجمهور.',
          author: 'هيئة التحرير'
        },
        dialog: [
          { id: '1', speaker: 'المحرر', text: 'تلقينا إشعارًا بالإغلاق! ماذا نفعل؟', mood: 'concerned' },
          { id: '2', speaker: 'صحفية', text: 'علينا أن نحارب هذا. إنها محاولة لإسكاتنا.', mood: 'angry' }
        ],
        interactionType: InteractionType.NONE,
        decisionQuestion: 'كيف سترد هيئة التحرير؟',
        options: [
          { id: '1', text: 'نشر تقرير آخر حادّ اللهجة: "لن يسكتونا!"', feedback: 'قد يؤدي إلى تفاقم الوضع.' },
          { id: '2', text: 'مراجعة محامٍ لتقديم التماس للمحكمة', feedback: 'خطوة صحيحة. الطريقة الديمقراطية للتعامل مع القرار.' },
          { id: '3', text: 'حذف التقرير والاعتذار', feedback: 'استسلام سريع يضر بحرية الصحافة.' }
        ],
        moreInfoTitle: 'حرية الصحافة',
        moreInfoContent: 'حرية الصحافة مشتقة من حرية التعبير. تذكرنا القضية بحكم "كول هعام" (1953) حيث ألغت المحكمة أمر إغلاق صحيفة.'
      }
    },
    {
      id: 'supreme_court',
      title: '7. المحكمة العليا',
      type: NodeType.SCENARIO,
      isLocked: true, // LOCKED
      isCompleted: false,
      coordinates: { x: 50, y: 85 },
      data: {
        description: 'أنتم الآن قضاة المحكمة العليا. التمست الصحيفة ضد وزير الداخلية.',
        backgroundImage: IMG.COURT,
        dialog: [
          { id: '1', speaker: 'ممثّل الحكومة', text: 'على الدولة حماية الأمن العام. قد يُسبّب هذا التقرير أعمال شغب.', mood: 'neutral' },
          { id: '2', speaker: 'رئيس التحرير', text: 'لا يوجد خطر حقيقيّ هنا. بل نقد فقط. في الديمقراطيّة، يُسمح بانتقاد الحكومة.', mood: 'neutral' }
        ],
        interactionType: InteractionType.NONE,
        decisionQuestion: 'كقضاة، ماذا ستقرّرون؟',
        options: [
          { id: '1', text: 'إلغاء أمر الإغلاق - يُعزّز حرّيّة التعبير', feedback: 'صحيح. هذا المبدأ أقرته محكمة العدل العليا في قضية كول هعام.' },
          { id: '2', text: 'تأكيد الأمر - من الأفضل منع الخطر', feedback: 'هذا نهج صارم رفضته السوابق القضائية.' },
          { id: '3', text: 'تخفيف الأمر لفترة أقصر', feedback: 'لا يزال هذا يمثل انتهاكًا غير متناسب.' }
        ],
        moreInfoTitle: 'اختبار اليقين القريب',
        moreInfoContent: 'أقرت المحكمة: لا يجوز تقييد حرّيّة التعبير إلا إذا كان هناك "يقين شبه مؤكد بوجود مسّ حقيقيّ بأمن الدولة".'
      }
    },
    {
      id: 'quiz_finale',
      title: '8. فكّ الشيفرة',
      type: NodeType.QUIZ,
      isLocked: true, // LOCKED
      isCompleted: false,
      coordinates: { x: 85, y: 70 },
      data: {
        description: 'أجب عن الأسئلة للحصول على أرقام الرمز السري وإنهاء اللعبة.',
        dialog: [],
        interactionType: InteractionType.CODE_CRACKER,
        interactionData: {
          questions: [
            { 
              id: 'q1', 
              question: 'سنة الإعلان عن الإعلان العالمي لحقوق الإنسان؟', 
              options: [{text: '1947', value: 0}, {text: '1967', value: 0}, {text: '1948', value: 3}, {text: '1946', value: 0}],
              explanation: '1948 - الرقم للشيفرة هو 3'
            },
            { 
              id: 'q2', 
              question: 'في أي سنة تمّ تشريع قانون أساس كرامة الإنسان وحريّته في إسرائيل؟', 
              options: [{text: '1996', value: 0}, {text: '1992', value: 2}, {text: '1987', value: 0}, {text: '1990', value: 0}],
              explanation: '1992 - الرقم للشيفرة هو 2'
            },
            { 
              id: 'q3', 
              question: 'دولة إسرائيل هي طرف في --؟-- معاهدات أساسيّة في مجالات حقوق الإنسان', 
              options: [{text: '9', value: 0}, {text: '5', value: 0}, {text: '8', value: 0}, {text: '7', value: 4}],
              explanation: 'الرقم للشيفرة هو 4. دولة إسرائيل هي طرف في سبع معاهدات أساسيّة في مجال حقوق الإنسان (في مواضيع الحقّوق المدنيّة والسياسيّة، الحقّوق الاقتصاديّة والاجتماعيّة والثقافيّة، اجتثاث كل أشكال التمييز والعنصريّة، اجتثاث كل أشكال التمييز ضد النساء، حذظر التعذيب، حقوق الأطفال والمساواة في الحقّوق لأناس مع إعاقات)'
            },
            { 
              id: 'q4', 
              question: 'في أي شهر يُحيون اليوم العالمي لمكافحة العنصريّة؟', 
              options: [{text: 'كانون الأوّل', value: 0}, {text: 'آذار', value: 2}, {text: 'شباط', value: 0}, {text: 'آب', value: 0}],
              explanation: 'آذار - الرقم للشيفرة هو 2'
            }
          ]
        },
        decisionQuestion: 'تم كسر الرمز!',
        options: [], 
        moreInfoTitle: 'كلّ الاحترام لكم!',
        moreInfoContent: 'حقوق الإنسان هي حقوق أساس تضمن أن يعيش كلّ واحد وواحدة بكرامة وحرّيّة وأمان. تُتيح الحقّوق لنا أن نعيش في مجتمع متساوٍ وعادل وحماية حريتنا واحترام الآخر.\n\nولذلك من المهمّ مواصلة التعلّم عن حقوق الإنسان، وأن نفهم التحدّيات في حمايتها والنضال من أجل تحقيقها للجميع ـ دائمًا وفي كلّ مكان. كلّ فعل من أجل حقوق الإنسان يجعل من عالمنا عادلًا وآمنًا.'
      }
    }
];

const EN_NODES: GameNode[] = [
    {
      id: 'HUB_CONFIG',
      title: 'Map Settings',
      type: NodeType.HUB,
      isLocked: false,
      isCompleted: false,
      data: {
        description: '',
        backgroundImage: IMG.HUB,
        dialog: [],
        interactionType: InteractionType.NONE,
        decisionQuestion: '',
        options: []
      }
    },
    {
      id: 'intro',
      title: 'Intro - Neve Or',
      type: NodeType.INTRO,
      isLocked: false,
      isCompleted: false,
      data: {
        description: 'Welcome to Neve Or, a digital city where every decision you make affects the lives of its residents. Here you will discover that human rights are not always easily realized. Throughout the game, you will step into the shoes of students, journalists, and judges. Your choices will determine if a right is protected, violated, or balanced properly. There is no "perfect solution" – only responsibility and critical thinking. Will you manage to find the balance?',
        backgroundImage: IMG.INTRO,
        decisionQuestion: 'Will you manage to find the balance?',
        options: [{ id: 'start', text: 'Start Game', feedback: 'The game begins now.' }],
        dialog: [],
        interactionType: InteractionType.NONE
      }
    },
    {
      id: 'school_lior',
      title: '1. Lior\'s Choice',
      type: NodeType.SCENARIO,
      isLocked: false,
      isCompleted: false,
      coordinates: { x: 15, y: 28 },
      data: {
        description: 'Lior discovers that his school building has dangerous cracks in the ceiling, with a definite risk of collapse. He reports it to the principal, but the principal says: "There is no budget for repairs right now."',
        backgroundImage: IMG.SCHOOL_LIOR,
        dialog: [
           { id: '1', speaker: 'Lior', text: 'Principal, the ceiling is crumbling! It\'s really dangerous.', mood: 'concerned' },
           { id: '2', speaker: 'Principal', text: 'I know, but there is no budget for repairs at the moment. It will be fine.', mood: 'neutral' }
        ],
        interactionType: InteractionType.MULTIPLE_CHOICE,
        interactionData: {
          question: 'Which right is being violated here?',
          answers: [
            { id: '1', text: 'Right to Education', correct: false },
            { id: '2', text: 'Right to Life and Personal Security', correct: true },
            { id: '3', text: 'Freedom of Speech', correct: false },
            { id: '4', text: 'Right to Privacy', correct: false }
          ]
        },
        decisionQuestion: 'Lior needs to make a decision: How will he protect the students\' Right to Life and Security?',
        options: [
          { id: 'opt1', text: 'Document the cracks and contact the Ministry of Education or local authority.', feedback: 'Advantage: Contacting a senior authority committed to safety. Disadvantage: The process might be slow.' },
          { id: 'opt2', text: 'Organize with other students, sign a petition, and present it to the principal.', feedback: 'Advantage: Group power creates pressure. Disadvantage: The principal might get angry or ignore it.' },
          { id: 'opt3', text: 'Call parents and inform them about the danger.', feedback: 'Advantage: Parents can act quickly and are often influential. Disadvantage: It might create conflict between parents and the school.' },
          { id: 'opt4', text: 'Do nothing – "Maybe the cracks aren\'t that dangerous."', feedback: 'Advantage: No one gets annoyed. Disadvantage: The danger remains, and an accident might happen.' }
        ],
        moreInfoTitle: 'Right to Life and Security',
        moreInfoContent: 'In situations where there is a real danger to life or personal security, quick action is essential. When it comes to safety, time is a life-saving factor. Quick response makes the difference between an accident and prevention.'
      }
    },
    {
      id: 'town_square',
      title: '2. Protecting Space',
      type: NodeType.SCENARIO,
      isLocked: true,
      isCompleted: false,
      coordinates: { x: 35, y: 65 },
      data: {
        description: 'Goal: Identify when a person\'s personal security is violated and choose what the state should do. Drag the "Shield" only to situations representing a violation of personal security.',
        backgroundImage: IMG.TOWN_SQUARE,
        dialog: [],
        interactionType: InteractionType.DRAG_SHIELD,
        interactionData: {
          items: [
            { id: '1', text: 'Child threatened online', isDanger: true, image: ITEMS.TOWN_SQUARE_1 },
            { id: '2', text: 'Person walking innocently', isDanger: false, image: ITEMS.TOWN_SQUARE_2 },
            { id: '3', text: 'Person attacked on street', isDanger: true, image: ITEMS.TOWN_SQUARE_3 },
            { id: '4', text: 'Citizen talking to police', isDanger: false, image: ITEMS.TOWN_SQUARE_4 }
          ]
        },
        decisionQuestion: 'Did you protect everyone?',
        options: [{ id: 'ok', text: 'Continue', feedback: 'Personal security is not a luxury – it is a basic right that every state must guarantee.' }],
        moreInfoTitle: 'Personal Security',
        moreInfoContent: 'The right to personal security includes: protection from violence, assault or threat, maintaining privacy, and preventing physical and mental harm. This is the state\'s responsibility.'
      }
    },
    {
      id: 'city_hall',
      title: '3. The City That Films',
      type: NodeType.SCENARIO,
      isLocked: true,
      isCompleted: false,
      coordinates: { x: 50, y: 25 },
      data: {
        description: 'Neve Or is dealing with rising crime. The Mayor is considering adding thousands of AI cameras with facial recognition. He asks you, the Human Rights Advisor, to talk to residents before making a recommendation.',
        backgroundImage: IMG.CITY_HALL,
        dialog: [
          { id: '1', speaker: 'Mayor', text: 'I want you to talk to three residents and hear how they feel. Only then recommend what is right.', mood: 'neutral' }
        ],
        interactionType: InteractionType.CITY_HALL_SUB_LOCATIONS,
        subScenes: [
          {
            id: 'sub_square',
            title: 'Central Square',
            icon: '⛲',
            backgroundImage: IMG.CITY_HALL_SQUARE,
            dialog: [
              { id: '1', speaker: 'Elderly Resident', text: 'I used to be afraid to go out at night. Since they installed cameras, I finally feel safe. If there\'s a criminal, they catch him immediately.', mood: 'happy' },
              { id: '2', speaker: 'Info', text: 'Hint: The right to personal security includes protection from danger and harm to body and life.', mood: 'neutral' }
            ]
          },
          {
            id: 'sub_cafe',
            title: 'Coffee Shop',
            icon: '☕',
            backgroundImage: IMG.CITY_HALL_CAFE,
            dialog: [
              { id: '1', speaker: 'Young Woman', text: 'I\'m not doing anything wrong, but I feel like someone is always watching me. Every move is recorded. That\'s not freedom.', mood: 'concerned' },
              { id: '2', speaker: 'Info', text: 'Hint: The right to privacy protects a person from surveillance and intrusion into their personal life.', mood: 'neutral' }
            ]
          },
          {
            id: 'sub_neighborhood',
            title: 'Neighborhood',
            icon: '🏘️',
            backgroundImage: IMG.CITY_HALL_NEIGHBORHOOD,
            dialog: [
              { id: '1', speaker: 'Teenager', text: 'I have an Ethiopian friend. He says every time he passes a camera, he worries the system thinks he\'s a suspect.', mood: 'concerned' },
              { id: '2', speaker: 'Info', text: 'Hint: AI facial recognition technology is not perfect and can discriminate due to bias.', mood: 'neutral' }
            ]
          },
          {
            id: 'sub_school',
            title: 'School',
            icon: '🏫',
            backgroundImage: IMG.CITY_HALL_SCHOOL,
            dialog: [
              { id: '1', speaker: 'Student', text: 'If we had police officers who knew us, like community officers, we\'d feel safer without cameras. Security is also about who listens to you.', mood: 'neutral' },
              { id: '2', speaker: 'Info', text: 'Hint: Real security is also based on trust and cooperation between citizens and the state.', mood: 'neutral' }
            ]
          }
        ],
        decisionQuestion: 'What is the solution that ensures real security for Neve Or residents?',
        options: [
          { id: '1', text: 'Install smart cameras everywhere', feedback: 'Crime drops, but residents feel they lost their freedom. Physical security achieved, but privacy harmed.' },
          { id: '2', text: 'Invest in community policing', feedback: 'Social security rises and community connection improves, but technological protection is missing.' },
          { id: '3', text: 'Combine supervised cameras with community policing', feedback: 'Cameras placed only in high-risk areas, under supervision. Crime drops, freedom preserved. Balance creates real security.' }
        ],
        moreInfoTitle: 'The Proper Balance',
        moreInfoContent: `The proper balance between the right to personal security and the right to privacy requires an examination of the proportionality and necessity of using surveillance measures.

Both rights are fundamental rights recognized in Israeli law, anchored in Supreme Court rulings and Basic Law: Human Dignity and Liberty.
On one hand, the state has a responsibility to protect the lives of its citizens and maintain their security; on the other hand, the right to privacy protects a person from intrusion into their personal life space and unreasonable surveillance by the authorities.
Therefore, the use of smart cameras and facial recognition can only be justified if it meets the following principles:
Proper Purpose – Surveillance is intended to prevent actual crime or security danger, not for general or political use.
Proportionality – The least intrusive means possible must be used (for example, blurring the faces of people who are not suspects).
Limitation of Use – Information will be kept only for the time necessary for the purpose for which it was collected and will not be transferred to unauthorized parties.
Supervision and Transparency – An independent oversight mechanism and public reporting on the scope of camera use are required.
In other words, public security does not automatically override the right to privacy, but only to the extent necessary and proportional for maintaining genuine public peace, while preserving democratic values and human rights.`
      }
    },
    {
      id: 'intro_freedom_speech',
      title: '4. My Voice',
      type: NodeType.SCENARIO,
      isLocked: true, // LOCKED
      isCompleted: false,
      coordinates: { x: 72, y: 56 },
      data: {
        description: 'Mission: Pop only the balloons that show a violation of Freedom of Speech!',
        backgroundImage: IMG.FREEDOM_INTRO, 
        dialog: [],
        interactionType: InteractionType.BALLOONS,
        interactionData: {
          items: [
            { id: '1', text: 'Allowed to express unpopular opinion', isCorrect: false, image: ITEMS.FREEDOM_1 },
            { id: '2', text: 'Forbidden to speak against government', isCorrect: true, image: ITEMS.FREEDOM_2 },
            { id: '3', text: 'Forbidden to criticize institutions', isCorrect: true, image: ITEMS.FREEDOM_3 },
            { id: '4', text: 'Allowed to write review in newspaper', isCorrect: false, image: ITEMS.FREEDOM_4 }
          ]
        },
        decisionQuestion: 'Mission Complete',
        options: [{ id: 'ok', text: 'Continue', feedback: 'Your voice matters – protect it, use it responsibly. Freedom of speech is not absolute, but it is a fundamental right.' }],
        moreInfoTitle: 'Freedom of Speech',
        moreInfoContent: 'Freedom of speech includes the right to express an opinion, criticize, publish information, and demonstrate. Restrictions are allowed only when the expression endangers life or harms other rights disproportionately.'
      }
    },
    {
      id: 'school_tamara',
      title: '5. Tamara',
      type: NodeType.SCENARIO,
      isLocked: true, // LOCKED
      isCompleted: false,
      coordinates: { x: 88, y: 35 },
      data: {
        description: 'Tamara, a 10th grade student, writes a Facebook post against the principal who cancelled the Student Council without consultation. She calls her a "Dictator".',
        backgroundImage: IMG.SCHOOL_TAMARA,
        digitalContent: {
          type: 'POST',
          author: 'Tamara',
          content: 'Our principal is a dictator and hurts freedom of speech! Cancelled council without asking anyone. How are we supposed to learn democracy when we have no voice?',
          likes: 150
        },
        dialog: [
          { id: '1', speaker: 'Principal Cohen', text: 'Tamara, you called me a dictator in front of hundreds! This hurts my dignity and authority.', mood: 'angry' },
          { id: '2', speaker: 'Tamara', text: 'But I have freedom of speech! I just expressed an opinion on a policy that hurts us.', mood: 'concerned' },
          { id: '3', speaker: 'Teacher Danny', text: 'You are both partially right. Criticism is allowed, but "dictator" is a personal attack.', mood: 'neutral' }
        ],
        interactionType: InteractionType.NONE,
        // PHASE 1
        decisionQuestion: 'Part 1: What should happen with Tamara?',
        options: [
          { id: '1', text: 'Suspend Tamara immediately! - You can\'t call the principal a "dictator" publicly.', feedback: 'Too harsh. Students have a right to freedom of speech.' },
          { id: '2', text: 'Tamara can criticize the decision, but needs to change to critical wording that isn\'t insulting.', feedback: 'Correct. Freedom of speech is important but not absolute. Human dignity must be maintained.' },
          { id: '3', text: 'Tamara can write whatever she wants - freedom of speech is absolute.', feedback: 'Inaccurate. Freedom of speech does not permit defamation.' }
        ],
        moreInfoTitle: 'Student Rights',
        moreInfoContent: 'The Convention on the Rights of the Child and Basic Laws grant students freedom of speech and participation.',
        
        // PHASE 2
        secondaryDecisionQuestion: 'Part 2: Does the principal have authority to cancel the council?',
        secondaryOptions: [
           { id: '1', text: 'Yes, principal is the highest authority', feedback: 'Incorrect. Student Rights Law protects the council.' },
           { id: '2', text: 'Principal can limit activities, but the Law forbids cancelling it', feedback: 'Correct! The law mandates a student council.' },
           { id: '3', text: 'Principal can cancel if a majority agrees', feedback: 'Inaccurate. The law mandates it regardless of majority.' }
        ],
        secondaryMoreInfoTitle: 'Student Rights Law',
        secondaryMoreInfoContent: 'The Student Rights Law (Section 13) states that an educational institution shall encourage the establishment of a student council and shall not take any action to prevent its establishment. Therefore, cancelling the Student Council constitutes a violation of the law. The principal may establish regulations, but cannot cancel it entirely.'
      }
    },
    {
      id: 'newspaper_office',
      title: '6. The Pulse',
      type: NodeType.SCENARIO,
      isLocked: true, // LOCKED
      isCompleted: false,
      coordinates: { x: 20, y: 70 },
      data: {
        description: 'The "Pulse" newspaper published an article: "Government suppresses journalists and hides info". Interior Minister ordered to close the paper for 10 days citing security.',
        backgroundImage: IMG.NEWSPAPER,
        digitalContent: {
          type: 'ARTICLE',
          title: 'The Pulse',
          content: 'Exposure: Government suppresses independent journalists and hides critical info from the public.',
          author: 'Editorial Board'
        },
        dialog: [
          { id: '1', speaker: 'Editor', text: 'We got a closure notice! What do we do?', mood: 'concerned' },
          { id: '2', speaker: 'Reporter', text: 'We must fight this. It\'s silencing us.', mood: 'angry' }
        ],
        interactionType: InteractionType.NONE,
        decisionQuestion: 'How will the team respond?',
        options: [
          { id: '1', text: 'Post another angry post: "We won\'t be silenced!"', feedback: 'Might worsen the situation.' },
          { id: '2', text: 'Petition the Supreme Court', feedback: 'Correct step. The democratic way to deal with a government decision.' },
          { id: '3', text: 'Take down article and apologize', feedback: 'Surrender that hurts freedom of the press.' }
        ],
        moreInfoTitle: 'Freedom of the Press',
        moreInfoContent: 'Freedom of the press is derived from freedom of speech. This case recalls the "Kol HaAm" affair (1953) where a closure order for a newspaper was cancelled.'
      }
    },
    {
      id: 'supreme_court',
      title: '7. The Court',
      type: NodeType.SCENARIO,
      isLocked: true, // LOCKED
      isCompleted: false,
      coordinates: { x: 50, y: 85 },
      data: {
        description: 'You are now Supreme Court judges. The newspaper petitioned against the Minister of Interior.',
        backgroundImage: IMG.COURT,
        dialog: [
          { id: '1', speaker: 'Govt Rep', text: 'The state must protect public security. This article could cause riots.', mood: 'neutral' },
          { id: '2', speaker: 'Editor', text: 'There is no real danger here, just criticism. In a democracy, criticism is allowed.', mood: 'neutral' }
        ],
        interactionType: InteractionType.NONE,
        decisionQuestion: 'As judges, what is your ruling?',
        options: [
          { id: '1', text: 'Cancel order - Freedom of speech prevails', feedback: 'Correct. This is the principle established in the Kol HaAm High Court ruling (1953).' },
          { id: '2', text: 'Approve order - Better prevent danger', feedback: 'This is a harsh approach rejected in historical rulings.' },
          { id: '3', text: 'Reduce order duration', feedback: 'Still a disproportionate violation.' }
        ],
        moreInfoTitle: 'Near Certainty Test',
        moreInfoContent: 'In the "Kol HaAm" ruling, the court stated: Freedom of speech must not be restricted unless there is "near certainty of real harm to state security".'
      }
    },
    {
      id: 'quiz_finale',
      title: '8. Cracking Code',
      type: NodeType.QUIZ,
      isLocked: true, // LOCKED
      isCompleted: false,
      coordinates: { x: 85, y: 70 },
      data: {
        description: 'Answer the questions to get the digits for the secret code and finish the game.',
        dialog: [],
        interactionType: InteractionType.CODE_CRACKER,
        interactionData: {
          questions: [
            { 
              id: 'q1', 
              question: 'Year of Universal Declaration of Human Rights?', 
              options: [{text: '1947', value: 0}, {text: '1967', value: 0}, {text: '1948', value: 3}, {text: '1946', value: 0}],
              explanation: '1948 - The digit is 3'
            },
            { 
              id: 'q2', 
              question: 'Year Basic Law: Human Dignity and Liberty enacted?', 
              options: [{text: '1996', value: 0}, {text: '1992', value: 2}, {text: '1987', value: 0}, {text: '1990', value: 0}],
              explanation: '1992 - The digit is 2'
            },
            { 
              id: 'q3', 
              question: 'Israel is party to how many core HR treaties?', 
              options: [{text: '9', value: 0}, {text: '5', value: 0}, {text: '8', value: 0}, {text: '7', value: 4}],
              explanation: 'The digit is 4. Israel is party to 7 core treaties.'
            },
            { 
              id: 'q4', 
              question: 'Month of Int\'l Day Against Racism?', 
              options: [{text: 'December', value: 0}, {text: 'March', value: 2}, {text: 'February', value: 0}, {text: 'August', value: 0}],
              explanation: 'March - The digit is 2'
            }
          ]
        },
        decisionQuestion: 'Code Cracked!',
        options: [], 
        moreInfoTitle: 'Well Done!',
        moreInfoContent: 'Human rights are fundamental rights ensuring everyone lives with dignity, freedom, and security. They allow us to live in a just society.\n\nIt is important to keep learning about human rights, understand the challenges, and fight for them to be realized for everyone – always, everywhere.'
      }
    }
];

const NODES_DATA = {
  he: HE_NODES,
  ar: AR_NODES,
  en: EN_NODES
};

export const getInitialNodes = (lang: Language): GameNode[] => {
  const nodes = NODES_DATA[lang] && NODES_DATA[lang].length > 0 ? NODES_DATA[lang] : NODES_DATA['he'];
  return JSON.parse(JSON.stringify(nodes));
};

export const INITIAL_NODES = getInitialNodes('he');