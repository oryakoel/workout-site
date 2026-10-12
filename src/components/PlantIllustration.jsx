import { C } from "../theme.js";

const GROUND_Y = 176;
const CENTER_X = 160;

// Everything is derived from numbers (see lib/consistency.js), so there is no
// fixed set of pictures: the plant keeps changing as `level` rises, and the
// garden around it keeps filling in as goal weeks add up.
function plantShape(level, condition) {
  const wilted = condition === "wilting";
  const grown = 20 + 108 * (1 - Math.exp(-level / 9));
  return {
    wilted,
    stemHeight: wilted ? grown * 0.7 : grown,
    leafPairs: Math.max(1, Math.min(Math.floor(level / 1.5), 10)),
    hasBud: level >= 3 && level < 6,
    hasBloom: level >= 6 && !wilted,
    petals: Math.min(5 + Math.floor(Math.max(0, level - 6) / 1.5), 14),
    sideBlooms: level >= 24 ? 2 : level >= 14 ? 1 : 0,
    sparkles: level >= 28 ? Math.min(Math.floor((level - 28) / 6) + 1, 6) : 0,
  };
}

function Leaf({ x, y, side, color, droop }) {
  const dx = side * 16;
  const lift = droop ? 2 : -8;
  return (
    <path
      d={`M ${x} ${y} Q ${x + dx * 0.3} ${y + lift} ${x + dx} ${y + (droop ? 8 : -2.4)} Q ${x + dx * 0.3} ${y + 3.2} ${x} ${y} Z`}
      fill={color}
      opacity="0.92"
    />
  );
}

function Bloom({ cx, cy, petals, scale = 1, color }) {
  return (
    <g>
      {Array.from({ length: petals }, (_, i) => (
        <ellipse
          key={i}
          cx={cx}
          cy={cy - 10 * scale}
          rx={4.5 * scale}
          ry={9 * scale}
          fill={color}
          transform={`rotate(${(360 / petals) * i} ${cx} ${cy})`}
          opacity="0.95"
        />
      ))}
      <circle cx={cx} cy={cy} r={6 * scale} fill={C.accent} opacity="0.9" />
    </g>
  );
}

function Sparkle({ x, y, size }) {
  const points = Array.from({ length: 8 }, (_, i) => {
    const r = i % 2 === 0 ? size : size * 0.35;
    const a = (Math.PI / 4) * i;
    return `${x + Math.cos(a) * r} ${y + Math.sin(a) * r}`;
  });
  return <polygon points={points.join(" ")} fill={C.accent} opacity="0.85" />;
}

// Small blooms along the ground. They get slightly bigger as weeks go on,
// so the garden still changes after every slot is filled.
const FLOWER_SLOTS = [-62, 62, -82, 82, -102, 102, -120, 120];
const FLOWER_COLORS = [C.accent, C.sage, C.text];

function GardenFlowers({ count }) {
  const visible = Math.min(count, FLOWER_SLOTS.length);
  const ageScale = 1 + Math.min(0.6, Math.max(0, count - FLOWER_SLOTS.length) / 16);
  return Array.from({ length: visible }, (_, i) => {
    const x = CENTER_X + FLOWER_SLOTS[i];
    const stem = (14 + (i % 3) * 5) * ageScale;
    return (
      <g key={i}>
        <path d={`M ${x} ${GROUND_Y} L ${x} ${GROUND_Y - stem}`} stroke={C.sage} strokeWidth="2" strokeLinecap="round" />
        <Bloom cx={x} cy={GROUND_Y - stem} petals={5} scale={0.42 * ageScale} color={FLOWER_COLORS[i % 3]} />
      </g>
    );
  });
}

const BUTTERFLY_SPOTS = [
  [78, 62],
  [244, 48],
  [112, 34],
  [214, 80],
];

function Butterflies({ count }) {
  return BUTTERFLY_SPOTS.slice(0, Math.min(count, BUTTERFLY_SPOTS.length)).map(([x, y], i) => {
    const color = i % 2 === 0 ? C.accent : C.sage;
    return (
      <g key={i} opacity="0.9">
        <ellipse cx={x - 4} cy={y} rx="4.5" ry="3" fill={color} transform={`rotate(-25 ${x - 4} ${y})`} />
        <ellipse cx={x + 4} cy={y} rx="4.5" ry="3" fill={color} transform={`rotate(25 ${x + 4} ${y})`} />
        <rect x={x - 0.6} y={y - 3} width="1.2" height="6" rx="0.6" fill={C.text} />
      </g>
    );
  });
}

function Trees({ count }) {
  return [22, 298].slice(0, Math.min(count, 2)).map((x) => (
    <g key={x}>
      <rect x={x - 3} y={GROUND_Y - 38} width="6" height="38" rx="2" fill={C.lineStrong} />
      <circle cx={x} cy={GROUND_Y - 46} r="17" fill={C.sage} opacity="0.85" />
      <circle cx={x - 6} cy={GROUND_Y - 52} r="9" fill={C.sage} opacity="0.6" />
    </g>
  ));
}

export default function PlantIllustration({ level = 0, condition = "seed", garden, size = "full", label }) {
  const isBadge = size === "badge";
  const isSeed = condition === "seed";
  const shape = plantShape(level, condition);
  const color = shape.wilted ? C.textMuted : C.sage;

  const topX = CENTER_X + (shape.wilted ? 22 : 0);
  const topY = GROUND_Y - shape.stemHeight;
  const midX = CENTER_X + (shape.wilted ? 12 : -5);

  const leaves = [];
  for (let i = 0; i < shape.leafPairs; i++) {
    const t = 0.3 + (i / Math.max(shape.leafPairs, 1)) * 0.6;
    const y = GROUND_Y - shape.stemHeight * t;
    const x = CENTER_X + (topX - CENTER_X) * t;
    leaves.push(<Leaf key={`l${i}`} x={x} y={y} side={-1} color={color} droop={shape.wilted} />);
    leaves.push(<Leaf key={`r${i}`} x={x} y={y - 5} side={1} color={color} droop={shape.wilted} />);
  }

  const sideShoots = [];
  for (let i = 0; i < shape.sideBlooms; i++) {
    const side = i === 0 ? -1 : 1;
    const baseY = GROUND_Y - shape.stemHeight * 0.5;
    const endX = CENTER_X + side * 30;
    const endY = baseY - 24;
    sideShoots.push(
      <g key={`s${i}`}>
        <path d={`M ${CENTER_X} ${baseY} Q ${CENTER_X + side * 6} ${endY + 8} ${endX} ${endY}`} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <Bloom cx={endX} cy={endY} petals={6} scale={0.6} color={C.accent} />
      </g>,
    );
  }

  const sparkles = [];
  for (let i = 0; i < shape.sparkles; i++) {
    const a = ((360 / shape.sparkles) * i + 20) * (Math.PI / 180);
    const r = 34 + (i % 2) * 8;
    sparkles.push(<Sparkle key={i} x={topX + Math.cos(a) * r} y={topY - 8 + Math.sin(a) * r} size={3.5 + (i % 3)} />);
  }

  const fallenPetals = shape.wilted && level >= 6 ? 3 : 0;

  return (
    <svg
      viewBox={isBadge ? "92 24 136 184" : "0 0 320 200"}
      width={isBadge ? 50 : "100%"}
      style={{ overflow: "visible", flexShrink: 0, maxWidth: isBadge ? undefined : 340 }}
      role="img"
      aria-label={label}
    >
      {!isBadge && garden?.sun && <circle cx={CENTER_X} cy="84" r="74" fill={C.accent} opacity="0.1" />}
      {!isBadge && <line x1="10" y1={GROUND_Y} x2="310" y2={GROUND_Y} stroke={C.line} strokeWidth="2" strokeLinecap="round" />}
      {!isBadge && garden && <Trees count={garden.trees} />}
      {!isBadge && garden && <GardenFlowers count={garden.flowers} />}
      {!isBadge && garden && <Butterflies count={garden.butterflies} />}

      <path
        d={`M ${CENTER_X - 26} ${GROUND_Y} L ${CENTER_X - 20} ${GROUND_Y + 30} L ${CENTER_X + 20} ${GROUND_Y + 30} L ${CENTER_X + 26} ${GROUND_Y} Z`}
        fill={C.surfaceAlt}
        stroke={C.line}
        strokeWidth="1.5"
      />
      <ellipse cx={CENTER_X} cy={GROUND_Y} rx="27" ry="5" fill={C.line} />

      {isSeed ? (
        <ellipse cx={CENTER_X} cy={GROUND_Y - 3} rx="6" ry="3.5" fill={C.accentDim} stroke={C.accent} strokeWidth="1.2" />
      ) : (
        <>
          <path
            d={`M ${CENTER_X} ${GROUND_Y} Q ${midX} ${(GROUND_Y + topY) / 2} ${topX} ${topY}`}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
          />
          {leaves}
          {sideShoots}
          {shape.hasBud && <ellipse cx={topX} cy={topY - 4} rx="4" ry="6" fill={C.accent} opacity="0.9" />}
          {shape.wilted && level >= 3 && <ellipse cx={topX + 4} cy={topY + 4} rx="4" ry="6" fill={C.textMuted} opacity="0.8" />}
          {shape.hasBloom && <Bloom cx={topX} cy={topY} petals={shape.petals} color={C.accent} />}
          {sparkles}
          {Array.from({ length: fallenPetals }, (_, i) => (
            <ellipse key={i} cx={CENTER_X + 34 + i * 12} cy={GROUND_Y - 2} rx="4" ry="2" fill={C.textMuted} opacity="0.7" transform={`rotate(${i * 18 - 10} ${CENTER_X + 34 + i * 12} ${GROUND_Y - 2})`} />
          ))}
        </>
      )}
    </svg>
  );
}
