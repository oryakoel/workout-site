import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Seated pigeon: front shin angled across the body, back leg extended
// long behind, torso upright with a supporting hand on the floor.
export default function PigeonPoseSVG() {
  const hip = [110, 158];

  const frontKnee = [145, 168];
  const frontFoot = [95, 172];
  const frontToe = [80, 170];

  const backKnee = [66.7, 165.6];
  const backAnkle = [25.3, 172.9];
  const backToe = [10, 168];

  const shoulder = [158.3, 145.1];
  const head = [177.6, 139.9];
  const elbow = [150, 160];
  const hand = [145, 176];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={backKnee} width={16} color={PALETTE.pants} />
      <Capsule from={backKnee} to={backAnkle} width={14} color={PALETTE.pants} />
      <Foot heel={backAnkle} toe={backToe} width={11} />

      <Capsule from={hip} to={frontKnee} width={18} color={PALETTE.pants} />
      <Capsule from={frontKnee} to={frontFoot} width={16} color={PALETTE.pants} />
      <Foot heel={frontFoot} toe={frontToe} width={11} />

      <Capsule from={hip} to={shoulder} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={elbow} width={13} color={PALETTE.skin} />
      <Capsule from={elbow} to={hand} width={12} color={PALETTE.skin} />

      <Head at={head} />
    </svg>
  );
}
