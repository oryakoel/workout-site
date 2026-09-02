import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Plank position rotated onto the support arm, the free arm reaching
// straight up to the ceiling — the "T" moment of the rotation.
export default function PushUpTRotationSVG() {
  const toe = [198, 176];
  const ankle = [190, 168];
  const hip = [140, 148];
  const shoulder = [70, 114];
  const head = [54, 100];

  const supportElbow = [68, 145];
  const supportHand = [70, 176];

  const raisedElbow = [80, 90];
  const raisedHand = [90, 55];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={ankle} width={17} color={PALETTE.pants} />
      <Foot heel={ankle} toe={toe} />

      <Capsule from={shoulder} to={hip} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={supportElbow} width={13} color={PALETTE.skin} />
      <Capsule from={supportElbow} to={supportHand} width={12} color={PALETTE.skin} />
      <Capsule from={shoulder} to={raisedElbow} width={13} color={PALETTE.skin} />
      <Capsule from={raisedElbow} to={raisedHand} width={12} color={PALETTE.skin} />

      <Head at={head} />
    </svg>
  );
}
