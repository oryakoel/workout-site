import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Seated calmly, legs folded, one hand resting on the knee.
export default function SeatedBreathingSVG() {
  const hip = [120, 150];
  const knee = [95, 168];
  const foot = [122, 176];
  const toe = [136, 177];

  const shoulder = [122, 98];
  const head = [124, 80];
  const elbow = [100, 120];
  const hand = [92, 152];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={knee} width={18} color={PALETTE.pants} />
      <Capsule from={knee} to={foot} width={16} color={PALETTE.pants} />
      <Foot heel={foot} toe={toe} width={11} />

      <Capsule from={hip} to={shoulder} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={elbow} width={13} color={PALETTE.skin} />
      <Capsule from={elbow} to={hand} width={12} color={PALETTE.skin} />

      <Head at={head} />
    </svg>
  );
}
