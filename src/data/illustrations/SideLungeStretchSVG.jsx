import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Wide stance, weight sunk into one bent knee while the other leg
// extends straight out to the side — an inner-thigh (adductor) stretch.
export default function SideLungeStretchSVG() {
  const hip = [120, 145];

  const knee = [135, 158];
  const ankle = [130, 176];
  const toe = [148, 175];

  const straightKnee = [84.2, 157.8];
  const straightAnkle = [50, 170];
  const straightToe = [35, 172];

  const shoulder = [124.4, 95.2];
  const head = [126.1, 75.3];
  const elbow = [140, 110];
  const hand = [150, 130];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={straightKnee} width={16} color={PALETTE.pants} />
      <Capsule from={straightKnee} to={straightAnkle} width={14} color={PALETTE.pants} />
      <Foot heel={straightAnkle} toe={straightToe} width={11} />

      <Capsule from={hip} to={knee} width={18} color={PALETTE.pants} />
      <Capsule from={knee} to={ankle} width={16} color={PALETTE.pants} />
      <Foot heel={ankle} toe={toe} />

      <Capsule from={hip} to={shoulder} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={elbow} width={13} color={PALETTE.skin} />
      <Capsule from={elbow} to={hand} width={12} color={PALETTE.skin} />

      <Head at={head} />
    </svg>
  );
}
