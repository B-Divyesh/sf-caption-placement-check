import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { expect, test } from "vitest";

type OfflineSmokeReport = {
  passed: boolean;
  captionCount: number;
  alertCount: number;
  summary: string;
  sampleLoaded: boolean;
  localRequestCount: number;
  blockedExternalRequests: string[];
};

function run(command: string, args: string[], options: { env?: NodeJS.ProcessEnv; cwd?: string } = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || process.cwd(),
    env: options.env || process.env,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024
  });
  expect(result.error, `${command} could not start`).toBeUndefined();
  expect(result.status, `${command} ${args.join(" ")}\n${result.stdout}\n${result.stderr}`).toBe(0);
  return result;
}

test("@claim:desktop-offline runs the packaged sample check with internet access blocked", () => {
  for (const tool of ["dpkg-deb", "xvfb-run"]) run("sh", ["-c", `command -v ${tool}`]);

  run("npm", ["run", "tauri", "--", "build", "--bundles", "deb"], {
    env: { ...process.env, CI: "true" }
  });
  const bundleDir = resolve("src-tauri/target/release/bundle/deb");
  const version = (JSON.parse(readFileSync(resolve("package.json"), "utf8")) as { version: string }).version;
  const debs = readdirSync(bundleDir).filter((name) => name.includes(`_${version}_`) && name.endsWith(".deb"));
  expect(debs, "exactly one Linux DEB should be built for the current version").toHaveLength(1);

  const workspace = mkdtempSync(join(tmpdir(), "cpc-desktop-offline-"));
  const extracted = join(workspace, "package");
  const debPath = join(bundleDir, debs[0]);
  run("dpkg-deb", ["--extract", debPath, extracted]);

  const binary = join(extracted, "usr", "bin", "caption-placement-check");
  const unreachableProxy = "http://127.0.0.1:9";
  const env = {
    ...process.env,
    CPC_OFFLINE_SMOKE: "1",
    HTTP_PROXY: unreachableProxy,
    HTTPS_PROXY: unreachableProxy,
    ALL_PROXY: unreachableProxy,
    http_proxy: unreachableProxy,
    https_proxy: unreachableProxy,
    all_proxy: unreachableProxy,
    NO_PROXY: "",
    no_proxy: "",
    NO_AT_BRIDGE: "1",
    WEBKIT_DISABLE_COMPOSITING_MODE: "1"
  };
  const launch = run("timeout", ["60", "xvfb-run", "-a", binary], { env });

  const marker = launch.stdout.split("\n").find((line) => line.startsWith("CPC_OFFLINE_SMOKE_RESULT="));
  expect(marker, `packaged app output did not contain a smoke result:\n${launch.stdout}`).toBeTruthy();
  const report = JSON.parse(marker!.slice("CPC_OFFLINE_SMOKE_RESULT=".length)) as OfflineSmokeReport;
  expect(basename(debPath)).toContain(`_${version}_amd64.deb`);
  expect(report).toMatchObject({
    passed: true,
    captionCount: 2,
    alertCount: 2,
    sampleLoaded: true,
    blockedExternalRequests: []
  });
  expect(report.localRequestCount).toBe(2);
  expect(report.summary).toBe("2 captions checked · 2 alerts need review");
}, 360_000);
