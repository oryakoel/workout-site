import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Seated, the opposite ankle resting across the bent knee (a "4" shape),
// pulling the shin toward the chest.
export default function SeatedFigure4SVG() {
  const hip = [110, 155];

  const knee = [131, 118.6];
  const footBottom = [168.6, 132.3];
  const toeBottom = [180, 120];

  const topKnee = [90, 148];
  const topAnkle = [128, 122];

  const shoulder = [127.1, 108];
  const head = [137.1, 90.7];
  const elbow = [150, 110];
  const hand = [160, 128];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={topKnee} width={15} color={PALETTE.pants} />
      <Capsule from={topKnee} to={topAnkle} width={13} color={PALETTE.pants} />

      <Capsule from={hip} to={knee} width={18} color={PALETTE.pants} />
      <Capsule from={knee} to={footBottom} width={16} color={PALETTE.pants} />
      <Foot heel={footBottom} toe={toeBottom} width={11} />

      <Capsule from={hip} to={shoulder} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={elbow} width={13} color={PALETTE.skin} />
      <Capsule from={elbow} to={hand} width={12} color={PALETTE.skin} />

      <Head at={head} />
    </svg>
  );
}
