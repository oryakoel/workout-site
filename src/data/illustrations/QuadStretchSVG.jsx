import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Standing on one leg, the other foot pulled up behind toward the glute
// and held there.
export default function QuadStretchSVG() {
  const ankle = [120, 176];
  const toe = [139, 175];
  const knee = [120, 134];
  const hip = [120, 90];

  const bentKnee = [108.3, 126.1];
  const bentFoot = [95.1, 91.5];
  const bentToe = [85, 105];

  const shoulder = [124.4, 40.2];
  const head = [126.1, 20.2];
  const elbow = [99.8, 57.4];
  const hand = [95.6, 87.1];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={bentKnee} width={16} color={PALETTE.pants} />
      <Capsule from={bentKnee} to={bentFoot} width={14} color={PALETTE.pants} />
      <Foot heel={bentFoot} toe={bentToe} width={11} />

      <Capsule from={hip} to={knee} width={18} color={PALETTE.pants} />
      <Capsule from={knee} to={ankle} width={16} color={PALETTE.pants} />
      <Foot heel={ankle} toe={toe} />

      <Capsule from={hip} to={shoulder} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={elbow} width={13} color={PALETTE.skin} />
      <Capsule from={elbow} to={hand} width={12} color={PALETTE.skin} />

      <Head at={head} />
    </svg>
  );
}
