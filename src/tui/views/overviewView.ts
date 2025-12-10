import type { StatsBundle } from "../../core/statsService";
import type { TimeRange } from "../../types/domain";
import { renderSparkline } from "../components/sparkline";

function formatRange(range?: TimeRange): string {
  if (!range) return "";
  const from = range.from.toISOString().slice(0, 10);
  const to = range.to.toISOString().slice(0, 10);
  return `${from} → ${to} (${range.bucket})`;
}

export function buildOverviewContent(
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
    ? `ghstats · Overview · ${bundle.username} · ${formatRange(bundle.summary.range)}`
    : "ghstats · Overview";

  const summaryLines: string[] = [];

  if (status) {
    summaryLines.push(status);
  }

  if (bundle) {
    const { commits, prsOpened, prsMerged } = bundle.summary;
    summaryLines.push(`Commits: ${commits}`);
    summaryLines.push(`PRs opened: ${prsOpened}`);
    summaryLines.push(`PRs merged: ${prsMerged}`);
  }

  const sparklineLabel = bundle
    ? `Commits sparkline (${bundle.timeline.points.length} buckets)`
    : "Commits sparkline";

  const sparkline = bundle
    ? renderSparkline(bundle.timeline.points.map((p) => p.value), 50)
    : "(no data)";

  const hint =
    "Keys: 1/2/3/4 ranges · d/w bucket · e evolution · o overview · r refresh · q quit";

  return {
    header,
    lines: summaryLines,
    sparklineLabel,
    sparkline,
    hint,
  };
}
