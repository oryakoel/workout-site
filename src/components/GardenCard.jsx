import { C } from "../theme.js";
import { daysLabel, plantLabel } from "../lib/consistency.js";
import { Card } from "./ui.jsx";
import PlantIllustration from "./PlantIllustration.jsx";

function caption(consistency) {
  const { condition, thisWeek } = consistency;
  if (condition === "seed") return "זרע חדש. אימון אחד ומתחילים לנבוט.";
  if (condition === "wilting") return "הצמח צמא. אימון אחד יחזיר אותו לחיים.";
  if (condition === "thriving") return "הצמח פורח! הגעתם ליעד השבועי.";
  return `הצמח גדל. עוד ${daysLabel(thisWeek.remaining)} ליעד השבוע.`;
}

const shortDate = (date) => `${date.getDate()}/${date.getMonth() + 1}`;

// Eight bars, one per week: how many days were trained, brightest when the
// goal was met.
function WeeklyBars({ weeks }) {
  return (
    <div role="img" aria-label="ימי אימון בכל אחד משמונת השבועות האחרונים" className="flex items-end justify-between gap-2 h-16">
      {weeks.map((week) => (
        <div key={week.start.getTime()} className="flex-1 flex flex-col items-center gap-1 justify-end h-full">
          <span
            className="w-full rounded-md"
            style={{
              height: `${Math.max(4, (week.done / 7) * 100)}%`,
              maxHeight: 40,
              backgroundColor: week.met ? C.accent : week.done > 0 ? C.sage : C.line,
              opacity: week.isCurrent ? 1 : 0.85,
            }}
          />
          <span className="text-[10px]" style={{ color: C.textMuted }}>
            {shortDate(week.start)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function GardenCard({ consistency }) {
  const { goalWeeks, weeksInARow, bestWeeksInARow, garden } = consistency;
  const stats = [
    { label: "שבועות ברצף", value: weeksInARow },
    { label: "השיא שלכם", value: bestWeeksInARow },
    { label: "שבועות בגן", value: goalWeeks },
  ];
  return (
    <Card className="flex flex-col items-center gap-4">
      <PlantIllustration
        level={consistency.level}
        condition={consistency.condition}
        garden={garden}
        label={plantLabel(consistency)}
      />
      <p className="text-base font-medium text-center" style={{ color: C.text }}>
        {caption(consistency)}
      </p>

      <dl className="grid grid-cols-3 gap-2 w-full text-center">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl py-3" style={{ backgroundColor: C.surfaceAlt }}>
            <dd className="text-2xl font-bold" style={{ color: C.text }}>
              {s.value}
            </dd>
            <dt className="text-xs" style={{ color: C.textMuted }}>
              {s.label}
            </dt>
          </div>
        ))}
      </dl>

      <div className="w-full">
        <WeeklyBars weeks={consistency.recentWeeks} />
      </div>
    </Card>
  );
}
