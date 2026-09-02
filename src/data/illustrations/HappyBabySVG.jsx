import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Lying on the back, knee drawn toward the armpit with the foot held up
// in the air — playful, both sides do the same thing.
export default function HappyBabySVG() {
  const shoulder = [70, 176];
  const head = [55, 172];
  const hip = [110, 176];

  const knee = [84.3, 145.4];
  const foot = [103.3, 112.5];
  const toe = [106.1, 96.7];

  const elbow = [75, 150];
  const hand = [95, 120];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={knee} width={17} color={PALETTE.pants} />
      <Capsule from={knee} to={foot} width={15} color={PALETTE.pants} />
      <Foot heel={foot} toe={toe} width={11} />

      <Capsule from={shoulder} to={hip} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={elbow} width={13} color={PALETTE.skin} />
      <Capsule from={elbow} to={hand} width={12} color={PALETTE.skin} />

      <Head at={head} hairOffset={[-4, 8]} />
    </svg>
  );
}
