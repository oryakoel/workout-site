import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Seated, both legs extended together (unlike the single-leg hamstring
// stretch), folding deeply forward to reach both ankles.
export default function SeatedForwardFoldSVG() {
  const hip = [65, 150];
  const knee = [108, 154];
  const ankle = [148, 158];
  const toe = [152, 138];

  const shoulder = [113.1, 136.3];
  const head = [133, 134.6];
  const elbow = [144.6, 141.9];
  const hand = [171.8, 154.6];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={knee} width={19} color={PALETTE.pants} />
      <Capsule from={knee} to={ankle} width={17} color={PALETTE.pants} />
      <Foot heel={ankle} toe={toe} />

      <Capsule from={hip} to={shoulder} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={elbow} width={13} color={PALETTE.skin} />
      <Capsule from={elbow} to={hand} width={12} color={PALETTE.skin} />

      <Head at={head} />
    </svg>
  );
}
