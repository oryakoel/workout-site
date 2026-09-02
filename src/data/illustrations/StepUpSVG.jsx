import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// One foot planted on a raised step/box, driving up while the other leg
// trails behind on the floor.
export default function StepUpSVG() {
  const platformY = 142;

  const frontAnkle = [148, platformY];
  const frontToe = [166, platformY - 2];
  const frontKnee = [150, 112];
  const hip = [122, 98];

  const backKnee = [95, 132];
  const backAnkle = [75, 176];
  const backToe = [58, 175];

  const shoulder = [124, 55];
  const head = [126, 38];
  const elbow = [100, 72];
  const hand = [85, 92];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />
      <line x1={110} y1={platformY} x2={226} y2={platformY} stroke="#2B4B41" strokeWidth="4" />

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
