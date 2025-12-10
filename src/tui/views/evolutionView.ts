import type { StatsBundle } from "../../core/statsService";
import type { TimeRange } from "../../types/domain";
import { renderSparkline } from "../components/sparkline";

function formatRange(range?: TimeRange): string {
  if (!range) return "";
  const from = range.from.toISOString().slice(0, 10);
  const to = range.to.toISOString().slice(0, 10);
  return `${from} → ${to} (${range.bucket})`;
}

export function buildEvolutionContent(
  bundle: StatsBundle | null,
  status?: string
): {
  header: string;
  lines: string[];
  sparklineLabel: string;
  sparkline: string;
  hint: string;
} {
  const header = bundle
    ? `ghstats · Evolution · ${bundle.username} · ${formatRange(bundle.timeline.range)}`
    : "ghstats · Evolution";

  const lines: string[] = [];
  if (status) {
    lines.push(status);
  }

  if (bundle) {
    lines.push(`Metric: ${bundle.timeline.metric}`);
    lines.push(`Buckets: ${bundle.timeline.points.length}`);
  }

  const sparklineLabel = bundle
    ? `Commits over time (${bundle.timeline.range.bucket})`
    : "Commits over time";

  const sparkline = bundle
    ? renderSparkline(bundle.timeline.points.map((p) => p.value), 60)
    : "(no data)";

  const hint =
    "Keys: 1/2/3/4 ranges · d/w bucket · o overview · r refresh · q quit";

  return {
    header,
    lines,
    sparklineLabel,
    sparkline,
    hint,
  };
}
