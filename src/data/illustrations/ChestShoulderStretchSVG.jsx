import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Standing tall, hands clasped behind the back, chest lifted open.
export default function ChestShoulderStretchSVG() {
  const ankle = [120, 176];
  const toe = [139, 175];
  const knee = [118.5, 134];
  const hip = [117, 90];

  const shoulder = [108.3, 40.8];
  const head = [106, 20.9];
  const elbow = [78.8, 46];
  const hand = [69.2, 72.3];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

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
