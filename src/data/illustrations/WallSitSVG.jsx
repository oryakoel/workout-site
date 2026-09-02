import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX, FLOOR_Y } from "./figure.jsx";

// Back flat against a wall, knees bent to 90° as if sitting in an
// invisible chair, arms resting at the sides (not reaching forward, the
// wall does the balancing).
export default function WallSitSVG() {
  const wallX = 60;

  const ankle = [110, 176];
  const toe = [128, 175];
  const knee = [108, 130];
  const hip = [60, 130];
  const shoulder = [60, 75];
  const head = [60, 55];
  const elbow = [40, 100];
  const hand = [35, 130];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />
      <line x1={wallX} y1={20} x2={wallX} y2={FLOOR_Y} stroke="#2B4B41" strokeWidth="4" />

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
