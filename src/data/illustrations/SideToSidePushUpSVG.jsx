import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// A wide-hand plank with the body shifted low over one arm — the bottom
// of a push-up mid-crawl toward that side.
export default function SideToSidePushUpSVG() {
  const toe = [198, 176];
  const ankle = [190, 168];
  const hip = [140, 148];
  const shoulder = [95, 128];
  const head = [80, 116];

  const nearElbow = [90, 155];
  const nearHand = [95, 176];

  const farHand = [150, 176];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={ankle} width={17} color={PALETTE.pants} />
      <Foot heel={ankle} toe={toe} />

      <Capsule from={shoulder} to={hip} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={nearElbow} width={13} color={PALETTE.skin} />
      <Capsule from={nearElbow} to={nearHand} width={12} color={PALETTE.skin} />
      <Capsule from={shoulder} to={farHand} width={12} color={PALETTE.skin} />

      <Head at={head} />
    </svg>
  );
}
