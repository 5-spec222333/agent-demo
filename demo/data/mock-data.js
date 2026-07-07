(function () {
  "use strict";

  window.DEMO_DATA = {
    meta: {
      title: "夏季女装拉新视频",
      originalIntent: "从夏季女装中选择合适商品，生成 10 条竖屏促销视频，用于拉新，并将用户承接到活动频道。",
      disclaimer: "本页面全部商品、品牌、渠道、模型与投放数据均为虚构 Mock 数据。",
      deadline: "2026-07-05 18:00"
    },
    navigation: [
      { id: "agent", label: "Agent 工作台", short: "意图" },
      { id: "requirement", label: "需求确认", short: "需求" },
      { id: "products", label: "商品选择", short: "选品" },
      { id: "creative", label: "创意与视频分镜", short: "创意" },
      { id: "production", label: "批量任务与生产队列", short: "生产" },
      { id: "audit", label: "审核与返工", short: "审核" },
      { id: "library", label: "素材库", short: "入库" },
      { id: "results", label: "投放结果与效果观察", short: "投放" },
      { id: "trace", label: "资产和追溯详情", short: "追溯" }
    ],
    questions: [
      {
        id: "q-difference",
        title: "先确认 10 条视频如何形成差异",
        help: "这会直接影响创意结构、商品配额和生产成本。",
        options: [
          { value: "diverse", label: "3 类创意方向，形成 10 个差异化版本", recommended: true },
          { value: "template", label: "同一模板替换商品，批量生成 10 条" }
        ]
      },
      {
        id: "q-audience",
        title: "本轮优先拉新哪类人群？",
        help: "人群动机会影响开场钩子和利益点顺序。",
        options: [
          { value: "new-25-35", label: "25–35 岁、关注通勤与轻薄穿搭的新客", recommended: true },
          { value: "student", label: "18–24 岁、关注高性价比的学生新客" },
          { value: "broad", label: "暂不细分，使用宽泛女装新客" }
        ]
      },
      {
        id: "q-channel",
        title: "视频将用于什么渠道和商品范围？",
        help: "渠道决定 9:16 规格和时长，商品范围决定选品池。",
        compound: true,
        channelOptions: [
          { value: "feed", label: "通用短视频信息流（9:16，15 秒）" },
          { value: "channel", label: "活动频道焦点位（9:16，12 秒）" }
        ],
        scopeOptions: [
          { value: "summer-all", label: "夏季女装可售池，优先活动匹配商品" },
          { value: "dress-only", label: "仅连衣裙类目" }
        ]
      }
    ],
    requirementFields: [
      ["业务目标", "拉新并引导进入夏装活动页"],
      ["目标人群", "25–35 岁、关注通勤与轻薄穿搭的女装新客"],
      ["渠道规格", "通用短视频信息流 · 9:16 · 15 秒"],
      ["商品范围", "夏季女装可售池，优先活动匹配商品"],
      ["生产数量", "10 条差异化视频"],
      ["差异策略", "场景种草 4 条 / 利益点直给 3 条 / 搭配对比 3 条"],
      ["承接对象", "待确认：虚构夏装活动页"],
      ["首期边界", "仅记录比较与观察，不做自动归因" ]
    ],
    products: [
      { id: "sku-001", name: "轻氧防晒衬衫", category: "衬衫", price: 159, stock: 2680, match: 96, role: "selected", reason: "防晒与通勤场景都清晰，库存充足，活动价在主力价格带。", tone: "mint" },
      { id: "sku-002", name: "微风碎花连衣裙", category: "连衣裙", price: 219, stock: 1840, match: 93, role: "selected", reason: "度假场景辨识度高，可承担场景种草主视觉。", tone: "rose" },
      { id: "sku-003", name: "凉感高腰阔腿裤", category: "裤装", price: 139, stock: 3210, match: 91, role: "selected", reason: "凉感卖点明确，适合通勤搭配和多款对比。", tone: "blue" },
      { id: "sku-004", name: "云朵针织短袖", category: "针织", price: 99, stock: 4120, match: 89, role: "selected", reason: "入门价格友好，库存稳定，适合拉新利益点表达。", tone: "sand" },
      { id: "sku-005", name: "轻盈 A 字半裙", category: "半裙", price: 129, stock: 2050, match: 87, role: "selected", reason: "可与衬衫、针织组合，增强成套导购表达。", tone: "lilac" },
      { id: "sku-006", name: "冰丝叠穿套装", category: "套装", price: 259, stock: 1260, match: 84, role: "selected", reason: "客单价较高但套装完整，适合价值感与搭配效率表达。", tone: "teal" },
      { id: "sku-007", name: "柔雾亚麻西装", category: "外套", price: 299, stock: 780, match: 76, role: "backup", reason: "风格契合通勤，但库存低于主推安全线，作为候补。", tone: "stone" },
      { id: "sku-008", name: "海盐蓝吊带裙", category: "连衣裙", price: 189, stock: 920, match: 74, role: "backup", reason: "画面表现力好，但受众偏度假场景，作为候补。", tone: "sky" },
      { id: "sku-009", name: "厚织复古开衫", category: "针织", price: 169, stock: 3500, match: 38, role: "excluded", reason: "材质与夏季轻薄主题不一致，排除本轮活动。", tone: "brown" },
      { id: "sku-010", name: "限定丝质礼服", category: "礼服", price: 899, stock: 86, match: 29, role: "excluded", reason: "库存与价格带均不适合规模化拉新，排除。", tone: "navy" }
    ],
    landings: [
      { id: "landing-summer", title: "清凉一夏 · 女装活动页", type: "活动页", status: "已校验", summary: "聚合本轮 6 个主推商品，利益点与视频 CTA 一致。", recommended: true },
      { id: "landing-product", title: "首个主推商品详情页", type: "商品页", status: "可用", summary: "路径短，但无法承接多商品搭配内容。" },
      { id: "landing-shop", title: "夏装店铺集合页", type: "店铺页", status: "待复核", summary: "商品范围更宽，活动利益点不够集中。" }
    ],
    creativeDirections: [
      { id: "direction-scene", name: "场景种草", quota: 4, tagline: "先让用户代入，再展示商品", fit: "通勤、周末出游", accent: "01" },
      { id: "direction-benefit", name: "利益点直给", quota: 3, tagline: "前三秒给出清凉与活动利益", fit: "快速拉新、价格敏感", accent: "02" },
      { id: "direction-compare", name: "搭配对比", quota: 3, tagline: "用三套搭配展示选择空间", fit: "导购、多商品承接", accent: "03" }
    ],
    storyboards: [
      { id: "shot-01", order: 1, time: "0–2s", title: "开场钩子", visual: "通勤闷热场景切入，人物拉开窗帘", copy: "盛夏通勤，穿得轻一点", components: ["数字人", "字幕", "环境音"] },
      { id: "shot-02", order: 2, time: "2–5s", title: "主推商品", visual: "防晒衬衫面料与上身效果近景", copy: "轻薄防晒，早八也能从容出门", components: ["视频片段", "TTS", "商品贴片"] },
      { id: "shot-03", order: 3, time: "5–8s", title: "搭配扩展", visual: "阔腿裤、半裙与针织短袖三套快切", copy: "通勤、约会，一套思路配三种风格", components: ["视频片段", "字幕", "转场"] },
      { id: "shot-04", order: 4, time: "8–11s", title: "活动利益", visual: "活动卡片与商品列表叠加", copy: "全网最低价，夏装闭眼入", components: ["活动贴片", "TTS", "Logo"] },
      { id: "shot-05", order: 5, time: "11–13s", title: "信任补充", visual: "库存、价格带和活动匹配提示", copy: "多款可选，按你的夏日场景慢慢挑", components: ["字幕", "BGM", "商品贴片"] },
      { id: "shot-06", order: 6, time: "13–15s", title: "行动引导", visual: "虚构活动页缩略预览与 CTA", copy: "点击进入清凉一夏活动页", components: ["CTA", "Logo", "尾帧"] }
    ],
    productionTemplates: [
      { id: "job-001", name: "场景种草 · 防晒通勤", productId: "sku-001", final: "待审核", outcome: "成功", progress: 100, note: "6 个镜头与全部组件已通过质检" },
      { id: "job-002", name: "场景种草 · 碎花度假", productId: "sku-002", final: "待审核", outcome: "成功", progress: 100, note: "已进入审核队列" },
      { id: "job-003", name: "场景种草 · 凉感通勤", productId: "sku-003", final: "质检中", outcome: "处理中", progress: 86, note: "系统正在检查字幕安全区与时长" },
      { id: "job-004", name: "场景种草 · 套装效率", productId: "sku-006", final: "合成中", outcome: "处理中", progress: 72, note: "镜头片段齐套，正在工程合成" },
      { id: "job-005", name: "利益直给 · 针织短袖", productId: "sku-004", final: "生成中", outcome: "自动重试", progress: 52, exception: "自动重试", note: "镜头 3 人物手部异常，仅重试镜头 3" },
      { id: "job-006", name: "利益直给 · 防晒衬衫", productId: "sku-001", final: "生成中", outcome: "部分失败", progress: 48, exception: "部分失败", note: "镜头 4 活动贴片渲染失败，其他 5 镜已保留" },
      { id: "job-007", name: "利益直给 · 高腰阔腿裤", productId: "sku-003", final: "合成中", outcome: "技术降级", progress: 68, exception: "降级", note: "数字人唇形校验超限，已降级为 TTS + 纯字幕并返回合成" },
      { id: "job-008", name: "搭配对比 · 三套通勤", productId: "sku-005", final: "生成中", outcome: "处理中", progress: 43, note: "正在生成镜头 4–6" },
      { id: "job-009", name: "搭配对比 · 轻薄组合", productId: "sku-004", final: "排队中", outcome: "排队中", progress: 18, note: "依赖商品贴片生成完成" },
      { id: "job-010", name: "搭配对比 · 度假组合", productId: "sku-002", final: "待排队", outcome: "待排队", progress: 0, note: "等待前序高优先级作业释放资源" }
    ],
    auditTemplates: [
      { id: "audit-001", jobId: "job-001", name: "防晒通勤 · 场景种草", version: 1, status: "待审核", risk: "未发现预检风险", canPass: true },
      { id: "audit-002", jobId: "job-002", name: "碎花度假 · 利益直给", version: 1, status: "待审核", risk: "镜头 4 含未经证明的绝对价格表述；尾帧 Logo 安全距离不足", canPass: false }
    ],
    traceTemplates: {
      "audit-001": {
        requirement: "夏季女装拉新视频 · 已确认需求 v2",
        products: "轻氧防晒衬衫 / 凉感高腰阔腿裤 / 轻盈 A 字半裙",
        landing: "清凉一夏 · 女装活动页",
        creative: "场景种草 · 创意方案 v1",
        prompt: "通勤清晨、自然光、轻薄夏装、真实商品材质；保留商品版型",
        model: "视频片段模型 A v3.2 / TTS 语音模型 B v2.1",
        storyboard: "六镜分镜 v1 · 15 秒 · 9:16",
        compose: "1080×1920 / 25fps / 字幕安全区 8% / BGM -18LUFS",
        audit: "待形成审核记录",
        material: "待入库",
        delivery: "待投放"
      },
      "audit-002": {
        requirement: "夏季女装拉新视频 · 已确认需求 v2",
        products: "微风碎花连衣裙 / 冰丝叠穿套装",
        landing: "清凉一夏 · 女装活动页",
        creative: "利益点直给 · 创意方案 v1",
        prompt: "夏日度假街景、柔和自然光、真实面料纹理；活动信息使用结构化贴片",
        model: "视频片段模型 A v3.2 / 数字人引擎 C v1.4",
        storyboard: "六镜分镜 v1 · 15 秒 · 9:16",
        compose: "1080×1920 / 25fps / Logo 安全区 6% / BGM -18LUFS",
        audit: "待形成审核记录",
        material: "待入库",
        delivery: "待投放"
      }
    },
    metrics: [
      { materialKey: "audit-001", label: "场景种草 · 防晒通勤", impressions: 120000, clicks: 3360, conversions: 168 },
      { materialKey: "audit-002", label: "返工版 · 碎花度假", impressions: 86000, clicks: 2064, conversions: 82 }
    ],
    assets: [
      { type: "商品库", name: "夏季女装可售商品池", detail: "10 个演示商品；库存、价格与活动匹配度均为 Mock。", status: "可用" },
      { type: "品牌资产库", name: "清凉一夏视觉规范", detail: "包含 Logo、安全区、字体、色彩与禁用表达。", status: "可用" },
      { type: "频道规则库", name: "通用短视频信息流规则", detail: "9:16、15 秒、字幕安全区与广告文案约束。", status: "生效" },
      { type: "创意知识库", name: "夏季女装拉新观察", detail: "历史观察仅作为创意参考，不声明因果。", status: "观察中" }
    ]
  };
})();
