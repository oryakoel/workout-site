import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Plank with one knee twisted in toward the opposite elbow — the far
// leg stays long and grounded.
export default function PlankKneeRotationSVG() {
  const shoulder = [70, 114];
  const head = [54, 100];
  const elbow = [68, 145];
  const hand = [70, 176];

  const hip = [140, 148];
  const farAnkle = [200, 170];
  const farToe = [216, 168];

  const rotatedKnee = [95, 160];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={farAnkle} width={17} color={PALETTE.pants} />
      <Foot heel={farAnkle} toe={farToe} />
      <Capsule from={hip} to={rotatedKnee} width={16} color={PALETTE.pants} />

      <Capsule from={shoulder} to={hip} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={elbow} width={13} color={PALETTE.skin} />
      <Capsule from={elbow} to={hand} width={12} color={PALETTE.skin} />

      <Head at={head} />
    </svg>
  );
}
