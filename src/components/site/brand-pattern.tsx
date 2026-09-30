import type { CSSProperties } from "react";

type Point = [number, number];
type Geometry = {
  thin: string[];
  thick: string[];
  nodes: Point[];
  accent: Point[];
};

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let mixed = Math.imul(value ^ (value >>> 15), 1 | value);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function convergenceUnit(x: number, y: number, scale: number) {
  const path = (source: string) => source.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, rawX: string, rawY: string) => `${(x + Number(rawX) * scale).toFixed(1)},${(y + Number(rawY) * scale).toFixed(1)}`);
  return {
    inputs: [path("M4,12 L16,12 L36,32"), path("M4,24 L28,24 L36,32"), path("M4,40 L28,40 L36,32"), path("M4,52 L16,52 L36,32")],
    output: path("M36,32 L60,32"),
    node: [x + 36 * scale, y + 32 * scale] as Point,
  };
}

function buildGeometry(variant: "mesh" | "field" | "flow" | "verification", width: number, height: number, seed: number, density: number): Geometry {
  const random = seededRandom(seed);
  const thin: string[] = [];
  const thick: string[] = [];
  const nodes: Point[] = [];
  const accent: Point[] = [];

  if (variant === "mesh") {
    const scale = 1.5;
    const cell = 64 * scale;
    for (let row = 0; row * cell < height + cell; row += 1) {
      const offset = row % 2 ? cell / 2 : 0;
      for (let column = -1; column * cell < width + cell; column += 1) {
        if (random() > 0.55 * density + 0.2) continue;
        const unit = convergenceUnit(column * cell + offset, row * cell - cell / 4, scale);
        thin.push(...unit.inputs);
        thick.push(unit.output);
        if (random() < 0.35) nodes.push(unit.node);
      }
    }
  }

  if (variant === "field") {
    const step = 48;
    const columns = Math.ceil(width / step) + 1;
    const rows = Math.ceil(height / step) + 1;
    const used = new Set<string>();
    for (let column = 0; column < columns; column += 1) {
      for (let row = 0; row < rows; row += 1) {
        const x = column * step;
        const y = row * step;
        const choice = random();
        if (choice < 0.18 * density) {
          thin.push(`M${x},${y} L${x + step},${y}`);
          used.add(`${column},${row}`);
          used.add(`${column + 1},${row}`);
        } else if (choice < 0.3 * density) {
          thin.push(`M${x},${y} L${x},${y + step}`);
          used.add(`${column},${row}`);
          used.add(`${column},${row + 1}`);
        } else if (choice < 0.4 * density) {
          thin.push(`M${x},${y} L${x + step},${y + step}`);
          used.add(`${column},${row}`);
          used.add(`${column + 1},${row + 1}`);
        }
      }
    }
    used.forEach((key) => {
      const [column = 0, row = 0] = key.split(",").map(Number);
      const point: Point = [column * step, row * step];
      (random() < 0.06 ? accent : nodes).push(point);
    });
  }

  if (variant === "flow") {
    const lanes = 8;
    const top = height * 0.16;
    const span = height * 0.68;
    const centerY = height / 2;
    const [firstStop, secondStop, thirdStop] = [width * 0.3, width * 0.52, width * 0.72];
    const sourceY = Array.from({ length: lanes }, (_, index) => top + (span / (lanes - 1)) * index);
    const middleY = [0, 1, 2, 3].map((index) => centerY + (index - 1.5) * span * 0.2);
    const finalY = [centerY - span * 0.08, centerY + span * 0.08];
    sourceY.forEach((y, index) => {
      const target = middleY[Math.floor(index / 2)] ?? centerY;
      thin.push(`M0,${y} L${firstStop - Math.abs(y - target)},${y} L${firstStop},${target}`);
      nodes.push([width * 0.06 + (index % 2) * 18, y]);
    });
    middleY.forEach((y, index) => {
      const target = finalY[Math.floor(index / 2)] ?? centerY;
      thin.push(`M${firstStop},${y} L${secondStop - Math.abs(y - target)},${y} L${secondStop},${target}`);
      accent.push([firstStop, y]);
    });
    finalY.forEach((y) => {
      thin.push(`M${secondStop},${y} L${thirdStop - Math.abs(y - centerY)},${y} L${thirdStop},${centerY}`);
      accent.push([secondStop, y]);
    });
    thick.push(`M${thirdStop},${centerY} L${width},${centerY}`);
    accent.push([thirdStop, centerY]);
  }

  if (variant === "verification") {
    const sourceX = width * 0.14;
    const evidenceX = width * 0.5;
    const outputX = width * 0.8;
    const centerY = height / 2;
    const sourceY = Array.from({ length: 6 }, (_, index) => height * 0.14 + (height * 0.72 / 5) * index);
    const evidenceY = Array.from({ length: 3 }, (_, index) => centerY + (index - 1) * height * 0.22);
    sourceY.forEach((y, index) => {
      const target = evidenceY[Math.min(2, Math.floor(index / 2))] ?? centerY;
      thin.push(`M${sourceX + 6},${y} L${evidenceX - Math.abs(y - target)},${y} L${evidenceX},${target}`);
      nodes.push([sourceX - 2, y]);
    });
    evidenceY.forEach((y) => {
      thin.push(`M${evidenceX},${y} L${outputX - Math.abs(y - centerY)},${y} L${outputX},${centerY}`);
      accent.push([evidenceX, y]);
    });
    thick.push(`M${outputX},${centerY} L${width},${centerY}`);
    nodes.push([outputX, centerY]);
  }

  return { thin, thick, nodes, accent };
}

const masks = {
  none: undefined,
  "fade-bottom": "linear-gradient(to bottom, rgba(0,0,0,.9), transparent 78%)",
  "fade-left": "linear-gradient(to right, rgba(0,0,0,.95), transparent 72%)",
  "fade-right": "linear-gradient(to left, rgba(0,0,0,.95), transparent 72%)",
  radial: "radial-gradient(70% 90% at 70% 40%, rgba(0,0,0,.95), transparent 80%)",
} as const;

export function BrandPattern({
  variant = "mesh",
  onDark = false,
  density = 1,
  seed = 7,
  width = 1400,
  height = 640,
  opacity,
  mask = "none",
  className,
  style,
}: {
  variant?: "mesh" | "field" | "flow" | "verification";
  onDark?: boolean;
  density?: number;
  seed?: number;
  width?: number;
  height?: number;
  opacity?: number;
  mask?: keyof typeof masks;
  className?: string;
  style?: CSSProperties;
}) {
  const geometry = buildGeometry(variant, width, height, seed, density);
  const ink = onDark ? "var(--text-on-dark)" : "var(--graphite-1)";
  const accent = onDark ? "var(--signal-5)" : "var(--signal-4)";
  const patternOpacity = opacity ?? (onDark ? 0.22 : 0.14);
  const maskImage = masks[mask];

  return (
    <div className={className} aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", maskImage, WebkitMaskImage: maskImage, ...style }}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" width="100%" height="100%" focusable="false">
        <g fill="none" stroke={ink} strokeLinecap="square" strokeLinejoin="miter" opacity={patternOpacity}>
          {geometry.thin.map((path, index) => <path key={`thin-${index}`} d={path} strokeWidth="1" vectorEffect="non-scaling-stroke" />)}
          {geometry.thick.map((path, index) => <path key={`thick-${index}`} d={path} strokeWidth="2.25" vectorEffect="non-scaling-stroke" />)}
        </g>
        <g fill={ink} opacity={Math.min(1, patternOpacity * 2.2)}>
          {geometry.nodes.map(([x, y], index) => <circle key={`node-${index}`} cx={x} cy={y} r="2" />)}
        </g>
        <g fill={accent} opacity={Math.min(1, patternOpacity * 4)}>
          {geometry.accent.map(([x, y], index) => <circle key={`accent-${index}`} cx={x} cy={y} r="3" />)}
        </g>
      </svg>
    </div>
  );
}
