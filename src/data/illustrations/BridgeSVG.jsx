import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Lying on the back, hips lifted off the floor with knees bent and feet
// planted — the classic glute bridge silhouette.
export default function BridgeSVG() {
  const head = [38, 170];
  const shoulder = [50, 176];
  const hip = [95, 150];
  const knee = [140, 168];
  const ankle = [150, 176];
  const toe = [168, 175];

  const hand = [20, 176];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={knee} width={18} color={PALETTE.pants} />
      <Capsule from={knee} to={ankle} width={16} color={PALETTE.pants} />
      <Foot heel={ankle} toe={toe} />

      <Capsule from={shoulder} to={hip} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={hand} width={12} color={PALETTE.skin} />

      <Head at={head} hairOffset={[-4, 8]} />
    </svg>
  );
}
