import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Seated, soles of the feet drawn together with the knee dropped low
// toward the floor — that downward knee is what reads as "hips opening".
export default function ButterflyStretchSVG() {
  const hip = [120, 146];
  const knee = [97, 165.3];
  const foot = [121.4, 174.2];
  const toe = [136, 177];

  const shoulder = [124.4, 96.2];
  const head = [126.1, 76.2];
  const elbow = [99.8, 113.4];
  const hand = [94.9, 141];

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
