import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Standing, small hop with both forearms circling out from the sides —
// miming turning a jump rope with no rope.
export default function GhostRopeSVG() {
  const ankle = [120, 176];
  const toe = [136, 172];
  const knee = [118, 148];
  const hip = [118, 100];

  const shoulder = [116, 55];
  const head = [118, 38];

  const rightElbow = [148, 60];
  const rightHand = [162, 82];
  const leftElbow = [88, 60];
  const leftHand = [74, 82];

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
