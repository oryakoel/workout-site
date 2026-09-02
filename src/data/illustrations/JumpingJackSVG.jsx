import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// A mid-stride jump (side view): one arm raised, legs split front/back —
// reads as motion rather than a held stretch.
export default function JumpingJackSVG() {
  const hip = [120, 140];
  const shoulder = [122, 95];
  const head = [124, 78];
  const elbow = [100, 60];
  const hand = [80, 45];

  const frontKnee = [150, 158];
  const frontFoot = [168, 176];
  const frontToe = [184, 175];
  const backKnee = [95, 160];
  const backFoot = [75, 176];
  const backToe = [59, 175];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={backKnee} width={16} color={PALETTE.pants} />
      <Capsule from={backKnee} to={backFoot} width={14} color={PALETTE.pants} />
      <Foot heel={backFoot} toe={backToe} width={11} />

      <Capsule from={hip} to={frontKnee} width={18} color={PALETTE.pants} />
      <Capsule from={frontKnee} to={frontFoot} width={16} color={PALETTE.pants} />
      <Foot heel={frontFoot} toe={frontToe} />

      <Capsule from={hip} to={shoulder} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={elbow} width={13} color={PALETTE.skin} />
      <Capsule from={elbow} to={hand} width={12} color={PALETTE.skin} />

      <Head at={head} />
    </svg>
  );
}
