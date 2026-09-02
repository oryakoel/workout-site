import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Standing, both legs straight, front leg forward — the torso folds
// forward over the front leg while the back leg stays long behind.
export default function PyramidPoseSVG() {
  const hip = [135, 120];

  const backKnee = [112.9, 150.9];
  const backAnkle = [95, 176];
  const backToe = [78, 175];

  const frontKnee = [157.1, 150.9];
  const frontAnkle = [175, 176];
  const frontToe = [192, 175];

  const shoulder = [164, 160.7];
  const head = [174, 172];
  const elbow = [172, 168];
  const hand = [178, 177];

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
