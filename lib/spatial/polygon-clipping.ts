/**
 * 2D polygon math used by the FOV-cone clipping pipeline in the
 * spatial-peek demo. Ported from the camect-webapp floorplan toolkit:
 * Sutherland-Hodgman convex clip + CCW orientation check.
 */

export type Vec2 = [number, number];

export function cross2D(o: Vec2, a: Vec2, b: Vec2): number {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

export function lineIntersect2D(a: Vec2, b: Vec2, c: Vec2, d: Vec2): Vec2 {
  const r = [b[0] - a[0], b[1] - a[1]];
  const s = [d[0] - c[0], d[1] - c[1]];
  const denom = r[0] * s[1] - r[1] * s[0];
  const t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / denom;
  return [a[0] + t * r[0], a[1] + t * r[1]];
}

/** Sutherland-Hodgman clip of `subject` against a CCW-oriented convex `clip` poly. */
export function sutherlandHodgman(subject: Vec2[], clip: Vec2[]): Vec2[] {
  let output = [...subject];
  for (let i = 0; i < clip.length; i++) {
    if (output.length === 0) break;
    const input = [...output];
    output = [];
    const edgeA = clip[i];
    const edgeB = clip[(i + 1) % clip.length];
    for (let j = 0; j < input.length; j++) {
      const curr = input[j];
      const prev = input[(j - 1 + input.length) % input.length];
      const currIn = cross2D(edgeA, edgeB, curr) >= 0;
      const prevIn = cross2D(edgeA, edgeB, prev) >= 0;
      if (currIn) {
        if (!prevIn) output.push(lineIntersect2D(prev, curr, edgeA, edgeB));
        output.push(curr);
      } else if (prevIn) {
        output.push(lineIntersect2D(prev, curr, edgeA, edgeB));
      }
    }
  }
  return output;
}

/** Ensures a polygon is counter-clockwise — required for inward-pointing clip normals. */
export function ensureCCW(poly: Vec2[]): Vec2[] {
  let area = 0;
  for (let i = 0; i < poly.length; i++) {
    const j = (i + 1) % poly.length;
    area += poly[i][0] * poly[j][1] - poly[j][0] * poly[i][1];
  }
  return area < 0 ? [...poly].reverse() : poly;
}
