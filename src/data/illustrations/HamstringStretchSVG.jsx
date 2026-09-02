import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Seated, one leg extended straight with foot flexed, reaching the torso
// forward over it. The tucked leg stays low and out of the way so the
// extended leg reads clearly.
export default function HamstringStretchSVG() {
  const hip = [70, 150];
  const knee = [113.8, 153.8];
  const ankle = [153.6, 157.3];
  const toe = [157.1, 137.6];

  const tuckedKnee = [46, 130];
  const tuckedFoot = [76, 148];
  const tuckedToe = [88, 152];

  const shoulder = [97.5, 110.7];
  const head = [112.9, 97.8];
  const elbow = [122.1, 127.9];
  const hand = [138.8, 147.8];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={tuckedKnee} width={15} color={PALETTE.pants} />
      <Capsule from={tuckedKnee} to={tuckedFoot} width={14} color={PALETTE.pants} />
      <Foot heel={tuckedFoot} toe={tuckedToe} width={11} />

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
