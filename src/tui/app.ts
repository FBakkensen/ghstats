import {
  createCliRenderer,
  TextRenderable,
  TextAttributes,
  type CliRenderer,
  type KeyEvent,
} from "@opentui/core";
import { parseRange } from "../core/bucketing";
import { getStats, type StatsBundle } from "../core/statsService";
import type { Bucket } from "../types/domain";
import { buildOverviewContent } from "./views/overviewView";
import { buildEvolutionContent } from "./views/evolutionView";

type View = "overview" | "evolution";
type RangePreset = "7d" | "30d" | "90d" | "1y";

interface AppState {
  view: View;
  rangePreset: RangePreset;
  bucket: Bucket;
  data: StatsBundle | null;
  fetching: boolean;
  error?: string;
}

const RANGE_KEYS: Record<string, RangePreset> = {
  "1": "7d",
  "2": "30d",
  "3": "90d",
  "4": "1y",
};

interface Layout {
  header: TextRenderable;
  line1: TextRenderable;
  line2: TextRenderable;
  line3: TextRenderable;
  sparkLabel: TextRenderable;
  sparkline: TextRenderable;
  hint: TextRenderable;
}

export async function launchTUI(): Promise<void> {
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    useAlternateScreen: true,
    targetFps: 30,
  });

  const state: AppState = {
    view: "overview",
    rangePreset: "30d",
    bucket: "day",
    data: null,
    fetching: false,
  };

  const layout = createLayout(renderer);
  const exitPromise = setupKeyHandling(renderer, state, layout);

  try {
    renderer.start();
    await loadData(state, layout);
    await exitPromise;
  } finally {
    renderer.stop();
  }
}

function createLayout(renderer: CliRenderer): Layout {
  const header = new TextRenderable(renderer, {
    id: "header",
    content: "ghstats",
    attributes: TextAttributes.BOLD,
    position: "absolute",
    left: 2,
    top: 1,
  });

  const line1 = new TextRenderable(renderer, {
    id: "line1",
    content: "",
    position: "absolute",
    left: 2,
    top: 3,
  });

  const line2 = new TextRenderable(renderer, {
    id: "line2",
    content: "",
    position: "absolute",
    left: 2,
    top: 4,
  });

  const line3 = new TextRenderable(renderer, {
    id: "line3",
    content: "",
    position: "absolute",
    left: 2,
    top: 5,
  });

  const sparkLabel = new TextRenderable(renderer, {
    id: "sparkLabel",
    content: "",
    position: "absolute",
    left: 2,
    top: 7,
    attributes: TextAttributes.DIM,
  });

  const sparkline = new TextRenderable(renderer, {
    id: "sparkline",
    content: "",
    position: "absolute",
    left: 2,
    top: 8,
  });

  const hint = new TextRenderable(renderer, {
    id: "hint",
    content: "",
    position: "absolute",
    left: 2,
    top: 10,
    attributes: TextAttributes.DIM,
  });

  renderer.root.add(header);
  renderer.root.add(line1);
  renderer.root.add(line2);
  renderer.root.add(line3);
  renderer.root.add(sparkLabel);
  renderer.root.add(sparkline);
  renderer.root.add(hint);

  return { header, line1, line2, line3, sparkLabel, sparkline, hint };
}

function render(state: AppState, layout: Layout) {
  const status = state.fetching ? "Loading…" : state.error;
  const builder = state.view === "overview" ? buildOverviewContent : buildEvolutionContent;
  const content = builder(state.data, status);

  layout.header.content = content.header;

  layout.line1.content = content.lines[0] ?? "";
  layout.line2.content = content.lines[1] ?? "";
  layout.line3.content = content.lines[2] ?? "";

  layout.sparkLabel.content = content.sparklineLabel;
  layout.sparkline.content = content.sparkline;
  layout.hint.content = content.hint;
}

async function loadData(state: AppState, layout: Layout) {
  if (state.fetching) return;
  state.fetching = true;
  state.error = undefined;
  render(state, layout);

  try {
    const range = parseRange(state.rangePreset, state.bucket);
    const bundle = await getStats(range);
    state.data = bundle;
  } catch (err) {
    state.data = null;
    state.error = err instanceof Error ? err.message : String(err);
  } finally {
    state.fetching = false;
    render(state, layout);
  }
}

function setupKeyHandling(renderer: CliRenderer, state: AppState, layout: Layout): Promise<void> {
  return new Promise((resolve) => {
    renderer.keyInput.on("keypress", (key: KeyEvent) => {
      if (key.name === "q" || key.name === "escape" || (key.ctrl && key.name === "c")) {
        resolve();
        return;
      }

      const preset = RANGE_KEYS[key.name ?? ""];
      if (preset && preset !== state.rangePreset) {
        state.rangePreset = preset;
        state.data = null;
        void loadData(state, layout);
        return;
      }

      if (key.name === "e") {
        state.view = "evolution";
        render(state, layout);
        return;
      }

      if (key.name === "o") {
        state.view = "overview";
        render(state, layout);
        return;
      }

      if (key.name === "d" && state.bucket !== "day") {
        state.bucket = "day";
        state.data = null;
        void loadData(state, layout);
        return;
      }

      if (key.name === "w" && state.bucket !== "week") {
        state.bucket = "week";
        state.data = null;
        void loadData(state, layout);
        return;
      }

      if (key.name === "r") {
        state.data = null;
        void loadData(state, layout);
        return;
      }
    });
  });
}
