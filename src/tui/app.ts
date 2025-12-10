import {
  createCliRenderer,
  TextRenderable,
  TextAttributes,
  type CliRenderer,
  type KeyEvent,
} from "@opentui/core";

/**
 * Minimal OpenTUI Hello World application
 * Displays a simple screen with title, date/time, and quit instruction
 */
export async function launchTUI(): Promise<void> {
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    useAlternateScreen: true,
    targetFps: 30,
  });

  const now = new Date().toLocaleString();

  const title = new TextRenderable(renderer, {
    id: "title",
    content: "ghstats",
    attributes: TextAttributes.BOLD,
    position: "absolute",
    left: 2,
    top: 1,
  });

  const timestamp = new TextRenderable(renderer, {
    id: "timestamp",
    content: `Current time: ${now}`,
    position: "absolute",
    left: 2,
    top: 3,
  });

  const hint = new TextRenderable(renderer, {
    id: "hint",
    content: "Press 'q' or Ctrl+C to quit",
    position: "absolute",
    left: 2,
    top: 5,
  });

  renderer.root.add(title);
  renderer.root.add(timestamp);
  renderer.root.add(hint);

  const exitPromise = waitForExit(renderer);

  try {
    renderer.start();
    await exitPromise;
  } finally {
    renderer.stop();
  }
}

function waitForExit(renderer: CliRenderer): Promise<void> {
  return new Promise((resolve) => {
    renderer.keyInput.on("keypress", (key: KeyEvent) => {
      if (key.name === "q" || key.name === "escape" || (key.ctrl && key.name === "c")) {
        resolve();
      }
    });
  });
}
