import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Wide squat stance with the hip shifted toward one leg — the moment of
// stepping out into a squat before walking back to center.
export default function StepOutSquatWalkSVG() {
  const hip = [128, 148];

  const nearKnee = [150, 162];
  const nearAnkle = [148, 176];
  const nearToe = [166, 175];

  const farKnee = [90, 158];
  const farAnkle = [58, 174];
  const farToe = [42, 172];

  const shoulder = [132, 100];
  const head = [134, 82];
  const elbow = [160, 118];
  const hand = [178, 132];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={farKnee} width={17} color={PALETTE.pants} />
      <Capsule from={farKnee} to={farAnkle} width={15} color={PALETTE.pants} />
      <Foot heel={farAnkle} toe={farToe} width={11} />

      <Capsule from={hip} to={nearKnee} width={18} color={PALETTE.pants} />
      <Capsule from={nearKnee} to={nearAnkle} width={16} color={PALETTE.pants} />
      <Foot heel={nearAnkle} toe={nearToe} />

      <Capsule from={hip} to={shoulder} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={elbow} width={13} color={PALETTE.skin} />
      <Capsule from={elbow} to={hand} width={12} color={PALETTE.skin} />

      <Head at={head} />
    </svg>
  );
}
