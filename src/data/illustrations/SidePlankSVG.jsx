import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Propped on one forearm with the body in a straight diagonal line, hips
// lifted, the free arm reaching straight up.
export default function SidePlankSVG() {
  const hip = [145, 150];
  const shoulder = [100, 120];
  const head = [83.3, 108.9];

  const ankle = [195, 172];
  const toe = [210, 170];

  const supportElbow = [95, 148];
  const supportHand = [92, 176];

  const freeElbow = [85, 90];
  const freeHand = [78, 62];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={ankle} width={17} color={PALETTE.pants} />
      <Foot heel={ankle} toe={toe} width={11} />

      <Capsule from={shoulder} to={hip} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={supportElbow} width={13} color={PALETTE.skin} />
      <Capsule from={supportElbow} to={supportHand} width={12} color={PALETTE.skin} />
      <Capsule from={shoulder} to={freeElbow} width={13} color={PALETTE.skin} />
      <Capsule from={freeElbow} to={freeHand} width={12} color={PALETTE.skin} />

      <Head at={head} />
    </svg>
  );
}
