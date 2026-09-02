import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Lying on the back, one knee hugged to the chest with both hands, the
// other leg long on the floor.
export default function KneeToChestSVG() {
  const shoulder = [40, 176];
  const head = [25, 172];
  const hip = [85, 176];

  const ankle = [160, 176];
  const toe = [178, 175];

  const knee = [55, 145];
  const foot = [45, 120];
  const footToe = [50, 105];

  const elbow = [65, 160];
  const hand = [50, 140];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={ankle} width={17} color={PALETTE.pants} />
      <Foot heel={ankle} toe={toe} />

      <Capsule from={hip} to={knee} width={16} color={PALETTE.pants} />
      <Capsule from={knee} to={foot} width={14} color={PALETTE.pants} />
      <Foot heel={foot} toe={footToe} width={11} />

      <Capsule from={shoulder} to={hip} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={elbow} width={13} color={PALETTE.skin} />
      <Capsule from={elbow} to={hand} width={12} color={PALETTE.skin} />

      <Head at={head} hairOffset={[-4, 8]} />
    </svg>
  );
}
