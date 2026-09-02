import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Bodyweight squat with the hands held together at the chest — a
// repeated rep rather than the isometric squat hold.
export default function AirSquatSVG() {
  const ankle = [120, 176];
  const toe = [138, 175];
  const knee = [128, 150];
  const hip = [110, 150];
  const shoulder = [112, 105];
  const head = [114, 90];
  const elbow = [138, 118];
  const hand = [128, 130];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={knee} width={18} color={PALETTE.pants} />
      <Capsule from={knee} to={ankle} width={16} color={PALETTE.pants} />
      <Foot heel={ankle} toe={toe} />

      <Capsule from={hip} to={shoulder} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={elbow} width={13} color={PALETTE.skin} />
      <Capsule from={elbow} to={hand} width={12} color={PALETTE.skin} />

      <Head at={head} />
    </svg>
  );
}
