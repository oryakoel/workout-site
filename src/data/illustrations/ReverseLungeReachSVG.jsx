import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Standing lunge with both arms reaching up and forward — a dynamic
// variant of the lunge hold, front knee bent, back leg stepped long.
export default function ReverseLungeReachSVG() {
  const frontAnkle = [165, 176];
  const frontToe = [183, 175];
  const frontKnee = [165, 134];
  const hip = [122, 124];
  const backKnee = [95, 152];
  const backAnkle = [70, 176];
  const backToe = [52, 175];

  const shoulder = [128, 76];
  const head = [130, 60];
  const elbow = [148, 55];
  const hand = [165, 35];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={backKnee} width={16} color={PALETTE.pants} />
      <Capsule from={backKnee} to={backAnkle} width={14} color={PALETTE.pants} />
      <Foot heel={backAnkle} toe={backToe} width={11} />

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
