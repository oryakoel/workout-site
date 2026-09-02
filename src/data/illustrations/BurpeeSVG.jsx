import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// The explosive finish of a burpee: jumping up with both arms overhead.
export default function BurpeeSVG() {
  const ankle = [120, 176];
  const toe = [134, 174];
  const knee = [116, 145];
  const hip = [118, 105];

  const shoulder = [116, 60];
  const head = [118, 42];

  const rightElbow = [140, 40];
  const rightHand = [155, 15];
  const leftElbow = [92, 40];
  const leftHand = [78, 15];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={knee} width={18} color={PALETTE.pants} />
      <Capsule from={knee} to={ankle} width={16} color={PALETTE.pants} />
      <Foot heel={ankle} toe={toe} />

      <Capsule from={hip} to={shoulder} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={rightElbow} width={13} color={PALETTE.skin} />
      <Capsule from={rightElbow} to={rightHand} width={12} color={PALETTE.skin} />
      <Capsule from={shoulder} to={leftElbow} width={13} color={PALETTE.skin} />
      <Capsule from={leftElbow} to={leftHand} width={12} color={PALETTE.skin} />

      <Head at={head} />
    </svg>
  );
}
