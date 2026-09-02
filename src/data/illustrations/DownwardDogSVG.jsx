import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Inverted-V shape: hips as the peak, straight line down to the hands in
// front and straight line down to the feet behind, head hanging between
// the arms.
export default function DownwardDogSVG() {
  const hip = [120, 85];

  const shoulder = [150.5, 124.7];
  const elbow = [170, 150.1];
  const hand = [188, 176];
  const head = [162.7, 140.6];

  const knee = [114.2, 128.6];
  const ankle = [108, 176];
  const toe = [92, 175];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

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
