import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Lying with hips lifted slightly off the floor and knees drawn up over
// them at a fixed right angle — the legs do the lifting, not the torso.
export default function ReverseCrunchSVG() {
  const hip = [95, 170];
  const knee = [112, 128];
  const foot = [128, 108];
  const toe = [138, 92];

  const shoulder = [40, 176];
  const head = [24, 172];
  const elbow = [55, 174];
  const hand = [15, 176];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={knee} width={18} color={PALETTE.pants} />
      <Capsule from={knee} to={foot} width={16} color={PALETTE.pants} />
      <Foot heel={foot} toe={toe} width={11} />

      <Capsule from={shoulder} to={hip} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={elbow} width={13} color={PALETTE.skin} />
      <Capsule from={elbow} to={hand} width={12} color={PALETTE.skin} />

      <Head at={head} hairOffset={[-4, 8]} />
    </svg>
  );
}
