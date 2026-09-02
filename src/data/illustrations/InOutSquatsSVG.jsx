import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Jump-squat with feet wide apart, knees bent — the "out" position of
// the jack-squat.
export default function InOutSquatsSVG() {
  const hip = [120, 140];

  const rightKnee = [155, 158];
  const rightAnkle = [168, 176];
  const rightToe = [186, 175];

  const leftKnee = [85, 158];
  const leftAnkle = [72, 176];
  const leftToe = [54, 175];

  const shoulder = [122, 92];
  const head = [124, 74];
  const elbow = [148, 105];
  const hand = [165, 122];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={leftKnee} width={17} color={PALETTE.pants} />
      <Capsule from={leftKnee} to={leftAnkle} width={15} color={PALETTE.pants} />
      <Foot heel={leftAnkle} toe={leftToe} width={11} />

      <Capsule from={hip} to={rightKnee} width={18} color={PALETTE.pants} />
      <Capsule from={rightKnee} to={rightAnkle} width={16} color={PALETTE.pants} />
      <Foot heel={rightAnkle} toe={rightToe} />

      <Capsule from={hip} to={shoulder} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={elbow} width={13} color={PALETTE.skin} />
      <Capsule from={elbow} to={hand} width={12} color={PALETTE.skin} />

      <Head at={head} />
    </svg>
  );
}
