import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Plank with one knee driven straight in toward the chest, the other
// leg long behind — the running-in-plank shape.
export default function MountainClimberSVG() {
  const shoulder = [70, 114];
  const head = [54, 100];
  const elbow = [68, 145];
  const hand = [70, 176];

  const hip = [140, 148];
  const farAnkle = [205, 168];
  const farToe = [220, 166];

  const drivenKnee = [110, 168];
  const drivenFoot = [95, 176];
  const drivenToe = [78, 175];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={farAnkle} width={17} color={PALETTE.pants} />
      <Foot heel={farAnkle} toe={farToe} />

      <Capsule from={hip} to={drivenKnee} width={16} color={PALETTE.pants} />
      <Capsule from={drivenKnee} to={drivenFoot} width={14} color={PALETTE.pants} />
      <Foot heel={drivenFoot} toe={drivenToe} width={11} />

      <Capsule from={shoulder} to={hip} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={elbow} width={13} color={PALETTE.skin} />
      <Capsule from={elbow} to={hand} width={12} color={PALETTE.skin} />

      <Head at={head} />
    </svg>
  );
}
