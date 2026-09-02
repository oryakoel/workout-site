import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// The push-up half of the combo: plank with elbows bent, chest low —
// the tips cover the mountain-climber half that follows.
export default function PushUpMountainClimberComboSVG() {
  const toe = [198, 176];
  const ankle = [190, 168];
  const hip = [140, 158];
  const shoulder = [70, 138];
  const head = [54, 128];

  const elbow = [55, 158];
  const hand = [66, 176];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={ankle} width={17} color={PALETTE.pants} />
      <Foot heel={ankle} toe={toe} />

      <Capsule from={shoulder} to={hip} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={elbow} width={13} color={PALETTE.skin} />
      <Capsule from={elbow} to={hand} width={12} color={PALETTE.skin} />

      <Head at={head} />
    </svg>
  );
}
