import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Lying on the back, one leg raised straight toward the ceiling and
// held, the other leg long on the floor.
export default function ReclinedLegStretchSVG() {
  const shoulder = [40, 176];
  const head = [25, 172];
  const hip = [85, 176];

  const ankle = [160, 176];
  const toe = [178, 175];

  const raisedKnee = [81.2, 132.2];
  const raisedFoot = [77.5, 90.3];
  const raisedToe = [80.6, 72.6];

  const elbow = [55, 150];
  const hand = [70, 110];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={ankle} width={17} color={PALETTE.pants} />
      <Foot heel={ankle} toe={toe} />

      <Capsule from={hip} to={raisedKnee} width={18} color={PALETTE.pants} />
      <Capsule from={raisedKnee} to={raisedFoot} width={16} color={PALETTE.pants} />
      <Foot heel={raisedFoot} toe={raisedToe} />

      <Capsule from={shoulder} to={hip} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={elbow} width={13} color={PALETTE.skin} />
      <Capsule from={elbow} to={hand} width={12} color={PALETTE.skin} />

      <Head at={head} hairOffset={[-4, 8]} />
    </svg>
  );
}
