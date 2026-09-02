import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Straight-arm plank: one continuous line from shoulder through hip to
// the toes (the "straight body line" cue), with a vertical support arm.
export default function PlankSVG() {
  const toe = [198, 176];
  const ankle = [190, 168];
  const hip = [140, 148];
  const shoulder = [70, 114];
  const head = [54, 100];

  const elbow = [68, 145];
  const hand = [70, 176];

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
