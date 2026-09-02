import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Mid-rep push-up: elbows bent to roughly a right angle, body still in
// one straight line from shoulders to heels.
export default function BasicPushUpSVG() {
  const toe = [198, 176];
  const ankle = [190, 168];
  const hip = [140, 152];
  const shoulder = [70, 122];
  const head = [54, 110];

  const elbow = [90, 150];
  const hand = [70, 176];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={ankle} width={17} color={PALETTE.pants} />
      <Foot heel={ankle} toe={toe} />

      <Capsule from={shoulder} to={hip} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={elbow} width={13} color={PALETTE.skin} />
      <Capsule from={elbow} to={hand} width={12} color={PALETTE.skin} />

      <Head at={head} />
    </svg>
  );
}
