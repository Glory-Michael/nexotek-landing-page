declare module 'world-atlas/land-110m.json' {
  const topology: {
    type: 'Topology';
    arcs: number[][][];
    transform?: { scale: [number, number]; translate: [number, number] };
    objects: { land: unknown };
  };
  export default topology;
}

declare module 'topojson-client' {
  export function feature(topology: unknown, object: unknown): unknown;
}

declare module 'd3-geo' {
  type Projection = {
    scale(s: number): Projection;
    translate(t: [number, number]): Projection;
  };
  type Path = (feature: unknown) => string | null;
  export function geoEquirectangular(): Projection;
  export function geoPath(
    projection: Projection,
    context: CanvasRenderingContext2D,
  ): Path;
}
