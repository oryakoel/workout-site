import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Mid-transition between forearm plank and hand plank: one arm already
// pressed up on the hand, the other still down on the forearm.
export default function CommandoSVG() {
  const toe = [198, 176];
  const ankle = [190, 168];
  const hip = [140, 150];
  const shoulder = [70, 122];
  const head = [54, 108];

  const downElbow = [66, 152];
  const downForearmEnd = [95, 168];

  const upHand = [70, 176];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={ankle} width={17} color={PALETTE.pants} />
      <Foot heel={ankle} toe={toe} />

      <Capsule from={shoulder} to={hip} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={downElbow} width={13} color={PALETTE.skin} />
      <Capsule from={downElbow} to={downForearmEnd} width={12} color={PALETTE.skin} />
      <Capsule from={shoulder} to={upHand} width={12} color={PALETTE.skin} />

      <Head at={head} />
    </svg>
  );
}
