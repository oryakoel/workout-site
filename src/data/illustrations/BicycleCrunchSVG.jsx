import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Lying, one leg extended low and raised off the floor, the other bent
// with the opposite elbow reaching toward it — the pedaling twist.
export default function BicycleCrunchSVG() {
  const hip = [100, 176];

  const straightKnee = [155, 168];
  const straightAnkle = [188, 172];
  const straightToe = [204, 168];

  const bentKnee = [118, 138];
  const bentFoot = [132, 115];
  const bentToe = [142, 100];

  const shoulder = [55, 165];
  const head = [42, 152];
  const elbow = [80, 148];
  const hand = [104, 140];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={straightKnee} width={18} color={PALETTE.pants} />
      <Capsule from={straightKnee} to={straightAnkle} width={16} color={PALETTE.pants} />
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
