import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// On forearms and knees, knees pressed wide apart, hips sinking back and
// down between them.
export default function FrogPoseSVG() {
  const forearmHand = [40, 176];
  const shoulder = [68, 158];
  const head = [48, 150];

  const hip = [110, 158];
  const knee = [145, 130];
  const foot = [125, 170];
  const toe = [105, 175];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={knee} width={17} color={PALETTE.pants} />
      <Capsule from={knee} to={foot} width={15} color={PALETTE.pants} />
      <Foot heel={foot} toe={toe} width={11} />

      <Capsule from={shoulder} to={hip} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={forearmHand} width={13} color={PALETTE.skin} />

      <Head at={head} />
    </svg>
  );
}
