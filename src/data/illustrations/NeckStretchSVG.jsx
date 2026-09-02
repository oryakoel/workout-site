import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Standing, head tilted gently to one side with the hand offering light
// assistance.
export default function NeckStretchSVG() {
  const ankle = [120, 176];
  const toe = [138, 175];
  const knee = [119, 134];
  const hip = [118, 90];
  const shoulder = [116, 42];
  const head = [95, 25];

  const elbow = [95, 60];
  const hand = [85, 35];

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
