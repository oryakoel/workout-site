// Shared "style guide" for every exercise illustration: a small filled
// character built from thick rounded capsules (shirt-colored torso,
// pants-colored legs, skin-toned arms/head), rendered in the app's own
// amber/teal palette so every pose reads as the same figure.

export const PALETTE = {
  skin: "#EFC29B",
  hair: "#3A2E1A",
  shirt: "#E8A33D", // C.amber
  pants: "#7FB0A6", // C.teal
  outline: "#0F211C", // C.bg
};

const OUTLINE_WIDTH = 4;

export const VIEWBOX = "0 0 240 200";
export const FLOOR_Y = 176;

export function Ground({ x1 = 14, x2 = 226 }) {
  return <line x1={x1} y1={FLOOR_Y} x2={x2} y2={FLOOR_Y} stroke="#2B4B41" strokeWidth="2" strokeDasharray="4 6" />;
}

export function Capsule({ from, to, width, color }) {
  return (
    <>
      <line
        x1={from[0]}
        y1={from[1]}
        x2={to[0]}
        y2={to[1]}
        stroke={PALETTE.outline}
        strokeWidth={width + OUTLINE_WIDTH * 2}
        strokeLinecap="round"
      />
      <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={color} strokeWidth={width} strokeLinecap="round" />
    </>
  );
}

export function Blob({ at, r, color = PALETTE.skin }) {
  return (
    <>
      <circle cx={at[0]} cy={at[1]} r={r + OUTLINE_WIDTH} fill={PALETTE.outline} />
      <circle cx={at[0]} cy={at[1]} r={r} fill={color} />
    </>
  );
}

// An elongated foot between a heel and a toe point — deliberately not a
// round blob, so it reads as a foot even at small sizes.
export function Foot({ heel, toe, width = 13 }) {
  return <Capsule from={heel} to={toe} width={width} color={PALETTE.skin} />;
}

export function Head({ at, hairOffset = [-6, -13] }) {
  const hairAt = [at[0] + hairOffset[0], at[1] + hairOffset[1]];
  return (
    <>
      <Blob at={hairAt} r={7} color={PALETTE.hair} />
      <Blob at={at} r={15} color={PALETTE.skin} />
    </>
  );
}
