import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Pike position (hips high, like downward dog) with one hand lifted off
// the floor to tap the opposite shoulder.
export default function PikeShoulderTapsSVG() {
  const hip = [120, 85];

  const knee = [114.2, 128.6];
  const ankle = [108, 176];
  const toe = [92, 175];

  const groundShoulder = [150.5, 124.7];
  const groundHand = [188, 176];

  const tapShoulder = [126, 118];
  const tapElbow = [110, 100];
  const tapHand = [148, 130];

  const head = [162.7, 140.6];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={knee} width={18} color={PALETTE.pants} />
      <Capsule from={knee} to={ankle} width={16} color={PALETTE.pants} />
      <Foot heel={ankle} toe={toe} />

      <Capsule from={hip} to={groundShoulder} width={20} color={PALETTE.shirt} />
      <Capsule from={groundShoulder} to={groundHand} width={13} color={PALETTE.skin} />
      <Capsule from={tapShoulder} to={tapElbow} width={13} color={PALETTE.skin} />
      <Capsule from={tapElbow} to={tapHand} width={12} color={PALETTE.skin} />

      <Head at={head} />
    </svg>
  );
}
