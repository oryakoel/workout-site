import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Lying with knees bent, torso curled slightly up, one arm reaching
// sideways down toward the heel.
export default function HeelTouchesSVG() {
  const hip = [100, 176];
  const knee = [130, 150];
  const foot = [118, 176];
  const toe = [135, 175];

  const shoulder = [55, 172];
  const head = [38, 164];
  const elbow = [80, 176];
  const hand = [108, 177];

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
