"use client";

import { useMemo, useState } from "react";

type ModuleKey =
  | "dashboard"
  | "image"
  | "video"
  | "tasks"
  | "review"
  | "assets"
  | "knowledge"
  | "analytics"
  | "settings";

type Task = {
  id: string;
  name: string;
  type: "图片" | "视频";
  product: string;
  progress: number;
  status: "生成中" | "待审核" | "部分成功" | "已完成" | "失败";
  count: string;
  cost: string;
  time: string;
};

const navGroups: Array<{
  label: string;
  items: Array<{ key: ModuleKey; icon: string; label: string; badge?: string }>;
}> = [
  {
    label: "创意生产",
    items: [
      { key: "dashboard", icon: "⌂", label: "工作台" },
      { key: "image", icon: "✦", label: "图片生成" },
      { key: "video", icon: "▶", label: "视频生成" },
    ],
  },
  {
    label: "生产管理",
    items: [
      { key: "tasks", icon: "▦", label: "任务中心", badge: "6" },
      { key: "review", icon: "✓", label: "审核管理", badge: "12" },
      { key: "assets", icon: "◫", label: "素材库" },
    ],
  },
  {
    label: "智能资产",
    items: [
      { key: "knowledge", icon: "◎", label: "知识库" },
      { key: "analytics", icon: "↗", label: "素材数据" },
      { key: "settings", icon: "⚙", label: "系统管理" },
    ],
  },
];

const titles: Record<ModuleKey, { eyebrow: string; title: string; subtitle: string }> = {
  dashboard: {
    eyebrow: "CREATIVE OPERATIONS",
    title: "创意工作台",
    subtitle: "今天的素材生产、审核与投放表现都在这里。",
  },
  image: {
    eyebrow: "IMAGE STUDIO",
    title: "图片生成",
    subtitle: "和 Agent 一起，把投放需求变成可执行的创意方案。",
  },
  video: {
    eyebrow: "VIDEO STUDIO",
    title: "视频生成",
    subtitle: "结构化脚本、分镜生成与工程合成，一条链路完成。",
  },
  tasks: {
    eyebrow: "PRODUCTION QUEUE",
    title: "任务中心",
    subtitle: "查看预览、批量生成、合成与导出任务。",
  },
  review: {
    eyebrow: "QUALITY CONTROL",
    title: "审核管理",
    subtitle: "在完整上下文中完成质量与合规审核。",
  },
  assets: {
    eyebrow: "CREATIVE LIBRARY",
    title: "素材库",
    subtitle: "统一管理素材版本、谱系、授权与投放状态。",
  },
  knowledge: {
    eyebrow: "KNOWLEDGE HUB",
    title: "知识库",
    subtitle: "为选品、品牌表达、合规与创意复用提供可信事实。",
  },
  analytics: {
    eyebrow: "PERFORMANCE",
    title: "素材数据",
    subtitle: "从生产效率到投放表现，形成素材级数据闭环。",
  },
  settings: {
    eyebrow: "ADMINISTRATION",
    title: "系统管理",
    subtitle: "管理成员、权限、模型配额与渠道集成。",
  },
};

const taskRows: Task[] = [
  {
    id: "BAT-20260729-0821",
    name: "通勤防晒 · 夏日焕新",
    type: "图片",
    product: "轻透防晒乳 SPF50+",
    progress: 72,
    status: "生成中",
    count: "18 / 25",
    cost: "¥ 36.40",
    time: "刚刚",
  },
  {
    id: "VID-20260729-0418",
    name: "早八 30 秒通勤短片",
    type: "视频",
    product: "轻透防晒乳 SPF50+",
    progress: 46,
    status: "生成中",
    count: "6 / 12 镜头",
    cost: "¥ 84.20",
    time: "4 分钟前",
  },
  {
    id: "PRE-20260729-0796",
    name: "冰感咖啡新品预览",
    type: "图片",
    product: "生椰冰萃",
    progress: 100,
    status: "待审核",
    count: "1 / 1",
    cost: "¥ 1.80",
    time: "18 分钟前",
  },
  {
    id: "BAT-20260728-0631",
    name: "户外轻量鞋 · 城市徒步",
    type: "图片",
    product: "CloudStep 2.0",
    progress: 92,
    status: "部分成功",
    count: "46 / 50",
    cost: "¥ 71.60",
    time: "昨天 18:32",
  },
  {
    id: "VID-20260728-0302",
    name: "夏日衣橱一周穿搭",
    type: "视频",
    product: "云感亚麻衬衫",
    progress: 100,
    status: "已完成",
    count: "8 / 8",
    cost: "¥ 126.00",
    time: "昨天 16:08",
  },
  {
    id: "BAT-20260727-0514",
    name: "无线耳机卖点组合",
    type: "图片",
    product: "AirTone Mini",
    progress: 0,
    status: "失败",
    count: "0 / 20",
    cost: "¥ 0.00",
    time: "周一 11:24",
  },
];

const assetCards = [
  {
    id: "AST-10928",
    title: "通勤防晒 · 极简版",
    meta: "1:1 · 抖音信息流",
    result: "CTR 4.82%",
    tone: "sun",
    status: "投放中",
  },
  {
    id: "AST-10914",
    title: "通勤防晒 · 场景版",
    meta: "3:4 · 小红书",
    result: "CTR 5.36%",
    tone: "aqua",
    status: "优秀素材",
  },
  {
    id: "AST-10866",
    title: "生椰冰萃 · 夏日上新",
    meta: "4:5 · 微信朋友圈",
    result: "CTR 3.91%",
    tone: "coffee",
    status: "已通过",
  },
  {
    id: "AST-10851",
    title: "CloudStep · 城市漫游",
    meta: "1:1 · Meta",
    result: "CPA ¥ 42.6",
    tone: "lime",
    status: "已通过",
  },
  {
    id: "AST-10794",
    title: "AirTone · 沉浸听感",
    meta: "16:9 · B 站",
    result: "完播率 38%",
    tone: "violet",
    status: "投放中",
  },
  {
    id: "AST-10772",
    title: "亚麻衬衫 · 一周穿搭",
    meta: "9:16 · 抖音",
    result: "ROAS 3.4",
    tone: "linen",
    status: "优秀素材",
  },
];

function StatusPill({ status }: { status: string }) {
  return <span className={`status-pill status-${status}`}>{status}</span>;
}

function MiniBars({ values, color = "violet" }: { values: number[]; color?: string }) {
  return (
    <div className={`mini-bars bars-${color}`} aria-label="趋势图">
      {values.map((value, index) => (
        <i key={`${value}-${index}`} style={{ height: `${value}%` }} />
      ))}
    </div>
  );
}

function Topbar({
  active,
  onMenu,
  onNavigate,
}: {
  active: ModuleKey;
  onMenu: () => void;
  onNavigate: (key: ModuleKey) => void;
}) {
  const copy = titles[active];
  return (
    <header className="topbar">
      <button className="menu-button" onClick={onMenu} aria-label="打开导航">
        ☰
      </button>
      <div className="page-heading">
        <span>{copy.eyebrow}</span>
        <h1>{copy.title}</h1>
        <p>{copy.subtitle}</p>
      </div>
      <div className="topbar-actions">
        <label className="global-search">
          <span>⌘</span>
          <input aria-label="全局搜索" placeholder="搜索任务、素材或商品" />
          <kbd>⌘ K</kbd>
        </label>
        <button className="icon-button" aria-label="通知">
          ♢<b />
        </button>
        <button className="new-button" onClick={() => onNavigate("image")}>
          <span>＋</span> 新建素材
        </button>
      </div>
    </header>
  );
}

function Sidebar({
  active,
  open,
  onSelect,
  onClose,
}: {
  active: ModuleKey;
  open: boolean;
  onSelect: (key: ModuleKey) => void;
  onClose: () => void;
}) {
  return (
    <>
      <button
        className={`mobile-scrim ${open ? "show" : ""}`}
        onClick={onClose}
        aria-label="关闭导航"
      />
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <span />
            <span />
            <span />
          </div>
          <div>
            <strong>MUSE</strong>
            <small>AI CREATIVE OS</small>
          </div>
        </div>
        <button className="workspace-switch">
          <span className="workspace-logo">N</span>
          <span>
            <b>Northstar Beauty</b>
            <small>品牌中心 · 中国区</small>
          </span>
          <i>⌄</i>
        </button>
        <nav>
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <span className="nav-label">{group.label}</span>
              {group.items.map((item) => (
                <button
                  key={item.key}
                  className={active === item.key ? "active" : ""}
                  onClick={() => {
                    onSelect(item.key);
                    onClose();
                  }}
                >
                  <i>{item.icon}</i>
                  <span>{item.label}</span>
                  {item.badge && <em>{item.badge}</em>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="quota-card">
            <div>
              <span>本月生成额度</span>
              <b>72%</b>
            </div>
            <progress value="72" max="100" />
            <small>14,380 / 20,000 点</small>
          </div>
          <button className="profile">
            <span className="avatar">YX</span>
            <span>
              <b>余小序</b>
              <small>创意运营负责人</small>
            </span>
            <i>•••</i>
          </button>
        </div>
      </aside>
    </>
  );
}

function StageRail({ current }: { current: number }) {
  const stages = ["理解需求", "智能选品", "创意方案", "单条预览", "批量生成"];
  return (
    <div className="stage-rail">
      {stages.map((stage, index) => (
        <div
          key={stage}
          className={`${index + 1 === current ? "current" : ""} ${
            index + 1 < current ? "complete" : ""
          }`}
        >
          <span>{index + 1 < current ? "✓" : index + 1}</span>
          <b>{stage}</b>
          {index < stages.length - 1 && <i />}
        </div>
      ))}
    </div>
  );
}

function CreativeMockup({ video = false }: { video?: boolean }) {
  return (
    <div className={`creative-mockup ${video ? "video-mockup" : ""}`}>
      <div className="mockup-orbit orbit-a" />
      <div className="mockup-orbit orbit-b" />
      <div className="mockup-copy">
        <span>NORTHSTAR / DAILY SUN</span>
        <h3>{video ? "早八通勤" : "轻盈出门"}</h3>
        <h4>{video ? "防晒只留 30 秒" : "不让防晒拖慢早晨"}</h4>
        <p>轻透防护 · 持妆不粘腻</p>
        <button>{video ? "00:15 预览" : "即刻焕新 →"}</button>
      </div>
      <div className="product-tube">
        <i>NS</i>
        <b>DAILY<br />SUN</b>
        <small>SPF 50+</small>
      </div>
      {video && <span className="play-indicator">▶</span>}
    </div>
  );
}

function GenerationWorkspace({
  mediaType,
  notify,
}: {
  mediaType: "image" | "video";
  notify: (message: string) => void;
}) {
  const isVideo = mediaType === "video";
  const [stage, setStage] = useState(3);
  const [message, setMessage] = useState("");
  const [generating, setGenerating] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "agent",
      text: isVideo
        ? "我已经根据通勤人群和抖音 15 秒规格，生成了 Hook—场景—卖点—CTA 的视频结构。右侧有 5 个分镜，你可以锁定满意的镜头。"
        : "我已经把你的投放目标整理好了：面向 22–35 岁通勤女性，主推轻薄不粘腻，投放抖音信息流与小红书。接下来一起确认创意方向。",
    },
    {
      role: "user",
      text: isVideo
        ? "节奏要快，第一秒就出现通勤痛点，结尾不要太硬广。"
        : "想要干净、轻盈的感觉，别像传统防晒广告。商品最好在第一屏就出现。",
    },
    {
      role: "agent",
      text: isVideo
        ? "已调整：0–1.8 秒用“早八只剩 30 秒”做 Hook，第 2 镜产品入画；CTA 改为场景化的“轻盈出门”。"
        : "已更新方案。建议使用「奶油白 × 晨光橙」主色，产品居中偏右，左侧用短标题制造呼吸感。我同时准备了 3 种文案变体。",
    },
  ]);

  const sendMessage = () => {
    if (!message.trim()) return;
    setMessages((items) => [...items, { role: "user", text: message.trim() }]);
    setMessage("");
    window.setTimeout(() => {
      setMessages((items) => [
        ...items,
        {
          role: "agent",
          text: "收到。我已把这条要求加入创意约束，并同步更新右侧方案。强制品牌与合规字段保持不变。",
        },
      ]);
    }, 450);
  };

  const primaryAction = () => {
    if (stage < 3) {
      setStage(stage + 1);
      notify("阶段已确认，方案快照已保存");
      return;
    }
    if (stage === 3) {
      setGenerating(true);
      notify("预览任务已创建，仅生成 1 条素材");
      window.setTimeout(() => {
        setGenerating(false);
        setStage(4);
        notify("单条预览已完成，可以确认或继续修改");
      }, 1000);
      return;
    }
    if (stage === 4) {
      setStage(5);
      notify("批量任务 BAT-20260729-0821 已进入任务中心");
      return;
    }
    notify("任务已在后台生成，完成后会通知你");
  };

  return (
    <section className="studio-page">
      <div className="studio-toolbar">
        <div>
          <button className="ghost-chip">← 草稿</button>
          <span className="draft-name">
            {isVideo ? "早八通勤 30 秒防晒短片" : "夏日通勤防晒 · 轻盈出门"}
          </span>
          <span className="saved-state">✓ 已自动保存</span>
        </div>
        <div>
          <button className="icon-text-button">↗ 分享</button>
          <button className="icon-text-button">•••</button>
        </div>
      </div>
      <StageRail current={stage} />
      <div className="studio-grid">
        <div className="agent-panel">
          <div className="agent-panel-head">
            <div>
              <span className="agent-avatar">✦</span>
              <div>
                <b>Muse Agent</b>
                <small><i /> 正在协作 · 创意方案阶段</small>
              </div>
            </div>
            <button>⌁ 上下文</button>
          </div>
          <div className="conversation">
            <div className="context-note">
              <span>✓</span>
              已读取 4 项知识：商品信息、品牌规范、抖音规格、行业合规
            </div>
            {messages.map((item, index) => (
              <div className={`message ${item.role}`} key={`${item.role}-${index}`}>
                {item.role === "agent" && <span className="message-avatar">✦</span>}
                <div>
                  <p>{item.text}</p>
                  {item.role === "agent" && index === messages.length - 1 && (
                    <div className="message-actions">
                      <button onClick={() => notify("建议已采用")}>采用建议</button>
                      <button onClick={() => notify("已展开方案依据")}>查看依据</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="prompt-box">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="告诉 Agent 你想调整什么…"
              aria-label="给 Agent 发送消息"
            />
            <div>
              <span>
                <button aria-label="添加附件">＋</button>
                <button aria-label="快捷指令">⌘</button>
              </span>
              <small>Enter 发送 · Shift + Enter 换行</small>
              <button className="send-button" onClick={sendMessage} aria-label="发送">
                ↑
              </button>
            </div>
          </div>
        </div>

        <div className="plan-panel">
          <div className="plan-head">
            <div>
              <span>STRUCTURED PLAN</span>
              <h2>{isVideo ? "视频创意方案" : "图片创意方案"}</h2>
            </div>
            <div>
              <button>版本 03⌄</button>
              <span className="score-badge">92 <small>方案分</small></span>
            </div>
          </div>
          <div className="plan-scroll">
            <div className="summary-strip">
              <div><span>渠道</span><b>抖音信息流</b></div>
              <div><span>人群</span><b>22–35 岁通勤女性</b></div>
              <div><span>规格</span><b>{isVideo ? "9:16 · 15 秒" : "1:1 · 1080 px"}</b></div>
              <div><span>计划数量</span><b>{isVideo ? "12 条" : "25 张"}</b></div>
            </div>

            <div className="plan-section">
              <div className="section-title">
                <div><span>01</span><h3>主推商品</h3></div>
                <button onClick={() => notify("已打开商品候选")}>更换商品</button>
              </div>
              <div className="product-row">
                <div className="product-thumb"><i>NS</i></div>
                <div>
                  <b>Northstar 轻透防晒乳 SPF50+</b>
                  <p>轻薄成膜 · 不粘腻 · 通勤便携</p>
                  <span>活动价 ¥129</span><span>库存充足</span>
                </div>
                <strong>首选</strong>
              </div>
            </div>

            <div className="plan-section">
              <div className="section-title">
                <div><span>02</span><h3>{isVideo ? "视频结构与分镜" : "创意方向"}</h3></div>
                <button onClick={() => notify("已复制为新的创意版本")}>复制版本</button>
              </div>
              {isVideo ? (
                <div className="storyboard">
                  {[
                    ["00–02s", "HOOK", "早八只剩 30 秒"],
                    ["02–05s", "SCENE", "电梯镜前快速整理"],
                    ["05–09s", "PRODUCT", "轻薄质地与成膜"],
                    ["09–12s", "BENEFIT", "通勤路上不粘腻"],
                    ["12–15s", "CTA", "轻盈出门"],
                  ].map((shot, index) => (
                    <div className="shot-card" key={shot[0]}>
                      <div className={`shot-visual shot-${index + 1}`}><span>{index + 1}</span></div>
                      <div><span>{shot[0]} · {shot[1]}</span><b>{shot[2]}</b></div>
                      <button aria-label="锁定镜头">♙</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="creative-fields">
                  <label>
                    <span>创意主题</span>
                    <input value="轻盈出门 / Morning Light" readOnly />
                  </label>
                  <div>
                    <label>
                      <span>视觉风格</span>
                      <button className="select-like">干净生活方式⌄</button>
                    </label>
                    <label>
                      <span>构图</span>
                      <button className="select-like">商品右置 · 留白文案⌄</button>
                    </label>
                  </div>
                  <label>
                    <span>主标题</span>
                    <input value="轻盈出门，不让防晒拖慢早晨" readOnly />
                  </label>
                  <div className="palette-row">
                    <span>品牌色板</span>
                    <i className="color-a" /><i className="color-b" /><i className="color-c" />
                    <small>#FFF5E8 · #FF825C · #242D3C</small>
                  </div>
                </div>
              )}
            </div>

            <div className="plan-section preview-section">
              <div className="section-title">
                <div><span>03</span><h3>单条预览</h3></div>
                <span className="preview-rule">每次仅生成 1 条</span>
              </div>
              <div className="preview-area">
                <CreativeMockup video={isVideo} />
                <div className="preview-side">
                  <span className="compliance-ok">✓ 品牌与合规检查通过</span>
                  <dl>
                    <div><dt>模型档位</dt><dd>质量优先</dd></div>
                    <div><dt>预计耗时</dt><dd>{isVideo ? "3–6 分钟" : "35–60 秒"}</dd></div>
                    <div><dt>预估成本</dt><dd>{isVideo ? "¥ 12–18" : "¥ 1.6–2.2"}</dd></div>
                  </dl>
                  <button onClick={() => notify("已进入局部编辑模式")}>⌘ 局部修改</button>
                  <button onClick={() => notify("已基于相同方案重新生成")}>↻ 保持方案重做</button>
                </div>
                {generating && (
                  <div className="generating-cover">
                    <span className="generation-spinner" />
                    <b>正在生成单条预览</b>
                    <small>已冻结当前方案与知识版本</small>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="plan-footer">
            <div>
              <span>当前阶段</span>
              <b>{stage === 3 ? "确认创意方案" : stage === 4 ? "确认单条预览" : "批量任务已提交"}</b>
            </div>
            <button
              className="secondary-button"
              onClick={() => {
                setStage(Math.max(1, stage - 1));
                notify("已返回上一阶段，历史版本仍然保留");
              }}
              disabled={stage === 1}
            >
              返回上一步
            </button>
            <button className="primary-button" onClick={primaryAction} disabled={generating}>
              {stage === 3
                ? "生成 1 条预览"
                : stage === 4
                  ? "确认预览并批量生成"
                  : stage === 5
                    ? "查看任务进度"
                    : "确认并继续"}
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Dashboard({ navigate }: { navigate: (key: ModuleKey) => void }) {
  return (
    <section className="content-page dashboard-page">
      <div className="hero-card">
        <div>
          <span className="hero-label">GOOD MORNING, YUXU</span>
          <h2>今天有 12 个创意<br />等待你做决定。</h2>
          <p>生成队列运行正常，回流数据已更新至 10:20。</p>
          <div>
            <button className="primary-button" onClick={() => navigate("image")}>＋ 创建新素材</button>
            <button className="secondary-button" onClick={() => navigate("review")}>处理审核待办</button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-ring ring-one" />
          <div className="hero-ring ring-two" />
          <div className="hero-product">NS<small>DAILY SUN</small></div>
          <span className="floating-chip chip-one">CTR +18%</span>
          <span className="floating-chip chip-two">92 方案分</span>
        </div>
      </div>
      <div className="metric-grid">
        {[
          ["本周产出", "286", "张 / 条", "+24%", [40, 52, 46, 70, 62, 84, 92]],
          ["一次通过率", "87.6", "%", "+6.2%", [55, 60, 58, 72, 69, 78, 88]],
          ["素材采用率", "63.8", "%", "+9.4%", [30, 42, 48, 50, 67, 64, 78]],
          ["平均产出时长", "18", "分钟", "-7 分钟", [88, 76, 72, 65, 58, 52, 42]],
        ].map((metric, index) => (
          <article className="metric-card" key={metric[0] as string}>
            <div><span>{metric[0] as string}</span><em>{metric[3] as string}</em></div>
            <strong>{metric[1] as string}<small>{metric[2] as string}</small></strong>
            <MiniBars values={metric[4] as number[]} color={index === 3 ? "coral" : "violet"} />
          </article>
        ))}
      </div>
      <div className="dashboard-grid">
        <article className="panel-card production-card">
          <div className="card-heading">
            <div><span>PRODUCTION FLOW</span><h3>今日生产进度</h3></div>
            <button onClick={() => navigate("tasks")}>查看全部 →</button>
          </div>
          {taskRows.slice(0, 4).map((task) => (
            <div className="compact-task" key={task.id}>
              <span className={`task-type type-${task.type}`}>{task.type === "图片" ? "✦" : "▶"}</span>
              <div><b>{task.name}</b><small>{task.id} · {task.time}</small></div>
              <div className="compact-progress"><i style={{ width: `${task.progress}%` }} /></div>
              <span>{task.count}</span>
              <StatusPill status={task.status} />
            </div>
          ))}
        </article>
        <article className="panel-card insight-card">
          <div className="card-heading">
            <div><span>AGENT INSIGHT</span><h3>值得验证的方向</h3></div>
            <span className="ai-badge">✦ AI</span>
          </div>
          <div className="insight-visual">
            <span>近 14 日 · 同商品 · 抖音</span>
            <strong>+21.4%</strong>
            <p>短 Hook 素材的 CTR 中位数更高</p>
            <div className="compare-bars">
              <div><i style={{ width: "82%" }} /><span>短 Hook · 4.72%</span></div>
              <div><i style={{ width: "58%" }} /><span>长 Hook · 3.89%</span></div>
            </div>
          </div>
          <small className="caveat">观察基于 38 条达到消耗门槛的素材，不代表因果关系。</small>
          <button onClick={() => navigate("video")}>基于这个方向生成变体 →</button>
        </article>
      </div>
    </section>
  );
}

function TasksPage({ notify }: { notify: (message: string) => void }) {
  const [filter, setFilter] = useState("全部任务");
  const [selected, setSelected] = useState<Task | null>(null);
  const filtered = filter === "全部任务" ? taskRows : taskRows.filter((task) => task.status === filter);
  return (
    <section className="content-page">
      <div className="page-actions-row">
        <div className="segmented-control">
          {["全部任务", "生成中", "待审核", "部分成功", "失败"].map((item) => (
            <button className={filter === item ? "active" : ""} onClick={() => setFilter(item)} key={item}>
              {item}
            </button>
          ))}
        </div>
        <div>
          <button className="secondary-button">⌘ 筛选</button>
          <button className="primary-button" onClick={() => notify("任务列表已刷新")}>↻ 刷新进度</button>
        </div>
      </div>
      <div className="task-stats">
        <div><span>运行中</span><b>6</b><small>2 个视频任务</small></div>
        <div><span>今日完成</span><b>42</b><small>成功率 96.8%</small></div>
        <div><span>待重试</span><b>4</b><small>均为模型超时</small></div>
        <div><span>今日成本</span><b>¥ 438</b><small>预算使用 68%</small></div>
      </div>
      <div className="table-card">
        <div className="table-toolbar">
          <label><span>⌕</span><input placeholder="搜索任务名称或 ID" /></label>
          <span>共 {filtered.length} 个任务</span>
        </div>
        <div className="data-table task-table">
          <div className="table-row table-header">
            <span>任务</span><span>商品</span><span>进度</span><span>状态</span><span>成本</span><span>创建时间</span><span />
          </div>
          {filtered.map((task) => (
            <button className="table-row" key={task.id} onClick={() => setSelected(task)}>
              <span className="task-main">
                <i className={`task-type type-${task.type}`}>{task.type === "图片" ? "✦" : "▶"}</i>
                <span><b>{task.name}</b><small>{task.id}</small></span>
              </span>
              <span>{task.product}</span>
              <span className="progress-cell">
                <span><i style={{ width: `${task.progress}%` }} /></span><small>{task.count}</small>
              </span>
              <span><StatusPill status={task.status} /></span>
              <span>{task.cost}</span>
              <span>{task.time}</span>
              <span>›</span>
            </button>
          ))}
        </div>
      </div>
      {selected && (
        <div className="drawer-shell">
          <button className="drawer-scrim" onClick={() => setSelected(null)} aria-label="关闭详情" />
          <aside className="detail-drawer">
            <div className="drawer-head">
              <div><span>TASK DETAIL</span><h2>{selected.name}</h2><p>{selected.id}</p></div>
              <button onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="drawer-summary">
              <div><span>当前状态</span><StatusPill status={selected.status} /></div>
              <div><span>任务进度</span><b>{selected.count}</b></div>
              <div><span>累计成本</span><b>{selected.cost}</b></div>
            </div>
            <h3>阶段时间线</h3>
            <div className="timeline">
              {[
                ["需求与方案快照", "已完成", "10:21:04"],
                ["提示词编译", "已完成", "10:21:12"],
                ["模型生成", selected.status === "失败" ? "已失败" : "进行中", "10:22:08"],
                ["工程处理与安全检查", "等待中", "—"],
                ["产物提交", "等待中", "—"],
              ].map((step, index) => (
                <div key={step[0]} className={index < 2 ? "done" : index === 2 ? "running" : ""}>
                  <i>{index < 2 ? "✓" : index + 1}</i>
                  <span><b>{step[0]}</b><small>{step[1]}</small></span>
                  <em>{step[2]}</em>
                </div>
              ))}
            </div>
            <h3>可追溯快照</h3>
            <div className="trace-grid">
              <div><span>创意方案</span><b>CP-0821 · V03</b></div>
              <div><span>知识版本</span><b>4 个已发布版本</b></div>
              <div><span>模型版本</span><b>Image Pro · 2026.07</b></div>
              <div><span>审核策略</span><b>Beauty-CN · V12</b></div>
            </div>
            <div className="drawer-actions">
              <button className="secondary-button" onClick={() => notify("已取消尚未开始的子任务")}>取消未开始项</button>
              <button className="primary-button" onClick={() => notify("4 个失败子任务已重新入队")}>重试失败项</button>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

function ReviewPage({ notify }: { notify: (message: string) => void }) {
  const initial = [
    { id: "REV-10821", title: "生椰冰萃 · 夏日上新", risk: "低风险", type: "图片", by: "林柯", time: "剩余 18 分钟", tone: "coffee" },
    { id: "REV-10819", title: "通勤防晒 · 成分卖点", risk: "中风险", type: "图片", by: "陈一", time: "剩余 32 分钟", tone: "sun" },
    { id: "REV-10814", title: "AirTone · 沉浸听感", risk: "低风险", type: "视频", by: "周然", time: "剩余 1 小时", tone: "violet" },
    { id: "REV-10808", title: "CloudStep · 城市漫游", risk: "高风险", type: "图片", by: "代理商 A", time: "已超时 6 分钟", tone: "lime" },
  ];
  const [items, setItems] = useState(initial);
  const [selected, setSelected] = useState(initial[0]);
  const decide = (approved: boolean) => {
    setItems((list) => list.filter((item) => item.id !== selected.id));
    notify(approved ? "素材已通过审核并进入素材库" : "已驳回到创意方案阶段");
    const rest = items.filter((item) => item.id !== selected.id);
    if (rest[0]) setSelected(rest[0]);
  };
  return (
    <section className="content-page review-layout">
      <div className="review-queue">
        <div className="review-filter">
          <div><button className="active">待我审核 <b>{items.length}</b></button><button>已审核</button></div>
          <button>⌘</button>
        </div>
        <label className="queue-search"><span>⌕</span><input placeholder="搜索审核项" /></label>
        <div className="queue-list">
          {items.map((item) => (
            <button className={selected.id === item.id ? "active" : ""} key={item.id} onClick={() => setSelected(item)}>
              <div className={`queue-thumb asset-${item.tone}`}><span>{item.type === "视频" ? "▶" : "✦"}</span></div>
              <div><span><StatusPill status={item.risk} /> <small>{item.type}</small></span><b>{item.title}</b><p>{item.by} · {item.id}</p><em>{item.time}</em></div>
            </button>
          ))}
          {items.length === 0 && <div className="empty-state"><span>✓</span><b>审核队列已清空</b><p>今天的决定都已处理完成。</p></div>}
        </div>
      </div>
      <div className="review-workbench">
        {items.length > 0 ? (
          <>
            <div className="review-canvas">
              <div className="review-canvas-bar">
                <div><span>{selected.id}</span><b>{selected.title}</b></div>
                <div><button>50%</button><button>↗</button><button>•••</button></div>
              </div>
              <CreativeMockup video={selected.type === "视频"} />
              <div className="review-zoom">− <span>━━━━━━━━</span> ＋</div>
            </div>
            <aside className="review-inspector">
              <div className="review-context">
                <span>审核上下文</span>
                <h3>{selected.title}</h3>
                <dl>
                  <div><dt>商品</dt><dd>轻透防晒乳 SPF50+</dd></div>
                  <div><dt>渠道</dt><dd>抖音信息流</dd></div>
                  <div><dt>创建人</dt><dd>{selected.by}</dd></div>
                  <div><dt>政策版本</dt><dd>Beauty-CN V12</dd></div>
                </dl>
              </div>
              <div className="machine-review">
                <div><span>✦ 机器预审</span><StatusPill status="已通过" /></div>
                <p>未发现硬性违规；1 项文案建议需要人工确认。</p>
                <button><i>!</i><span><b>功效表达可能过强</b><small>“全天无惧晒黑”建议改为客观描述</small></span><em>中</em></button>
              </div>
              <div className="checklist">
                <span>人工检查项</span>
                {["商品与价格事实准确", "Logo 与品牌色使用正确", "未使用禁用或夸大表述", "字幕与 CTA 位于安全区", "参考素材授权有效"].map((check, index) => (
                  <label key={check}><input type="checkbox" defaultChecked={index !== 2} /><span>{check}</span></label>
                ))}
              </div>
              <label className="review-note"><span>审核备注</span><textarea placeholder="补充审核说明（驳回时必填）" /></label>
              <div className="review-actions">
                <button className="reject-button" onClick={() => decide(false)}>× 驳回修改</button>
                <button className="approve-button" onClick={() => decide(true)}>✓ 通过审核</button>
              </div>
            </aside>
          </>
        ) : (
          <div className="review-empty-large"><span>✓</span><h2>全部审核完成</h2><p>新的审核任务到达后会出现在左侧队列。</p></div>
        )}
      </div>
    </section>
  );
}

function AssetsPage({ notify }: { notify: (message: string) => void }) {
  const [selected, setSelected] = useState<(typeof assetCards)[number] | null>(null);
  const [view, setView] = useState("grid");
  return (
    <section className="content-page">
      <div className="library-summary">
        <div><span>全部素材</span><b>12,842</b><small>图片 9,604 · 视频 3,238</small></div>
        <div><span>本周新增</span><b>286</b><small>较上周 +24%</small></div>
        <div><span>已投放</span><b>1,834</b><small>映射完整率 96.2%</small></div>
        <div><span>优秀素材</span><b>148</b><small>授权有效 143</small></div>
      </div>
      <div className="library-toolbar">
        <div className="segmented-control"><button className="active">全部素材</button><button>图片</button><button>视频</button><button>我的集合</button></div>
        <div>
          <label><span>⌕</span><input placeholder="搜索素材 ID、商品或标签" /></label>
          <button className="secondary-button">⌘ 筛选</button>
          <button className={view === "grid" ? "view-active" : ""} onClick={() => setView("grid")}>▦</button>
          <button className={view === "list" ? "view-active" : ""} onClick={() => setView("list")}>☷</button>
        </div>
      </div>
      <div className={`asset-grid ${view === "list" ? "asset-list-view" : ""}`}>
        {assetCards.map((asset, index) => (
          <button className="asset-card" key={asset.id} onClick={() => setSelected(asset)}>
            <div className={`asset-visual asset-${asset.tone}`}>
              <span className="asset-index">0{index + 1}</span>
              <div className="asset-wordmark">{asset.tone === "coffee" ? "COCO" : asset.tone === "lime" ? "MOVE" : "NS"}</div>
              <strong>{asset.title.split("·")[0]}</strong>
              <small>{asset.title.split("·")[1]}</small>
              <i>{index === 4 || index === 5 ? "▶" : "✦"}</i>
            </div>
            <div className="asset-card-copy">
              <div><StatusPill status={asset.status} /><span>{asset.result}</span></div>
              <b>{asset.title}</b>
              <p>{asset.meta}</p>
              <small>{asset.id}</small>
            </div>
          </button>
        ))}
      </div>
      {selected && (
        <div className="modal-shell">
          <button className="modal-scrim" onClick={() => setSelected(null)} aria-label="关闭" />
          <div className="asset-modal">
            <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            <div className={`asset-modal-preview asset-${selected.tone}`}>
              <div className="asset-wordmark">{selected.tone === "coffee" ? "COCO" : "NS"}</div>
              <strong>{selected.title}</strong>
              <small>CREATIVE / PERFORMANCE / LINEAGE</small>
            </div>
            <div className="asset-modal-info">
              <span>ASSET ARCHIVE</span>
              <h2>{selected.title}</h2>
              <p>{selected.id} · 版本 04</p>
              <div className="asset-performance">
                <div><span>投放表现</span><b>{selected.result}</b></div>
                <div><span>审核状态</span><StatusPill status="已通过" /></div>
                <div><span>媒体映射</span><b>3 个创意 ID</b></div>
              </div>
              <h3>生成谱系</h3>
              <div className="lineage">
                <span>需求会话 <b>SES-0821</b></span><i>→</i><span>创意方案 <b>CP-0821 V03</b></span><i>→</i><span>生成任务 <b>BAT-0821</b></span>
              </div>
              <h3>关联信息</h3>
              <dl>
                <div><dt>商品</dt><dd>Northstar 轻透防晒乳</dd></div>
                <div><dt>渠道</dt><dd>{selected.meta}</dd></div>
                <div><dt>知识快照</dt><dd>4 个已发布版本</dd></div>
                <div><dt>授权有效期</dt><dd>2027-06-30</dd></div>
              </dl>
              <div className="modal-actions">
                <button className="secondary-button" onClick={() => notify("素材已加入「夏日重点」集合")}>＋ 加入集合</button>
                <button className="secondary-button" onClick={() => notify("已复制方案并创建新会话")}>生成变体</button>
                <button className="primary-button" onClick={() => notify("渠道规格包正在准备")}>↧ 导出素材</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function KnowledgePage({ notify }: { notify: (message: string) => void }) {
  const [tab, setTab] = useState("商品");
  const rows = [
    ["NS-SUN-050", "轻透防晒乳 SPF50+", "防晒护理", "商品中心 API", "V18", "已发布", "2 分钟前"],
    ["NS-SERUM-030", "焕亮精华液 30ml", "精华", "PIM 系统", "V09", "已发布", "今天 09:18"],
    ["NS-MASK-005", "冰感补水面膜 5 片", "面膜", "运营录入", "V06", "待审批", "昨天 17:42"],
    ["NS-CREAM-050", "云感修护面霜 50g", "面霜", "PIM 系统", "V12", "已发布", "昨天 13:06"],
    ["NS-LIP-3G", "柔雾唇釉 3g", "彩妆", "商品中心 API", "V15", "即将过期", "周一 10:20"],
  ];
  return (
    <section className="content-page">
      <div className="knowledge-hero">
        <div><span>TRUSTED CONTEXT</span><h2>让每一次生成都有事实依据。</h2><p>商品、品牌、合规和创意资产经过版本化发布，Agent 只能引用当前有效内容。</p></div>
        <div className="knowledge-health"><span>知识健康度</span><strong>94</strong><small>较上周 +3</small><MiniBars values={[58, 66, 62, 74, 72, 82, 94]} /></div>
      </div>
      <div className="knowledge-stats">
        <div><i>◎</i><span><b>2,486</b><small>已发布条目</small></span></div>
        <div><i>↻</i><span><b>38</b><small>待更新条目</small></span></div>
        <div><i>!</i><span><b>7</b><small>规则冲突</small></span></div>
        <div><i>⌁</i><span><b>96.8%</b><small>召回命中率</small></span></div>
      </div>
      <div className="knowledge-card">
        <div className="knowledge-tabs">
          {["商品", "品牌与合规", "创意资产", "渠道规格"].map((item) => <button className={tab === item ? "active" : ""} onClick={() => setTab(item)} key={item}>{item}</button>)}
          <div><button className="secondary-button" onClick={() => notify("已打开召回测试台")}>⌘ 召回测试</button><button className="primary-button" onClick={() => notify("已新建知识条目草稿")}>＋ 新建条目</button></div>
        </div>
        <div className="table-toolbar"><label><span>⌕</span><input placeholder={`搜索${tab}知识`} /></label><span>最后同步：2 分钟前</span></div>
        <div className="data-table knowledge-table">
          <div className="table-row table-header"><span>条目</span><span>类目</span><span>来源</span><span>版本</span><span>状态</span><span>更新时间</span><span /></div>
          {rows.map((row) => (
            <button className="table-row" key={row[0]} onClick={() => notify(`${row[1]}：已打开版本详情`)}>
              <span><b>{row[1]}</b><small>{row[0]}</small></span><span>{row[2]}</span><span>{row[3]}</span><span>{row[4]}</span><span><StatusPill status={row[5]} /></span><span>{row[6]}</span><span>›</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function AnalyticsPage() {
  const bars = [42, 58, 51, 66, 72, 68, 84, 78, 92, 88, 96, 91];
  return (
    <section className="content-page">
      <div className="analytics-toolbar">
        <div className="segmented-control"><button className="active">近 30 天</button><button>近 7 天</button><button>本季度</button></div>
        <div><button className="secondary-button">Northstar Beauty⌄</button><button className="secondary-button">全部渠道⌄</button><button className="primary-button">↧ 导出报告</button></div>
      </div>
      <div className="metric-grid analytics-metrics">
        {[
          ["素材采用率", "63.8%", "+9.4%", "1,834 / 2,874"],
          ["平均 CTR", "4.36%", "+12.8%", "渠道加权口径"],
          ["跑出素材数", "148", "+26", "达到消耗与效果门槛"],
          ["数据映射率", "96.2%", "+1.8%", "更新至 10:20"],
        ].map((item, index) => (
          <div className="metric-card" key={item[0]}><div><span>{item[0]}</span><em>{item[2]}</em></div><strong>{item[1]}</strong><small>{item[3]}</small><MiniBars values={bars.slice(index, index + 7)} color={index === 2 ? "coral" : "violet"} /></div>
        ))}
      </div>
      <div className="analytics-grid">
        <article className="panel-card trend-chart">
          <div className="card-heading"><div><span>CREATIVE OUTPUT</span><h3>产出与采用趋势</h3></div><div className="chart-legend"><span><i /> 生成数</span><span><i /> 采用数</span></div></div>
          <div className="bar-chart">
            {bars.map((value, index) => <div key={index}><i style={{ height: `${value}%` }}><em style={{ height: `${Math.max(20, value - 28)}%` }} /></i><span>{index % 2 === 0 ? `${index + 1}日` : ""}</span></div>)}
          </div>
        </article>
        <article className="panel-card channel-card">
          <div className="card-heading"><div><span>CHANNEL MIX</span><h3>渠道表现</h3></div><button>按 CTR⌄</button></div>
          {[
            ["抖音", "4.82%", "+18%", 92],
            ["小红书", "5.16%", "+11%", 84],
            ["微信朋友圈", "3.74%", "+6%", 68],
            ["Meta", "3.41%", "-2%", 58],
          ].map((channel) => <div className="channel-row" key={channel[0] as string}><span>{channel[0]}</span><div><i style={{ width: `${channel[3]}%` }} /></div><b>{channel[1]}</b><em>{channel[2]}</em></div>)}
        </article>
        <article className="panel-card ranking-card">
          <div className="card-heading"><div><span>TOP CREATIVES</span><h3>高表现素材</h3></div><button>查看全部 →</button></div>
          {assetCards.slice(0, 4).map((asset, index) => <div key={asset.id}><span>0{index + 1}</span><div className={`ranking-thumb asset-${asset.tone}`} /><p><b>{asset.title}</b><small>{asset.meta}</small></p><strong>{asset.result}</strong></div>)}
        </article>
        <article className="panel-card funnel-card">
          <div className="card-heading"><div><span>PRODUCTION FUNNEL</span><h3>生产转化漏斗</h3></div></div>
          {[
            ["创建会话", "3,428", 100],
            ["完成创意确认", "3,016", 88],
            ["接受单条预览", "2,654", 77],
            ["发起批量任务", "2,184", 64],
            ["审核通过", "1,967", 57],
            ["实际采用", "1,834", 53],
          ].map((step) => <div key={step[0] as string}><span>{step[0]}</span><i style={{ width: `${step[2]}%` }} /><b>{step[1]}</b></div>)}
        </article>
      </div>
      <div className="data-caveat">数据口径：北京时间（UTC+8）· 媒体归因窗口按渠道配置 · 最近完整日期为 2026-07-28。分组观察不代表因果关系。</div>
    </section>
  );
}

function SettingsPage({ notify }: { notify: (message: string) => void }) {
  const [tab, setTab] = useState("成员与角色");
  return (
    <section className="content-page settings-layout">
      <aside className="settings-nav">
        {["成员与角色", "模型与配额", "渠道集成", "审核策略", "通知设置", "审计日志"].map((item) => <button className={tab === item ? "active" : ""} onClick={() => setTab(item)} key={item}>{item}<span>›</span></button>)}
      </aside>
      <div className="settings-main">
        <div className="settings-head">
          <div><span>WORKSPACE SETTINGS</span><h2>{tab}</h2><p>管理当前品牌空间的{tab}配置。</p></div>
          <button className="primary-button" onClick={() => notify(`${tab}配置已保存`)}>保存更改</button>
        </div>
        {tab === "成员与角色" && (
          <>
            <div className="settings-summary"><div><span>活跃成员</span><b>48</b><small>5 个团队</small></div><div><span>待接受邀请</span><b>3</b><small>7 天后过期</small></div><div><span>外部审核员</span><b>6</b><small>短期授权</small></div></div>
            <div className="settings-card">
              <div className="settings-card-head"><div><h3>空间成员</h3><p>成员只会看到其角色和品牌数据域允许的内容。</p></div><button className="secondary-button" onClick={() => notify("邀请链接已创建")}>＋ 邀请成员</button></div>
              {[
                ["YX", "余小序", "yuxu@northstar.cn", "租户管理员", "全部品牌", "刚刚"],
                ["LK", "林柯", "linke@northstar.cn", "审核员", "Northstar Beauty", "12 分钟前"],
                ["ZY", "周然", "zhouran@northstar.cn", "创意负责人", "美妆 / 个护", "今天 09:02"],
                ["CY", "陈一", "chenyi@northstar.cn", "正式员工", "Northstar Beauty", "昨天 18:42"],
              ].map((user) => <button className="member-row" key={user[1]}><span className="member-avatar">{user[0]}</span><span><b>{user[1]}</b><small>{user[2]}</small></span><span>{user[3]}</span><span>{user[4]}</span><span>{user[5]}</span><i>•••</i></button>)}
            </div>
          </>
        )}
        {tab === "模型与配额" && (
          <div className="settings-card">
            <div className="settings-card-head"><div><h3>模型路由</h3><p>运营只选择质量档位，具体模型由平台按能力、成本与健康度路由。</p></div><StatusPill status="运行正常" /></div>
            {[
              ["图片 · 质量优先", "Image Pro 2026.07", "P95 42 秒", "99.2%", "¥1.82 / 张"],
              ["图片 · 极速预览", "Image Flash 2.1", "P95 14 秒", "98.8%", "¥0.64 / 张"],
              ["视频 · 逐镜生成", "Video Scene 4", "P95 3.8 分钟", "96.4%", "¥8.40 / 镜头"],
              ["文本 · Agent", "Reasoning Large", "P95 6.2 秒", "99.8%", "¥0.12 / 轮"],
            ].map((model) => <div className="model-row" key={model[0]}><span><b>{model[0]}</b><small>{model[1]}</small></span><span>{model[2]}</span><span>{model[3]}</span><span>{model[4]}</span><button>配置</button></div>)}
          </div>
        )}
        {tab === "渠道集成" && (
          <div className="integration-grid">
            {[
              ["抖音巨量引擎", "已连接", "同步至 8 分钟前", "DY"],
              ["小红书聚光", "已连接", "同步至 12 分钟前", "RED"],
              ["微信广告", "需要重连", "凭证将于 3 天后过期", "WX"],
              ["Meta Ads", "已连接", "同步至 28 分钟前", "M"],
            ].map((item) => <article key={item[0]}><span className="integration-logo">{item[3]}</span><h3>{item[0]}</h3><StatusPill status={item[1]} /><p>{item[2]}</p><button onClick={() => notify(`${item[0]}连接测试成功`)}>管理连接 →</button></article>)}
          </div>
        )}
        {!["成员与角色", "模型与配额", "渠道集成"].includes(tab) && (
          <div className="settings-card placeholder-settings">
            <span>◎</span><h3>{tab}</h3><p>该模块已包含在原型范围中，生产环境将接入对应策略与日志服务。</p><button className="primary-button" onClick={() => notify(`${tab}测试配置已保存`)}>创建测试配置</button>
          </div>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  const [active, setActive] = useState<ModuleKey>("image");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState("");

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const page = useMemo(() => {
    switch (active) {
      case "dashboard":
        return <Dashboard navigate={setActive} />;
      case "image":
        return <GenerationWorkspace mediaType="image" notify={notify} />;
      case "video":
        return <GenerationWorkspace mediaType="video" notify={notify} />;
      case "tasks":
        return <TasksPage notify={notify} />;
      case "review":
        return <ReviewPage notify={notify} />;
      case "assets":
        return <AssetsPage notify={notify} />;
      case "knowledge":
        return <KnowledgePage notify={notify} />;
      case "analytics":
        return <AnalyticsPage />;
      case "settings":
        return <SettingsPage notify={notify} />;
      default:
        return null;
    }
  }, [active]);

  return (
    <div className="app-shell">
      <Sidebar
        active={active}
        open={sidebarOpen}
        onSelect={setActive}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="main-shell">
        <Topbar
          active={active}
          onMenu={() => setSidebarOpen(true)}
          onNavigate={setActive}
        />
        {page}
      </main>
      <div className={`toast ${toast ? "toast-show" : ""}`} role="status">
        <span>✓</span>{toast}
      </div>
    </div>
  );
}
