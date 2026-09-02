import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Lying, one knee drawn up, torso curled and twisted so the elbow
// reaches toward it — the crossing moment of the twist.
export default function CrissCrossObliqueCrunchSVG() {
  const hip = [100, 176];

  const knee = [122, 138];
  const foot = [138, 118];
  const toe = [148, 103];

  const shoulder = [55, 165];
  const head = [42, 152];
  const elbow = [82, 148];
  const hand = [108, 138];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={knee} width={18} color={PALETTE.pants} />
      <Capsule from={knee} to={foot} width={16} color={PALETTE.pants} />
      <Foot heel={foot} toe={toe} width={11} />

      <Capsule from={shoulder} to={hip} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={elbow} width={13} color={PALETTE.skin} />
      <Capsule from={elbow} to={hand} width={12} color={PALETTE.skin} />

      <Head at={head} hairOffset={[-4, 8]} />
    </svg>
  );
}
