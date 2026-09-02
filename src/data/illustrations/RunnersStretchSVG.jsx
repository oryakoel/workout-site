import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Lunge with the front leg straightened and hips sitting back over it —
// the straight front leg and downward-folding torso are what separate
// this from the hip-flexor lunge (front knee stays bent there).
export default function RunnersStretchSVG() {
  const hip = [128, 136];

  const backKnee = [118, 172];
  const backFoot = [102, 176];
  const backToe = [84, 175];

  const frontKnee = [167, 156.3];
  const frontAnkle = [205, 176];
  const frontToe = [222, 174];

  const shoulder = [177.2, 144.7];
  const head = [196.5, 149.9];
  const elbow = [195, 162];
  const hand = [210, 176];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={backKnee} width={16} color={PALETTE.pants} />
      <Capsule from={backKnee} to={backFoot} width={14} color={PALETTE.pants} />
      <Foot heel={backFoot} toe={backToe} width={11} />

      <Capsule from={hip} to={frontKnee} width={18} color={PALETTE.pants} />
      <Capsule from={frontKnee} to={frontAnkle} width={16} color={PALETTE.pants} />
      <Foot heel={frontAnkle} toe={frontToe} />

      <Capsule from={hip} to={shoulder} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={elbow} width={13} color={PALETTE.skin} />
      <Capsule from={elbow} to={hand} width={12} color={PALETTE.skin} />

      <Head at={head} />
    </svg>
  );
}
