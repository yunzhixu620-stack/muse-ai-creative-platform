"use client";

import { useMemo, useState } from "react";

type ModuleKey =
  | "dashboard"
  | "image"
  | "video"
  | "agents"
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

type GenerationState =
  | "draft"
  | "queued"
  | "preview-generating"
  | "preview-ready"
  | "batch-queued"
  | "batch-generating"
  | "review"
  | "completed"
  | "failed";

type AgentKey = "requirement" | "product" | "image" | "video" | "review";

type AgentSpec = {
  key: AgentKey;
  name: string;
  icon: string;
  stage: string;
  purpose: string;
  responsibility: string;
  boundary: string;
  input: string[];
  output: string[];
  logic: Array<{ title: string; detail: string; gate?: string }>;
  rules: Array<{ label: string; detail: string }>;
  exceptions: string[];
  metrics: string[];
  confirmation: string;
  handoff: string;
  prohibited: string;
};

const generationStateCopy: Record<
  GenerationState,
  {
    label: string;
    detail: string;
    stage: number;
    progress: number;
    tone: string;
  }
> = {
  draft: {
    label: "方案编辑中",
    detail: "创意方案已自动保存，确认后可生成单条预览。",
    stage: 3,
    progress: 0,
    tone: "editing",
  },
  queued: {
    label: "预览排队中",
    detail: "任务已进入队列，正在分配生成资源。",
    stage: 4,
    progress: 8,
    tone: "queued",
  },
  "preview-generating": {
    label: "单条预览生成中",
    detail: "正在执行提示词增强、图片生成与品牌检查。",
    stage: 4,
    progress: 58,
    tone: "running",
  },
  "preview-ready": {
    label: "单条预览已完成",
    detail: "预览已通过品牌与合规检查，请确认后批量生成。",
    stage: 4,
    progress: 100,
    tone: "success",
  },
  "batch-queued": {
    label: "批量任务排队中",
    detail: "批量任务已创建，25 个素材任务等待执行。",
    stage: 5,
    progress: 4,
    tone: "queued",
  },
  "batch-generating": {
    label: "批量生成中",
    detail: "18 / 25 个素材已完成，失败项会自动重试。",
    stage: 5,
    progress: 72,
    tone: "running",
  },
  review: {
    label: "待审核",
    detail: "25 个素材已生成完毕，正在等待质量与合规审核。",
    stage: 5,
    progress: 100,
    tone: "review",
  },
  completed: {
    label: "已完成",
    detail: "审核已通过，素材已入库并可以导出或投放。",
    stage: 5,
    progress: 100,
    tone: "success",
  },
  failed: {
    label: "部分失败",
    detail: "21 / 25 个素材成功，4 个失败项可以单独重试。",
    stage: 5,
    progress: 84,
    tone: "danger",
  },
};

const agentCatalog: AgentSpec[] = [
  {
    key: "requirement",
    name: "需求理解 Agent",
    icon: "需",
    stage: "阶段 1 · 需求确认",
    purpose: "把运营的自然语言诉求转成可验证、可执行的投放需求，不替用户做业务决策。",
    responsibility: "提取投放目标、人群、渠道、素材类型、规格、数量、时限和限制；识别冲突并只追问高影响缺口。",
    boundary: "不选品、不写创意、不创建生成任务；没有依据的字段必须保留 unknown。",
    input: ["用户自然语言与附件", "活动上下文与渠道模板", "租户默认配置", "历史会话中已确认事实"],
    output: ["requirement_patch", "缺失字段 missing_fields", "冲突 conflicts", "确认摘要 confirmation_card"],
    logic: [
      { title: "识别业务目标", detail: "将拉新、转化、种草、促活等表达归一为标准 objective，并保留用户原话。" },
      { title: "抽取投放要素", detail: "识别人群、渠道、区域、预算、规格、数量、时限、素材类型和限制条件。" },
      { title: "补全可信默认值", detail: "仅使用已发布的渠道模板、活动配置与租户默认值，并记录来源。" },
      { title: "校验缺失与冲突", detail: "检查渠道规格、数量上限、截止时间和目标之间是否矛盾。" },
      { title: "最小化追问", detail: "按对结果影响排序，每轮最多询问 3 个阻塞问题，非阻塞信息可标为待定。" },
      { title: "形成确认快照", detail: "输出结构化补丁和可读摘要，用户确认后冻结需求版本。", gate: "用户确认后才能交给选品 Agent" },
    ],
    rules: [
      { label: "必填字段", detail: "objective、audience、channel、media_type、spec、quantity" },
      { label: "事实规则", detail: "推断内容必须标记 inferred；无证据不得写成确定事实" },
      { label: "优先级", detail: "法律/平台规则 > 品牌规则 > 活动要求 > 用户偏好" },
      { label: "修改范围", detail: "只能修改 requirement.*，不能写入商品、创意或审核字段" },
    ],
    exceptions: ["渠道与规格冲突：阻断并给出合法规格", "目标不清晰：给出 2–3 个可选目标，不擅自决定", "信息不足但不阻塞：标记待定并允许继续"],
    metrics: ["字段提取准确率", "必填字段完整率", "平均追问轮数", "用户手改率", "错误推进率"],
    confirmation: "必填字段完整、冲突清零，并由用户明确确认需求摘要。",
    handoff: "把冻结的 requirement_snapshot_id 交给选品 Agent。",
    prohibited: "禁止选择商品、生成文案、承诺效果或直接启动生产。",
  },
  {
    key: "product",
    name: "选品 Agent",
    icon: "品",
    stage: "阶段 2 · 商品确认",
    purpose: "在已确认需求和可售商品范围内筛选、排序候选，解释推荐理由与风险，最终选择权归用户。",
    responsibility: "执行硬过滤、候选召回、适配度评分、业务排序与多样性控制，输出 3–5 个候选商品。",
    boundary: "只推荐候选，不自动锁定商品；不改价格库存、不生成创意、不调用生成模型。",
    input: ["需求快照", "商品/库存/价格/授权知识", "渠道和地域限制", "活动与素材完整度", "素材级历史表现"],
    output: ["ranked_candidates", "推荐理由 reasons", "卖点 evidence", "风险 risks", "selection_patch"],
    logic: [
      { title: "执行硬过滤", detail: "剔除下架、无库存、授权过期、地域不符、渠道禁投、价格带不符和素材信息缺失商品。" },
      { title: "多路候选召回", detail: "按目标、人群、类目、活动、渠道和历史优秀素材并行召回，合并去重。" },
      { title: "计算适配得分", detail: "目标25% + 人群15% + 渠道12% + 库存12% + 活动10% + 资产10% + 历史10% + 新鲜度6%。" },
      { title: "控制候选多样性", detail: "避免候选被单一价格带、同款或同一卖点占满；至少保留一个探索型商品。" },
      { title: "生成可解释推荐", detail: "每个候选输出匹配点、可用卖点、证据来源、潜在风险和不推荐原因。" },
      { title: "等待用户确认", detail: "用户可比较、换一批或指定商品；确认后冻结商品与卖点快照。", gate: "用户确认商品后才能进入图片或视频 Agent" },
    ],
    rules: [
      { label: "硬过滤", detail: "availability、inventory、authorization、region、channel_policy 必须全部通过" },
      { label: "候选数量", detail: "默认展示 3 个，最多 5 个；候选不足时解释原因" },
      { label: "历史数据", detail: "只作排序信号，不把相关性表述为因果结论" },
      { label: "卖点证据", detail: "卖点必须引用有效商品知识版本，禁止模型自行补写功效" },
    ],
    exceptions: ["无可用商品：返回零结果原因和可放宽条件", "库存或授权临期：降权并显著提示", "用户指定商品不合规：保留选择但阻止确认"],
    metrics: ["Top3 采用率", "硬过滤误放率", "推荐理由可信度", "零结果率", "换一批率"],
    confirmation: "商品可售可投、卖点有证据，用户确认 product_id 与 selling_points。",
    handoff: "按素材类型把 product_snapshot_id 交给图片或视频生成 Agent。",
    prohibited: "禁止代替用户最终选品、修改商品资料或为了分数绕过硬过滤。",
  },
  {
    key: "image",
    name: "图片生成 Agent",
    icon: "图",
    stage: "阶段 3–5 · 图片生产",
    purpose: "在确认需求与商品事实内，完成图片创意、文案、构图、单条预览和批量变体生产。",
    responsibility: "内部完成创意结构、文案、版式、提示词编译、模型调用、后处理与版本管理，但不再拆成更多 Agent。",
    boundary: "只处理图片；不能改已确认商品事实和强制品牌规则，预览阶段每次只能生成 1 张。",
    input: ["需求与商品快照", "品牌/渠道/合规知识", "参考图与爆款复刻约束", "用户反馈与锁定字段", "图片模型能力"],
    output: ["image_creative_plan", "prompt_package", "preview_asset", "batch_task", "generation_trace"],
    logic: [
      { title: "生成结构化创意", detail: "确定主题、主副文案、视觉风格、构图、色板、商品占比、Logo 与 CTA 位置。" },
      { title: "执行生成前校验", detail: "检查文案事实、禁用词、授权素材、图片尺寸、安全区与必需品牌元素。" },
      { title: "编译模型输入", detail: "把结构化字段转成正向/负向提示词、参考图权重、种子和模型参数。" },
      { title: "生成单条预览", detail: "只创建 1 个预览任务；保存模型、Prompt、知识和参数快照。" },
      { title: "吸收反馈并版本化", detail: "区分局部修改、保持方案重做和返回创意方案，锁定未修改字段。" },
      { title: "生成批量变体", detail: "围绕文案、构图、背景和种子做受控变体，避免 25 张同质化。" },
      { title: "后处理与送审", detail: "执行尺寸、OCR、Logo、安全区、文件格式和质量检查，然后移交审核 Agent。", gate: "预览由用户确认后才允许批量生成" },
    ],
    rules: [
      { label: "预览数量", detail: "一次严格生成 1 张，重做产生新版本而不是覆盖" },
      { label: "事实保护", detail: "功效、价格、规格、活动信息只能来自确认快照" },
      { label: "变体策略", detail: "强制字段锁定；可变字段按 variant_matrix 组合并去重" },
      { label: "可追溯", detail: "记录模型、Prompt 摘要、种子、知识版本、后处理和成本" },
    ],
    exceptions: ["模型失败：按错误类型限次重试并保留 attempt", "文字乱码：自动进入 OCR 修复或重生", "品牌检查失败：阻止预览确认并定位违规元素"],
    metrics: ["预览一次通过率", "预览确认率", "批量成功率", "平均重做次数", "单张成本", "审核通过率"],
    confirmation: "用户明确确认唯一预览，且生成前规则全部通过。",
    handoff: "把资产、生成谱系和预检结果交给审核 Agent。",
    prohibited: "禁止处理视频、绕过预览门禁、改写商品事实或自动发布素材。",
  },
  {
    key: "video",
    name: "视频生成 Agent",
    icon: "视",
    stage: "阶段 3–5 · 视频生产",
    purpose: "把确认需求转成可控的脚本、分镜和工程合成流程，完成单条预览与批量视频生产。",
    responsibility: "内部完成脚本、分镜、镜头生成、配音、字幕、BGM、数字人和工程合成，不再拆分子 Agent。",
    boundary: "只处理视频；不能把用户锁定镜头自动改写，预览阶段每次只能生成 1 条完整视频。",
    input: ["需求与商品快照", "品牌/渠道/合规知识", "数字人/BGM/字幕模板", "参考视频与锁定镜头", "视频模型和合成能力"],
    output: ["video_creative_plan", "script_and_storyboard", "shot_tasks", "preview_video", "composition_manifest"],
    logic: [
      { title: "规划视频结构", detail: "按时长分配 Hook、场景、卖点、证据、CTA 与免责声明，确保前后逻辑完整。" },
      { title: "生成可编辑分镜", detail: "每镜包含时间、景别、画面、动作、台词、字幕、转场、资产和锁定状态。" },
      { title: "执行生成前校验", detail: "校验总时长、口播字数、字幕安全区、音乐授权、人物授权和渠道格式。" },
      { title: "逐镜生成与重试", detail: "镜头独立排队；失败只重做单镜，已锁定镜头保持不变。" },
      { title: "工程合成预览", detail: "完成配音、字幕、BGM、Logo、CTA、转场和响度控制，只输出 1 条预览。" },
      { title: "反馈与版本冻结", detail: "支持单镜重做、字幕修改、节奏调整和组件替换，形成新版本。" },
      { title: "批量生产与送审", detail: "按受控变体生成完整视频，执行画音质检后移交审核 Agent。", gate: "完整预览确认后才能批量生产" },
    ],
    rules: [
      { label: "时长误差", detail: "成片时长符合渠道模板，镜头时间总和必须一致" },
      { label: "组件授权", detail: "人物、声音、音乐、字体和参考视频均需在授权期内" },
      { label: "锁镜规则", detail: "用户锁定镜头后，任何重算不得修改其画面与台词" },
      { label: "合成标准", detail: "统一字幕安全区、响度、帧率、码率、Logo 和免责声明" },
    ],
    exceptions: ["单镜失败：只重试该镜头，不重跑整条", "口播超时：优先压缩文案并请求确认", "音乐授权过期：阻止合成并推荐可用替代"],
    metrics: ["完整预览成功率", "单镜重试率", "平均合成时长", "音画质检通过率", "每条成本", "审核通过率"],
    confirmation: "用户确认完整预览，所有镜头和组件授权有效。",
    handoff: "把成片、逐镜谱系、授权清单和预检结果交给审核 Agent。",
    prohibited: "禁止处理静态图片任务、解锁用户锁定镜头或自动投放。",
  },
  {
    key: "review",
    name: "审核 Agent",
    icon: "审",
    stage: "生产完成 · 审核建议",
    purpose: "检查素材技术质量、事实一致性、品牌规范、平台政策和内容风险，给人工审核提供可解释建议。",
    responsibility: "汇总机器检测和规则命中，定位问题，给出风险等级、原因码、证据和可执行修改建议。",
    boundary: "默认只输出审核建议；高风险与外部发布场景必须人工最终决定，不能替代法务或平台审核。",
    input: ["素材及全部版本", "需求/商品/创意快照", "OCR/ASR/视觉检测结果", "品牌与平台规则", "授权与生成谱系"],
    output: ["review_recommendation", "risk_level", "findings", "reason_codes", "remediation", "return_node"],
    logic: [
      { title: "技术质量检查", detail: "检查分辨率、比例、大小、清晰度、伪影、黑帧、音画同步、字幕和响度。" },
      { title: "商品事实核对", detail: "将 OCR/ASR 与确认快照逐项比对，识别错价、错规格、夸大功效和遗漏声明。" },
      { title: "品牌规范检查", detail: "检查 Logo、品牌色、字体、语气、商品露出和安全区。" },
      { title: "平台与内容合规", detail: "执行敏感词、人物授权、版权、禁投类目、绝对化表述和渠道政策规则。" },
      { title: "合并发现并定级", detail: "相同问题去重，按 L0 提示、L1 低风险、L2 高风险、L3 禁止发布分级。" },
      { title: "生成审核建议", detail: "输出通过、人工复核、修改或拒绝建议，并指定返回需求、创意或生成节点。" },
      { title: "等待最终决定", detail: "记录审核人决定、备注、规则版本和时间；决定不可被 Agent 静默覆盖。", gate: "高风险、抽检和外部发布必须人工确认" },
    ],
    rules: [
      { label: "建议枚举", detail: "RECOMMEND_PASS / HUMAN_REVIEW_REQUIRED / RECOMMEND_REVISE / RECOMMEND_REJECT" },
      { label: "风险等级", detail: "L3 直接阻断；L2 强制人工；L1 可按策略抽检；L0 仅提示" },
      { label: "证据要求", detail: "每个 finding 必须包含 rule_id、位置、证据、严重度和修复建议" },
      { label: "职责分离", detail: "素材创建者默认不能审核自己的素材，高风险禁止批量通过" },
    ],
    exceptions: ["规则冲突：按法律/平台 > 品牌 > 活动优先并升级人工", "检测结果不确定：不得建议直接通过", "驳回修改：创建新版本并回到指定节点"],
    metrics: ["高风险召回率", "误报率", "人工改判率", "平均审核时长", "原因码完整率", "审核后违规率"],
    confirmation: "按租户策略完成人工决定或低风险自动流转，并保存不可变审核记录。",
    handoff: "通过后释放到素材库；修改则携带原因码返回指定生产节点。",
    prohibited: "禁止隐藏命中规则、代替强制人工审核或自动将素材投放到媒体。",
  },
];

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
      { key: "agents", icon: "◇", label: "Agent 中心" },
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
  agents: {
    eyebrow: "AGENT ORCHESTRATION",
    title: "Agent 中心",
    subtitle: "查看五个 Agent 的职责、规则、交接条件与运行边界。",
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

function StageRail({
  current,
  maxAvailable,
  onSelect,
}: {
  current: number;
  maxAvailable: number;
  onSelect: (stage: number) => void;
}) {
  const stages = [
    ["理解需求", "目标与渠道"],
    ["智能选品", "商品与卖点"],
    ["创意方案", "文案与画面"],
    ["单条预览", "确认生成效果"],
    ["批量生成", "任务与审核"],
  ];
  return (
    <div className="stage-rail" aria-label="生成流程">
      {stages.map(([label, description], index) => {
        const step = index + 1;
        const available = step <= maxAvailable;
        return (
          <button
            type="button"
            key={label}
            className={`${step === current ? "current" : ""} ${
              step < maxAvailable ? "complete" : ""
            } ${available ? "available" : "locked"}`}
            onClick={() => onSelect(step)}
            disabled={!available}
            aria-current={step === current ? "step" : undefined}
            aria-label={`${label}：${available ? "可查看" : "尚未解锁"}`}
          >
            <span>{step < maxAvailable ? "✓" : step}</span>
            <strong>
              <b>{label}</b>
              <small>{description}</small>
            </strong>
            {index < stages.length - 1 && <i />}
          </button>
        );
      })}
    </div>
  );
}

function WorkflowStatusPanel({
  state,
  progress,
  onStateChange,
  onOpen,
}: {
  state: GenerationState;
  progress: number;
  onStateChange: (state: GenerationState) => void;
  onOpen: () => void;
}) {
  const copy = generationStateCopy[state];
  const stateIcon: Record<GenerationState, string> = {
    draft: "✎",
    queued: "◷",
    "preview-generating": "↻",
    "preview-ready": "✓",
    "batch-queued": "◷",
    "batch-generating": "↻",
    review: "⌕",
    completed: "✓",
    failed: "!",
  };
  const demos: Array<{ state: GenerationState; label: string }> = [
    { state: "draft", label: "方案编辑" },
    { state: "queued", label: "排队中" },
    { state: "preview-generating", label: "生成中" },
    { state: "preview-ready", label: "预览完成" },
    { state: "batch-generating", label: "批量生成" },
    { state: "review", label: "待审核" },
    { state: "completed", label: "已完成" },
    { state: "failed", label: "部分失败" },
  ];

  return (
    <div className={`workflow-status status-tone-${copy.tone}`}>
      <div className="workflow-status-main">
        <span className="workflow-status-icon">{stateIcon[state]}</span>
        <div className="workflow-status-copy">
          <div>
            <span className="live-label"><i /> 实时状态</span>
            <b>{copy.label}</b>
            <small>任务 PRE-20260729-0796</small>
          </div>
          <p>{copy.detail}</p>
        </div>
        <div className="workflow-progress">
          <span>
            <b>{progress}%</b>
            <small>{progress < 100 ? "处理中" : "已完成"}</small>
          </span>
          <progress value={progress} max="100" />
        </div>
        <button type="button" className="status-detail-button" onClick={onOpen}>
          {state === "review"
            ? "进入审核"
            : state === "completed"
              ? "查看素材"
              : state === "failed"
                ? "重试失败项"
                : "查看任务"}
          <span>→</span>
        </button>
      </div>
      <div className="state-simulator" aria-label="状态演示切换">
        <span>状态演示</span>
        <div>
          {demos.map((demo) => (
            <button
              type="button"
              key={demo.state}
              className={state === demo.state ? "active" : ""}
              onClick={() => onStateChange(demo.state)}
            >
              {demo.label}
            </button>
          ))}
        </div>
        <small>点击可直接查看各状态</small>
      </div>
    </div>
  );
}

function AgentRuntimeBar({
  mediaType,
  stage,
  state,
  onOpen,
}: {
  mediaType: "image" | "video";
  stage: number;
  state: GenerationState;
  onOpen: () => void;
}) {
  const isReview = state === "review" || state === "completed";
  const activeKey: AgentKey =
    stage <= 1
      ? "requirement"
      : stage === 2
        ? "product"
        : isReview
          ? "review"
          : mediaType;
  const activeAgent = agentCatalog.find((agent) => agent.key === activeKey)!;

  const getStatus = (key: AgentKey) => {
    if ((key === "image" || key === "video") && key !== mediaType) return "skipped";
    if (key === activeKey) return state === "completed" ? "done" : "active";
    if (key === "requirement") return stage > 1 ? "done" : "waiting";
    if (key === "product") return stage > 2 ? "done" : "waiting";
    if (key === mediaType) return isReview ? "done" : "waiting";
    return "waiting";
  };

  const statusCopy = {
    done: "已完成",
    active: "正在执行",
    waiting: "等待接管",
    skipped: "本任务旁路",
  };

  return (
    <div className="agent-runtime-bar">
      <div className="agent-runtime-summary">
        <span>AGENT RUN</span>
        <div>
          <b>当前：{activeAgent.name}</b>
          <small>{state === "completed" ? "审核已完成，素材已释放入库" : activeAgent.handoff}</small>
        </div>
        <button type="button" onClick={onOpen}>查看完整逻辑 →</button>
      </div>
      <div className="agent-runtime-flow" aria-label="五个 Agent 运行状态">
        {agentCatalog.map((agent, index) => {
          const agentStatus = getStatus(agent.key);
          return (
            <div className={`runtime-agent ${agentStatus}`} key={agent.key}>
              <span>{agentStatus === "done" ? "✓" : agent.icon}</span>
              <div><b>{agent.name.replace(" Agent", "")}</b><small>{statusCopy[agentStatus]}</small></div>
              {index < agentCatalog.length - 1 && <i>→</i>}
            </div>
          );
        })}
      </div>
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
  onNavigate,
}: {
  mediaType: "image" | "video";
  notify: (message: string) => void;
  onNavigate: (key: ModuleKey) => void;
}) {
  const isVideo = mediaType === "video";
  const [stage, setStage] = useState(3);
  const [message, setMessage] = useState("");
  const [generationState, setGenerationState] = useState<GenerationState>("draft");
  const [progress, setProgress] = useState(0);
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

  const setDemoState = (nextState: GenerationState, shouldNotify = true) => {
    const next = generationStateCopy[nextState];
    setGenerationState(nextState);
    setProgress(next.progress);
    setStage(next.stage);
    if (shouldNotify) notify(`状态已切换为：${next.label}`);
  };

  const handleStatusAction = () => {
    if (generationState === "failed") {
      setDemoState("batch-queued", false);
      notify("4 个失败项已重新进入队列");
      window.setTimeout(() => setDemoState("batch-generating", false), 700);
      return;
    }
    if (generationState === "review") {
      onNavigate("review");
      return;
    }
    if (generationState === "completed") {
      onNavigate("assets");
      return;
    }
    onNavigate("tasks");
  };

  const primaryAction = () => {
    if (stage < 3) {
      setStage(stage + 1);
      notify("阶段已确认，方案快照已保存");
      return;
    }
    if (stage === 3) {
      setDemoState("queued", false);
      notify("预览任务已创建，仅生成 1 条素材");
      window.setTimeout(() => {
        setGenerationState("preview-generating");
        setProgress(34);
      }, 550);
      window.setTimeout(() => setProgress(72), 1200);
      window.setTimeout(() => {
        setDemoState("preview-ready", false);
        notify("单条预览已完成，可以确认或继续修改");
      }, 2000);
      return;
    }
    if (stage === 4) {
      if (generationState !== "preview-ready") {
        notify("请等待单条预览完成后再提交批量任务");
        return;
      }
      setDemoState("batch-queued", false);
      notify("批量任务 BAT-20260729-0821 已进入队列");
      window.setTimeout(() => {
        setGenerationState("batch-generating");
        setProgress(28);
      }, 650);
      window.setTimeout(() => setProgress(72), 1500);
      window.setTimeout(() => {
        setDemoState("review", false);
        notify("批量生成已完成，25 个素材等待审核");
      }, 2600);
      return;
    }
    handleStatusAction();
  };

  const currentCopy = generationStateCopy[generationState];
  const isBusy = [
    "queued",
    "preview-generating",
    "batch-queued",
    "batch-generating",
  ].includes(generationState);
  const previewBusy = ["queued", "preview-generating"].includes(generationState);
  const stageCopy = [
    "",
    "确认投放目标与约束",
    "确认主推商品与卖点",
    "确认创意方案",
    "确认单条预览",
    "查看批量任务状态",
  ];

  return (
    <section className="studio-page">
      <div className="studio-toolbar">
        <div>
          <button className="ghost-chip">← 草稿</button>
          <span className="draft-name">
            {isVideo ? "早八通勤 30 秒防晒短片" : "夏日通勤防晒 · 轻盈出门"}
          </span>
          <span className="saved-state">✓ 已自动保存</span>
          <span className="switch-hint">提示：点击流程步骤可快速切换</span>
        </div>
        <div>
          <button className="icon-text-button">↗ 分享</button>
          <button className="icon-text-button">•••</button>
        </div>
      </div>
      <StageRail
        current={stage}
        maxAvailable={currentCopy.stage}
        onSelect={(nextStage) => {
          setStage(nextStage);
          notify(`正在查看第 ${nextStage} 步`);
        }}
      />
      <WorkflowStatusPanel
        state={generationState}
        progress={progress}
        onStateChange={setDemoState}
        onOpen={handleStatusAction}
      />
      <AgentRuntimeBar
        mediaType={mediaType}
        stage={stage}
        state={generationState}
        onOpen={() => onNavigate("agents")}
      />
      <div className="studio-grid">
        <div className="agent-panel">
          <div className="agent-panel-head">
            <div>
              <span className="agent-avatar">✦</span>
              <div>
                <b>{agentCatalog.find((agent) => agent.key === (generationState === "review" || generationState === "completed" ? "review" : stage <= 1 ? "requirement" : stage === 2 ? "product" : mediaType))?.name}</b>
                <small><i /> {currentCopy.label} · 受状态机约束</small>
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
                {previewBusy && (
                  <div className="generating-cover">
                    <span className="generation-spinner" />
                    <b>{currentCopy.label}</b>
                    <small>{currentCopy.detail}</small>
                    <progress value={progress} max="100" />
                    <em>{progress}%</em>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="plan-footer">
            <div>
              <span>当前操作</span>
              <b>{stageCopy[stage]}</b>
              <small>{currentCopy.label}</small>
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
            <button className="primary-button" onClick={primaryAction} disabled={isBusy}>
              {stage === 3
                ? "生成 1 条预览"
                : stage === 4
                  ? "确认预览并批量生成"
                  : stage === 5
                    ? generationState === "review"
                      ? "进入审核"
                      : generationState === "completed"
                        ? "查看素材"
                        : generationState === "failed"
                          ? "重试失败项"
                          : "查看任务进度"
                    : "确认并继续"}
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function AgentCenterPage({ notify }: { notify: (message: string) => void }) {
  const [selectedKey, setSelectedKey] = useState<AgentKey>("requirement");
  const selected = agentCatalog.find((agent) => agent.key === selectedKey)!;

  return (
    <section className="content-page agent-center-page">
      <div className="agent-center-hero">
        <div>
          <span className="agent-hero-kicker">FIVE AGENTS · ONE CONTROLLED WORKFLOW</span>
          <h2>五个 Agent，一条可确认、可回退、可追溯的生产链。</h2>
          <p>编排器和状态机属于平台服务，不计入 Agent。图片与视频各由一个生成 Agent 完整负责，审核 Agent 只给出可解释建议。</p>
          <div className="agent-hero-actions">
            <button className="primary-button" onClick={() => notify("已复制五大 Agent 架构摘要")}>复制架构摘要</button>
            <a className="secondary-button" href="https://github.com/yunzhixu620-stack/muse-ai-creative-platform/blob/main/work/AI广告素材生成平台_五大Agent详细设计.md" target="_blank" rel="noreferrer">打开详细文档</a>
          </div>
        </div>
        <div className="agent-hero-metrics">
          <div><b>5</b><span>固定 Agent</span></div>
          <div><b>4</b><span>业务确认门</span></div>
          <div><b>1</b><span>每轮预览</span></div>
          <div><b>0</b><span>自动投放</span></div>
        </div>
      </div>

      <div className="agent-map-card">
        <div className="agent-map-head">
          <div><span>ORCHESTRATION MAP</span><h3>任务交接总览</h3></div>
          <p><i /> 橙色表示当前查看 · 点击任一 Agent 展开完整规则</p>
        </div>
        <div className="agent-map-flow">
          {agentCatalog.map((agent, index) => (
            <div className="agent-map-node-wrap" key={agent.key}>
              <button
                type="button"
                className={`agent-map-node ${selectedKey === agent.key ? "active" : ""}`}
                onClick={() => setSelectedKey(agent.key)}
                aria-pressed={selectedKey === agent.key}
              >
                <span>{agent.icon}</span>
                <div><b>{agent.name}</b><small>{agent.stage}</small></div>
              </button>
              {index < agentCatalog.length - 1 && <i className={index === 1 ? "agent-branch-arrow" : ""}>→</i>}
            </div>
          ))}
        </div>
        <div className="agent-map-note">
          <span>状态机服务</span>
          <p>负责门禁、快照、重试、回退和事件记录；只调度 Agent，不拥有创意决策。</p>
          <span>工具与模型服务</span>
          <p>知识检索、Prompt 编译、模型路由、OCR/ASR 和合成均是内部能力，不新增 Agent。</p>
        </div>
      </div>

      <div className="agent-detail-layout">
        <aside className="agent-detail-nav" aria-label="Agent 列表">
          <span>选择 Agent</span>
          {agentCatalog.map((agent, index) => (
            <button
              type="button"
              className={selectedKey === agent.key ? "active" : ""}
              onClick={() => setSelectedKey(agent.key)}
              key={agent.key}
            >
              <i>{index + 1}</i>
              <span>{agent.name}<small>{agent.stage}</small></span>
              <b>›</b>
            </button>
          ))}
          <div className="agent-nav-principle">
            <b>统一原则</b>
            <p>规则优先于模型；用户确认优先于自动推进；所有修改以 JSON Patch 留痕。</p>
          </div>
        </aside>

        <article className="agent-detail-card">
          <header className="agent-detail-head">
            <div className={`agent-large-icon agent-${selected.key}`}>{selected.icon}</div>
            <div>
              <span>{selected.stage}</span>
              <h2>{selected.name}</h2>
              <p>{selected.purpose}</p>
            </div>
            <span className="agent-version-badge"><i /> 已启用 · V1.0</span>
          </header>

          <div className="agent-scope-grid">
            <div><span>核心职责</span><p>{selected.responsibility}</p></div>
            <div><span>业务边界</span><p>{selected.boundary}</p></div>
            <div><span>交接条件</span><p>{selected.confirmation}</p></div>
            <div className="danger-scope"><span>明确禁止</span><p>{selected.prohibited}</p></div>
          </div>

          <div className="agent-io-grid">
            <div>
              <div className="agent-block-title"><span>INPUT</span><h3>输入上下文</h3></div>
              <ul>{selected.input.map((item) => <li key={item}><i>↘</i>{item}</li>)}</ul>
            </div>
            <div>
              <div className="agent-block-title"><span>OUTPUT</span><h3>结构化输出</h3></div>
              <ul>{selected.output.map((item) => <li key={item}><i>↗</i>{item}</li>)}</ul>
            </div>
          </div>

          <section className="agent-logic-section">
            <div className="agent-section-heading">
              <div><span>EXECUTION LOGIC</span><h3>执行逻辑与门禁</h3></div>
              <small>从上到下顺序执行 · 任一硬规则失败即停止推进</small>
            </div>
            <div className="agent-logic-timeline">
              {selected.logic.map((step, index) => (
                <div className="agent-logic-step" key={step.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div><b>{step.title}</b><p>{step.detail}</p>{step.gate && <em>确认门：{step.gate}</em>}</div>
                </div>
              ))}
            </div>
          </section>

          <div className="agent-rules-grid">
            <section>
              <div className="agent-section-heading compact"><div><span>HARD RULES</span><h3>关键规则</h3></div></div>
              <div className="rule-list">
                {selected.rules.map((rule) => <div key={rule.label}><b>{rule.label}</b><p>{rule.detail}</p></div>)}
              </div>
            </section>
            <section>
              <div className="agent-section-heading compact"><div><span>EXCEPTIONS</span><h3>异常处理</h3></div></div>
              <ul className="exception-list">{selected.exceptions.map((item) => <li key={item}><span>!</span>{item}</li>)}</ul>
            </section>
          </div>

          <div className="agent-evaluation-strip">
            <div><span>NEXT HANDOFF</span><p>{selected.handoff}</p></div>
            <div><span>EVALUATION</span><p>{selected.metrics.join(" · ")}</p></div>
          </div>
        </article>
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
        return (
          <GenerationWorkspace
            mediaType="image"
            notify={notify}
            onNavigate={setActive}
          />
        );
      case "video":
        return (
          <GenerationWorkspace
            mediaType="video"
            notify={notify}
            onNavigate={setActive}
          />
        );
      case "agents":
        return <AgentCenterPage notify={notify} />;
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
