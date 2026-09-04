// Wraps a real illustrated photo so it drops into the same Illustration
// slot as the hand-drawn SVG poses. Photos are wider than our 6:5 card,
// so they're letterboxed (object-fit: contain) rather than cropped.
// Left/right mirroring for bilateral exercises is handled by the caller
// (a CSS scaleX(-1) on the wrapping element), not here — one photo per
// pose is enough.
export function makePhotoIllustration(src) {
  return function PhotoIllustration() {
    return (
      <img
        src={src}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
      />
    );
  };
}
