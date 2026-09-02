# סטרצ׳ינג יומי

אפליקציית PWA לאימוני מתיחות וגמישות, מותאמת ל-iPad Pro (Safari), עם תמיכה מלאה באופליין.

נבנתה עם React + Vite + Tailwind CSS.

## מבנה הפרויקט

- `src/data/exercises.js` — כל התרגילים, ורשימת `WORKOUT_TYPES` (סוגי האימון: כוח לעמוד / גוף מלא / סיבולת / גמישות / התאוששות). כדי להוסיף תרגיל חדש, מוסיפים אובייקט חדש למערך `EXERCISES` (id, name, muscleGroup, type, defaultDurationSeconds, bilateral, tips, Illustration) ומוסיפים קובץ איור תואם בתיקיית `src/data/illustrations`. כרגע יש 1-3 תרגילי דוגמה לכל סוג — זה מאגר התחלתי בלבד, מיועד להתרחב.
- `src/data/illustrations/bones.jsx` — "מדריך הסגנון" המשותף לכל האיורים: עובי קו, גדלי מפרקים ואורכי איברים קבועים, כדי שכל האיורים ייראו כאילו צוירו ע"י אותו מאייר.
- `src/lib/workoutEngine.js` — המנוע שמרכיב את רצף האימון לפי הזמן והסוג שנבחרו, כולל טיפול בתרגילים דו-צדדיים (bilateral), סינון לפי סוג אימון, "אין לי כוח" (5 דק׳ התאוששות קבועות), ולוגיקת גיוון (לא חוזרים על אותו תרגיל עד שכל המאגר נוצל).
- `src/lib/tts.js` ו-`src/lib/announcements.js` — הקראה קולית (Text-to-Speech) של הדדשים דרך ה-Web Speech API המובנה בדפדפן (`speechSynthesis`), כולל טעינת קול עברי אם קיים במכשיר וכפתור השתקה שנשמר מקומית. **הערה:** איכות וזמינות הקול תלויות במכשיר ובקולות שהותקנו ב-iOS — אין קול מובטח.
- `src/components/` — מסכי האפליקציה (בית, ספריית תרגילים, אימון פעיל, סיכום).

## הרצה מקומית לבדיקה

```bash
npm install
npm run dev
```

האתר ייפתח בכתובת שתוצג בטרמינל (בדרך כלל `http://localhost:5174`). אפשר לפתוח את הכתובת גם מה-iPad כל עוד הוא באותה רשת Wi-Fi כמו המחשב (יש להריץ עם `--host` כדי לחשוף לרשת: `npm run dev -- --host`).

## בנייה לפרודקשן

```bash
npm run build
```

התוצאה (קבצים סטטיים כולל manifest ו-service worker) נוצרת בתיקיית `dist/`. אפשר לבדוק אותה מקומית עם:

```bash
npm run preview
```

## העלאה לאחסון סטטי חינמי

כל אחת מהאפשרויות הבאות מתאימה (בחרו אחת):

### Netlify (הכי פשוט — גרירה ושחרור)
1. היכנסו ל-[app.netlify.com/drop](https://app.netlify.com/drop)
2. הריצו `npm run build` ואז גררו את תיקיית `dist` לדפדפן
3. תקבלו כתובת ציבורית מיידית — פתחו אותה ב-Safari באייפד

### Vercel
```bash
npm install -g vercel
npm run build
vercel deploy --prebuilt --prod dist
```

### Cloudflare Pages
```bash
npm install -g wrangler
npm run build
wrangler pages deploy dist
```

## הוספה למסך הבית ב-iPad (חוויית PWA מלאה)

1. פתחו את הכתובת שקיבלתם מהשירות שבחרתם ב-**Safari** באייפד (חובה Safari, לא Chrome)
2. הקישו על כפתור השיתוף (הריבוע עם החץ)
3. בחרו "הוסף למסך הבית" (Add to Home Screen)
4. האפליקציה תיפתח במסך מלא, ללא סרגלי כתובת, ותעבוד גם ללא אינטרנט לאחר פתיחה ראשונה
