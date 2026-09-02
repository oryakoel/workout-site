import { Capsule, Foot, Head, Ground, PALETTE, VIEWBOX } from "./figure.jsx";

// Reverse plank on the hands, hips lifted, one knee driven up toward
// the chest.
export default function ReversePlankKneeDriveSVG() {
  const hand = [190, 176];
  const shoulder = [155, 140];
  const head = [168, 122];
  const hip = [100, 158];

  const straightAnkle = [40, 168];
  const straightToe = [22, 166];

  const drivenKnee = [100, 118];
  const drivenFoot = [120, 100];
  const drivenToe = [135, 90];

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%" }}>
      <Ground />

      <Capsule from={hip} to={straightAnkle} width={16} color={PALETTE.pants} />
      <Foot heel={straightAnkle} toe={straightToe} width={11} />

      <Capsule from={hip} to={drivenKnee} width={16} color={PALETTE.pants} />
      <Capsule from={drivenKnee} to={drivenFoot} width={14} color={PALETTE.pants} />
      <Foot heel={drivenFoot} toe={drivenToe} width={11} />

      <Capsule from={shoulder} to={hip} width={20} color={PALETTE.shirt} />
      <Capsule from={shoulder} to={hand} width={13} color={PALETTE.skin} />

      <Head at={head} hairOffset={[-4, -10]} />
    </svg>
  );
}
