const BLOCKS = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];

function downsample(values: number[], width: number): number[] {
  if (values.length <= width) return values;

  const step = Math.ceil(values.length / width);
  const sampled: number[] = [];

  for (let i = 0; i < values.length; i += step) {
    const slice = values.slice(i, i + step);
    const max = Math.max(...slice);
    sampled.push(max);
  }

  return sampled;
}

export function renderSparkline(values: number[], width = 40): string {
  if (!values.length) return "(no data)";

  const sampled = downsample(values, width);
  const max = Math.max(...sampled);

  if (max === 0) {
    return BLOCKS[0].repeat(sampled.length);
  }

  return sampled
    .map((v) => {
      const idx = Math.round((v / max) * (BLOCKS.length - 1));
      return BLOCKS[idx];
    })
    .join("");
}
