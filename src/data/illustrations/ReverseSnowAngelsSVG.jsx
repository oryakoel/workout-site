import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Lying face-down with the chest lifted, both arms swept out wide —
// mid-arc of a reverse snow angel.
export default function ReverseSnowAngelsSVG() {
  const hip = [130, 176];
  const ankle = [195, 176];
  const toe = [212, 175];

  const shoulder = [90, 150];
  const head = [72, 138];

  const elbow = [55, 165];
  const hand = [35, 145];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={ankle} width={17} color={PALETTE.pants} />
      <Foot heel={ankle} toe={toe} />

      <Capsule from={shoulder} to={hip} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={elbow} width={13} color={PALETTE.skin} />
      <Capsule from={elbow} to={hand} width={12} color={PALETTE.skin} />

      <Head at={head} hairOffset={[-4, -10]} />
    </svg>
  );
}
