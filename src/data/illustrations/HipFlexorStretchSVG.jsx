import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Kneeling lunge: front knee stacked over the ankle, back knee and shin
// trailing on the floor.
export default function HipFlexorStretchSVG() {
  const frontAnkle = [178, 176];
  const frontToe = [196, 175];
  const frontKnee = [182.5, 134];
  const hip = [135.5, 122.6];

  const backKnee = [127.9, 165.9];
  const backFoot = [90.5, 172.5];
  const backToe = [72, 175];

  const shoulder = [131.1, 72.8];
  const head = [129.4, 52.8];
  const elbow = [154.1, 92.1];
  const hand = [168.1, 116.3];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={backKnee} width={16} color={PALETTE.pants} />
      <Capsule from={backKnee} to={backFoot} width={14} color={PALETTE.pants} />
      <Foot heel={backFoot} toe={backToe} width={11} />

      <Capsule from={hip} to={frontKnee} width={18} color={PALETTE.pants} />
      <Capsule from={frontKnee} to={frontAnkle} width={16} color={PALETTE.pants} />
      <Foot heel={frontAnkle} toe={frontToe} />

      <Capsule from={hip} to={shoulder} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={elbow} width={13} color={PALETTE.skin} />
      <Capsule from={elbow} to={hand} width={12} color={PALETTE.skin} />

      <Head at={head} />
    </svg>
  );
}
