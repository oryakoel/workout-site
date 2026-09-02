import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Hands gripping the edge of a bench behind the body, hips dipping down
// in front of it, legs extended forward.
export default function TricepDipSVG() {
  const benchY = 145;

  const hand = [45, benchY];
  const elbow = [65, 168];
  const shoulder = [95, 160];
  const hip = [112, 172];

  const knee = [165, 174];
  const ankle = [200, 176];
  const toe = [215, 175];

  const head = [102, 142];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />
      <line x1={12} y1={benchY} x2={78} y2={benchY} stroke="#2B4B41" strokeWidth="4" />

      <Capsule from={hip} to={knee} width={17} color={PALETTE.pants} />
      <Capsule from={knee} to={ankle} width={15} color={PALETTE.pants} />
      <Foot heel={ankle} toe={toe} width={11} />

      <Capsule from={shoulder} to={hip} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={elbow} width={13} color={PALETTE.skin} />
      <Capsule from={elbow} to={hand} width={12} color={PALETTE.skin} />

      <Head at={head} />
    </svg>
  );
}
