import { C } from "../theme.js";

const VIEW_W = 160;
const VIEW_H = 200;
const GROUND_Y = 176;
const MAX_STEM = 130;

// Growth is computed continuously from the streak length instead of a
// fixed set of hand-drawn stages, so the plant keeps evolving no matter
// how long a streak runs: stem height approaches a ceiling asymptotically
// (always growing, never quite stopping), while leaves/petals/sparkles
// keep adding detail well past that point.
function computeGrowth(streak) {
  const stemHeight = MAX_STEM * (1 - Math.exp(-streak / 10));
  const leafPairs = Math.min(Math.floor(streak / 3), 9);
  const hasBloom = streak >= 7;
  const petalCount = hasBloom ? Math.min(5 + Math.floor((streak - 7) / 5), 14) : 0;
  const sparkles = Math.min(Math.floor(streak / 20), 6);
  return { stemHeight, leafPairs, hasBloom, petalCount, sparkles };
}

function Leaf({ x, y, side, color }) {
  const dx = side * 16;
  return (
    <path
      d={`M ${x} ${y} Q ${x + dx * 0.3} ${y - 8} ${x + dx} ${y - 2.4} Q ${x + dx * 0.3} ${y + 3.2} ${x} ${y} Z`}
      fill={color}
      opacity="0.92"
    />
  );
}

function Petal({ cx, cy, angle, color }) {
  return (
    <ellipse cx={cx} cy={cy - 10} rx="4.5" ry="9" fill={color} transform={`rotate(${angle} ${cx} ${cy})`} opacity="0.95" />
  );
}

function Sparkle({ x, y, size }) {
  const p = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
    const r = i % 2 === 0 ? size : size * 0.35;
    const a = (Math.PI / 4) * i;
    return `${x + Math.cos(a) * r} ${y + Math.sin(a) * r}`;
  });
  return <polygon points={p.join(" ")} fill={C.amber} opacity="0.85" />;
}

export default function PlantIllustration({ streak = 0, everTrained = false, size = "full" }) {
  const wilted = streak === 0 && everTrained;
  const px = size === "badge" ? 46 : 130;
  const growth = wilted
    ? { stemHeight: 34, leafPairs: 1, hasBloom: false, petalCount: 0, sparkles: 0 }
    : computeGrowth(streak);

  const plantColor = wilted ? C.textMuted : C.teal;
  const stemX = VIEW_W / 2;
  const stemTopX = stemX + (wilted ? 20 : 0);
  const stemTopY = GROUND_Y - growth.stemHeight;
  const stemMidX = stemX + (wilted ? 12 : -5);

  const leaves = [];
  for (let i = 0; i < growth.leafPairs; i++) {
    const t = 0.3 + (i / Math.max(growth.leafPairs, 1)) * 0.6;
    const y = GROUND_Y - growth.stemHeight * t;
    const x = stemX + (stemTopX - stemX) * t;
    leaves.push(<Leaf key={`l${i}`} x={x} y={y} side={-1} color={plantColor} />);
    leaves.push(<Leaf key={`r${i}`} x={x} y={y - 5} side={1} color={plantColor} />);
  }

  const petals = [];
  for (let i = 0; i < growth.petalCount; i++) {
    petals.push(<Petal key={i} cx={stemTopX} cy={stemTopY} angle={(360 / growth.petalCount) * i} color={C.amber} />);
  }

  const sparkles = [];
  for (let i = 0; i < growth.sparkles; i++) {
    const a = ((360 / growth.sparkles) * i + 20) * (Math.PI / 180);
    const r = 32 + (i % 2) * 8;
    sparkles.push(
      <Sparkle key={i} x={stemTopX + Math.cos(a) * r} y={stemTopY - 8 + Math.sin(a) * r} size={3.5 + (i % 3)} />
    );
  }

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} width={px} height={(px * VIEW_H) / VIEW_W} style={{ overflow: "visible", flexShrink: 0 }}>
      <path
        d={`M ${stemX - 26} ${GROUND_Y} L ${stemX - 20} ${GROUND_Y + 30} L ${stemX + 20} ${GROUND_Y + 30} L ${stemX + 26} ${GROUND_Y} Z`}
        fill={C.surfaceAlt}
        stroke={C.line}
        strokeWidth="1.5"
      />
      <ellipse cx={stemX} cy={GROUND_Y} rx="27" ry="5" fill={C.line} />

      {growth.stemHeight > 0 && (
        <path
          d={`M ${stemX} ${GROUND_Y} Q ${stemMidX} ${(GROUND_Y + stemTopY) / 2} ${stemTopX} ${stemTopY}`}
          fill="none"
          stroke={plantColor}
          strokeWidth="4"
          strokeLinecap="round"
        />
      )}

      {leaves}
      {growth.hasBloom && <circle cx={stemTopX} cy={stemTopY} r="6" fill={C.amber} opacity="0.9" />}
      {petals}
      {sparkles}
    </svg>
  );
}
