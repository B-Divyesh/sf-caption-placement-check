import { createHash } from "node:crypto";
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const RELEASE_API = "https://api.github.com/repos/B-Divyesh/sf-caption-placement-check/releases/latest";

type Asset = { name: string; browser_download_url: string };
type Release = { assets: Asset[] };
type ManifestAsset = { name: string; url: string; sha256: string };
type Manifest = { platforms: Record<"mac" | "windows" | "linux", ManifestAsset[]> };

let releaseEvidence: Promise<{ windows: Uint8Array; windowsName: string }> | undefined;

async function loadReleaseEvidence() {
  if (releaseEvidence) return releaseEvidence;
  releaseEvidence = (async () => {
    const releaseResponse = await fetch(RELEASE_API, { headers: { Accept: "application/vnd.github+json" } });
    expect(releaseResponse.ok).toBe(true);
    const release = await releaseResponse.json() as Release;
    const byName = (name: string) => release.assets.find((asset) => asset.name === name);
    const manifestAsset = release.assets.find((asset) => asset.name === "latest.json");
    const sumsAsset = release.assets.find((asset) => asset.name === "SHA256SUMS");
    expect(manifestAsset).toBeTruthy();
    expect(sumsAsset).toBeTruthy();
    const [manifestResponse, sumsResponse] = await Promise.all([
      fetch(manifestAsset!.browser_download_url), fetch(sumsAsset!.browser_download_url)
    ]);
    expect(manifestResponse.ok).toBe(true);
    expect(sumsResponse.ok).toBe(true);
    const manifest = await manifestResponse.json() as Manifest;
    const sums = new Map((await sumsResponse.text()).trim().split("\n").map((line) => {
      const [hash, name] = line.trim().split(/\s+/, 2);
      return [name, hash];
    }));
    const required = [
      manifest.platforms.mac.find((asset) => /aarch64.*\.dmg$/i.test(asset.name)),
      manifest.platforms.mac.find((asset) => /x64.*\.dmg$/i.test(asset.name)),
      manifest.platforms.windows.find((asset) => /x64.*\.(msi|exe)$/i.test(asset.name)),
      manifest.platforms.linux.find((asset) => /amd64.*\.AppImage$/i.test(asset.name))
    ];
    expect(required.every(Boolean)).toBe(true);
    for (const asset of required as ManifestAsset[]) {
      expect(byName(asset.name), asset.name).toBeTruthy();
      expect(sums.get(asset.name), asset.name).toBe(asset.sha256);
      const head = await fetch(asset.url, { method: "HEAD" });
      expect(head.ok, `${asset.name} returned ${head.status}`).toBe(true);
    }
    const windowsAsset = manifest.platforms.windows
      .filter((asset) => /\.exe$/i.test(asset.name))
      .sort((a, b) => a.name.localeCompare(b.name))[0];
    expect(windowsAsset).toBeTruthy();
    const binaryResponse = await fetch(windowsAsset.url);
    expect(binaryResponse.ok).toBe(true);
    const windows = new Uint8Array(await binaryResponse.arrayBuffer());
    expect(createHash("sha256").update(windows).digest("hex")).toBe(windowsAsset.sha256);
    return { windows, windowsName: windowsAsset.name };
  })();
  return releaseEvidence;
}

function peCertificateDirectory(binary: Uint8Array) {
  const view = new DataView(binary.buffer, binary.byteOffset, binary.byteLength);
  const pe = view.getUint32(0x3c, true);
  expect(String.fromCharCode(...binary.slice(pe, pe + 4))).toBe("PE\0\0");
  const optional = pe + 24;
  const magic = view.getUint16(optional, true);
  const dataDirectories = optional + (magic === 0x20b ? 112 : 96);
  return { address: view.getUint32(dataDirectories + 32, true), size: view.getUint32(dataDirectories + 36, true) };
}

describe("published release contract", () => {
  it("@claim:desktop-downloads resolves every supported build and verifies published checksums", async () => {
    const evidence = await loadReleaseEvidence();
    expect(evidence.windows.length).toBeGreaterThan(1_000_000);
  }, 90_000);

  it("@claim:unsigned-builds verifies the published Windows build has no publisher signature", async () => {
    const { windows, windowsName } = await loadReleaseEvidence();
    expect(windowsName).toMatch(/\.exe$/i);
    expect(peCertificateDirectory(windows)).toEqual({ address: 0, size: 0 });
    const workflow = readFileSync(resolve(".github/workflows/release.yml"), "utf8");
    expect(workflow).not.toMatch(/APPLE_CERTIFICATE|WINDOWS_CERT_PFX|signingIdentity|certificateThumbprint/);
  }, 90_000);
});

describe("repository product contract", () => {
  it("@claim:installer-checksum accepts a matching shell download, rejects a mismatch, and guards PowerShell", () => {
    const root = mkdtempSync(join(tmpdir(), "cpc-installer-"));
    const bin = join(root, "bin");
    const install = join(root, "installed");
    mkdirSync(bin);
    mkdirSync(install);
    const asset = join(root, "fixture.AppImage");
    writeFileSync(asset, "controlled caption placement installer fixture\n");
    const correct = createHash("sha256").update(readFileSync(asset)).digest("hex");
    const manifest = join(root, "latest.json");
    const writeManifest = (sha256: string) => writeFileSync(manifest, JSON.stringify({ platforms: { linux: [{ name: "fixture_amd64.AppImage", url: "https://example.invalid/fixture.AppImage", sha256 }] } }));
    writeManifest(correct);
    const curl = join(bin, "curl");
    writeFileSync(curl, `#!/bin/sh\nout=""\nurl=""\nwhile [ "$#" -gt 0 ]; do\n  if [ "$1" = "-o" ]; then out="$2"; shift 2; else url="$1"; shift; fi\ndone\ncase "$url" in\n  *latest.json) cp "$CPC_TEST_MANIFEST" "$out" ;;\n  *) cp "$CPC_TEST_ASSET" "$out" ;;\nesac\n`);
    const uname = join(bin, "uname");
    writeFileSync(uname, "#!/bin/sh\n[ \"$1\" = \"-s\" ] && echo Linux || echo x86_64\n");
    chmodSync(curl, 0o755);
    chmodSync(uname, 0o755);
    const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, XDG_BIN_HOME: install, CPC_TEST_MANIFEST: manifest, CPC_TEST_ASSET: asset };
    const good = spawnSync("sh", [resolve("public/install.sh")], { env, encoding: "utf8" });
    expect(good.status, good.stderr).toBe(0);
    expect(readFileSync(join(install, "caption-placement-check"), "utf8")).toBe(readFileSync(asset, "utf8"));
    writeManifest("0".repeat(64));
    const bad = spawnSync("sh", [resolve("public/install.sh")], { env, encoding: "utf8" });
    expect(bad.status).not.toBe(0);
    expect(bad.stderr).toContain("Checksum verification failed");
    const powershell = readFileSync(resolve("public/install.ps1"), "utf8");
    expect(powershell).toMatch(/Get-FileHash[\s\S]+actual.*-ne.*sha256[\s\S]+Checksum verification failed/i);
  });

  it("@claim:mit-license verifies the repository MIT grant and package metadata", () => {
    const license = readFileSync(resolve("LICENSE"), "utf8");
    expect(license).toContain("MIT License");
    expect(license).toContain("Permission is hereby granted, free of charge");
    expect(readFileSync(resolve("src-tauri/Cargo.toml"), "utf8")).toMatch(/^license = "MIT"$/m);
  });
});
