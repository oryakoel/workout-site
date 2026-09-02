import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Side-to-side splits: legs extended along the floor in both directions
// (same leg layout as the front-back splits) but the torso leans forward
// with both hands reaching to the floor between the legs — the cue that
// separates it from the upright, side-supported front splits.
export default function MiddleSplitsSVG() {
  const hip = [120, 168];

  const backKnee = [76.1, 171.5];
  const backAnkle = [45, 174];
  const backToe = [28, 173];

  const frontKnee = [164, 170.3];
  const frontAnkle = [195, 172];
  const frontToe = [212, 171];

  const shoulder = [137.1, 121];
  const head = [143.9, 102.2];
  const elbow = [142.7, 152.5];
  const hand = [142, 176];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={backKnee} width={16} color={PALETTE.pants} />
      <Capsule from={backKnee} to={backAnkle} width={14} color={PALETTE.pants} />
      <Foot heel={backAnkle} toe={backToe} width={11} />

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
