import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Lying face-down, chest lifted (cobra), one knee bent with the
// same-side hand reaching back to hold the foot toward the glutes.
export default function CobraQuadStretchSVG() {
  const hip = [110, 176];
  const shoulder = [77.9, 137.7];
  const head = [62.6, 124.8];

  const ankle = [185, 176];
  const toe = [202, 175];

  const knee = [150, 178];
  const foot = [143.1, 138.6];
  const footToe = [148.6, 123.6];

  const elbow = [100, 150];
  const hand = [140, 140];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={ankle} width={17} color={PALETTE.pants} />
      <Foot heel={ankle} toe={toe} />

      <Capsule from={hip} to={knee} width={16} color={PALETTE.pants} />
      <Capsule from={knee} to={foot} width={14} color={PALETTE.pants} />
      <Foot heel={foot} toe={footToe} width={11} />

      <Capsule from={shoulder} to={hip} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={elbow} width={13} color={PALETTE.skin} />
      <Capsule from={elbow} to={hand} width={12} color={PALETTE.skin} />

      <Head at={head} hairOffset={[-4, -10]} />
    </svg>
  );
}
