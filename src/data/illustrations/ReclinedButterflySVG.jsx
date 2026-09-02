import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Lying flat on the back, soles together, knee dropped — the reclined,
// gravity-only counterpart to the seated butterfly stretch.
export default function ReclinedButterflySVG() {
  const shoulder = [50, 176];
  const head = [35, 172];
  const hip = [100, 176];

  const knee = [112, 140];
  const foot = [95, 168];
  const toe = [80, 166];

  const hand = [15, 176];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={knee} width={18} color={PALETTE.pants} />
      <Capsule from={knee} to={foot} width={16} color={PALETTE.pants} />
      <Foot heel={foot} toe={toe} width={11} />

      <Capsule from={shoulder} to={hip} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={hand} width={12} color={PALETTE.skin} />

      <Head at={head} hairOffset={[-4, 8]} />
    </svg>
  );
}
