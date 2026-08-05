import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`https://muse.example${pathname}`, {
      headers: {
        accept: "text/html",
        "x-forwarded-host": "muse.example",
        "x-forwarded-proto": "https",
      },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the MUSE product workspace", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /<title>MUSE · AI 广告素材生成平台<\/title>/);
  assert.match(html, /MUSE/);
  assert.match(html, /图片生成/);
  assert.match(html, /任务中心/);
  assert.match(html, /审核管理/);
  assert.match(html, /素材库/);
  assert.match(html, /知识库/);
  assert.match(html, /素材数据/);
  assert.match(html, /Agent 中心/);
  assert.match(html, /需求理解/);
  assert.match(html, /审核/);
  assert.match(html, /AGENT RUN/);
  assert.match(html, /理解需求/);
  assert.match(html, /单条预览/);
  assert.match(html, /批量生成/);
  assert.match(html, /实时状态/);
  assert.match(html, /方案编辑中/);
  assert.match(html, /状态演示/);
  assert.match(html, /role="status"/);
});

test("ships production metadata, preview art, and responsive styles", async () => {
  const [layout, page, css, packageJson] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /generateMetadata/);
  assert.match(layout, /x-forwarded-host/);
  assert.match(layout, /summary_large_image/);
  assert.match(layout, /\/og\.png/);
  await access(new URL("../public/og.png", import.meta.url));

  assert.match(page, /type ModuleKey/);
  assert.match(page, /function Dashboard/);
  assert.match(page, /function GenerationWorkspace/);
  assert.match(page, /TasksPage/);
  assert.match(page, /ReviewPage/);
  assert.match(page, /AssetsPage/);
  assert.match(page, /KnowledgePage/);
  assert.match(page, /AnalyticsPage/);
  assert.match(page, /SettingsPage/);
  assert.match(page, /type GenerationState/);
  assert.match(page, /WorkflowStatusPanel/);
  assert.match(page, /AgentRuntimeBar/);
  assert.match(page, /AgentCenterPage/);
  assert.match(page, /const agentCatalog/);
  assert.match(page, /五个 Agent，一条可确认、可回退、可追溯的生产链/);
  assert.match(page, /状态演示/);
  assert.match(page, /预览排队中/);
  assert.match(page, /单条预览生成中/);
  assert.match(page, /待审核/);
  assert.match(page, /部分失败/);
  assert.match(page, /onSelect:\s*\(stage: number\)/);
  assert.match(css, /\.workflow-status/);
  assert.match(css, /\.state-simulator/);
  assert.match(css, /\.status-tone-running/);
  assert.match(css, /\.agent-runtime-bar/);
  assert.match(css, /\.agent-center-page/);
  await access(new URL("../work/AI广告素材生成平台_五大Agent详细设计.md", import.meta.url));
  assert.match(css, /@media \(max-width:\s*1180px\)/);
  assert.match(css, /@media \(max-width:\s*760px\)/);

  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(
    access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)),
  );
});

test("ships the full application directly on GitHub Pages", async () => {
  const [index, pagesEntry, pagesConfig, packageJson, assets] = await Promise.all([
    readFile(new URL("../docs/index.html", import.meta.url), "utf8"),
    readFile(new URL("../github-pages-src/main.tsx", import.meta.url), "utf8"),
    readFile(new URL("../vite.pages.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readdir(new URL("../docs/assets/", import.meta.url)),
  ]);

  assert.match(index, /<div id="root"><\/div>/);
  assert.match(index, /\/muse-ai-creative-platform\/assets\/index-[^"']+\.js/);
  assert.match(index, /\/muse-ai-creative-platform\/assets\/index-[^"']+\.css/);
  assert.doesNotMatch(index, /http-equiv=["']refresh["']/i);
  assert.match(pagesEntry, /import App from "\.\.\/app\/page"/);
  assert.match(pagesEntry, /createRoot\(root\)\.render/);
  assert.match(pagesConfig, /base:\s*"\/muse-ai-creative-platform\/"/);
  assert.match(packageJson, /"build:pages": "vite build --config vite\.pages\.config\.ts"/);
  assert.ok(assets.some((file) => /^index-.+\.js$/.test(file)));
  assert.ok(assets.some((file) => /^index-.+\.css$/.test(file)));
});
