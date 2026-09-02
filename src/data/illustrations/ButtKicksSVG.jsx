import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Light jog in place with the trailing heel kicked back toward the
// glute — the shin folds back rather than the knee driving forward.
export default function ButtKicksSVG() {
  const ankle = [120, 176];
  const toe = [136, 175];
  const knee = [118, 148];
  const hip = [120, 118];

  const kickKnee = [116, 133.8];
  const kickFoot = [94.9, 95.3];

  const shoulder = [124.4, 73.2];
  const head = [126.1, 55.2];
  const backElbow = [100, 90];
  const backHand = [85, 108];
  const frontElbow = [148, 82];
  const frontHand = [165, 96];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={kickKnee} width={16} color={PALETTE.pants} />
      <Capsule from={kickKnee} to={kickFoot} width={14} color={PALETTE.pants} />
      <Foot heel={kickFoot} toe={[kickFoot[0] - 10, kickFoot[1] - 12]} width={11} />

      <Capsule from={hip} to={knee} width={18} color={PALETTE.pants} />
      <Capsule from={knee} to={ankle} width={16} color={PALETTE.pants} />
      <Foot heel={ankle} toe={toe} />

      <Capsule from={hip} to={shoulder} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={backElbow} width={13} color={PALETTE.skin} />
      <Capsule from={backElbow} to={backHand} width={12} color={PALETTE.skin} />
      <Capsule from={shoulder} to={frontElbow} width={13} color={PALETTE.skin} />
      <Capsule from={frontElbow} to={frontHand} width={12} color={PALETTE.skin} />

      <Head at={head} />
    </svg>
  );
}
