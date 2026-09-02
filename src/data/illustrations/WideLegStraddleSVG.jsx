import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Seated, legs open wide, hinging forward from the hips. Shown as one
// long straight leg (the pair is symmetric) with a deep forward fold —
// no tucked companion leg, unlike the hamstring stretch.
export default function WideLegStraddleSVG() {
  const hip = [68, 148];
  const knee = [110, 153];
  const ankle = [150, 158];
  const toe = [168, 148];

  const shoulder = [95, 109];
  const head = [110, 96];
  const elbow = [120, 127];
  const hand = [145, 145];

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
