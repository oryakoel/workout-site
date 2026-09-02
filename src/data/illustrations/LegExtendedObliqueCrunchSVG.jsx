import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Lying, one leg extended long and low, the other bent — torso curled
// and twisting toward the bent knee, hand behind the head.
export default function LegExtendedObliqueCrunchSVG() {
  const hip = [95, 176];

  const straightAnkle = [188, 176];
  const straightToe = [204, 175];

  const bentKnee = [122, 148];
  const bentFoot = [110, 176];
  const bentToe = [126, 175];

  const shoulder = [52, 170];
  const head = [36, 160];
  const elbow = [50, 148];
  const hand = [35, 152];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={straightAnkle} width={17} color={PALETTE.pants} />
      <Foot heel={straightAnkle} toe={straightToe} width={11} />

      <Capsule from={hip} to={bentKnee} width={18} color={PALETTE.pants} />
      <Capsule from={bentKnee} to={bentFoot} width={16} color={PALETTE.pants} />
      <Foot heel={bentFoot} toe={bentToe} width={11} />

      <Capsule from={shoulder} to={hip} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={elbow} width={13} color={PALETTE.skin} />
      <Capsule from={elbow} to={hand} width={12} color={PALETTE.skin} />

      <Head at={head} hairOffset={[-4, 8]} />
    </svg>
  );
}
