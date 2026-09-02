import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Driving off a rear step into a high knee — the same standing-leg /
// driven-knee shape as the high-knees cardio drill, arms pumping.
export default function RunnerKneeDriveSVG() {
  const ankle = [120, 176];
  const toe = [136, 175];
  const knee = [118, 150];
  const hip = [120, 120];

  const raisedKnee = [145, 110];
  const raisedFoot = [130, 130];
  const raisedToe = [118, 145];

  const shoulder = [126, 75];
  const head = [128, 58];
  const backElbow = [100, 90];
  const backHand = [85, 110];
  const frontElbow = [150, 85];
  const frontHand = [168, 100];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={raisedKnee} width={16} color={PALETTE.pants} />
      <Capsule from={raisedKnee} to={raisedFoot} width={14} color={PALETTE.pants} />
      <Foot heel={raisedFoot} toe={raisedToe} width={11} />

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
