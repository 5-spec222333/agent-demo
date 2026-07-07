(function () {
  "use strict";

  window.PRODUCT_FRAMEWORK = {
    flow: [
      { id: "intent", label: "运营意图" },
      { id: "understand", label: "Agent 理解与确认" },
      { id: "product", label: "选品与承接确认" },
      { id: "creative", label: "创意与方案确认" },
      { id: "task", label: "创建任务与排队" },
      { id: "produce", label: "AI 生成与合成" },
      { id: "audit", label: "审核与素材入库" },
      { id: "feedback", label: "投放与数据闭环" }
    ],

    application: [
      {
        stageId: "intent",
        title: "需求入口",
        cards: [
          { label: "Agent 对话入口", wide: true, tall: true },
          { label: "API／子 Agent 入口", wide: true, tall: true }
        ]
      },
      {
        stageId: "understand",
        title: "需求理解",
        cards: [
          { label: "意图解析" },
          { label: "歧义识别" },
          { label: "缺失信息追问" },
          { label: "需求确认" },
          { label: "结构化需求 Schema", wide: true, accent: true }
        ]
      },
      {
        stageId: "product",
        title: "选品与承接",
        cards: [
          { label: "商品 List" },
          { label: "选品推荐" },
          { label: "承接页／渠道" },
          { label: "确认闸门" }
        ]
      },
      {
        stageId: "creative",
        title: "创意与方案",
        cards: [
          { label: "创意方向" },
          { label: "图片方案" },
          { label: "视频分镜" },
          { label: "预览确认" },
          { label: "创意结构配置", wide: true, accent: true }
        ]
      },
      {
        stageId: "task",
        title: "任务执行",
        cards: [
          { label: "创建生产任务", wide: true },
          { label: "生产队列", wide: true },
          { label: "状态／异常处理", wide: true }
        ]
      },
      {
        stageId: "produce",
        title: "生产与质检",
        cards: [
          { label: "图片素材生成", wide: true },
          { label: "视频组件生成", wide: true },
          { label: "工程合成" },
          { label: "机器质检" }
        ]
      },
      {
        stageId: "audit",
        title: "审核与资产",
        cards: [
          { label: "审核队列", wide: true },
          { label: "通过／驳回／复核", wide: true },
          { label: "素材入库与版本", wide: true }
        ]
      },
      {
        stageId: "feedback",
        title: "投放与分析",
        cards: [
          { label: "投放／导出" },
          { label: "数据回流" },
          { label: "效果分析" },
          { label: "策略沉淀" }
        ]
      }
    ],

    access: ["账号／角色／权限", "API 接入管理"],

    capabilities: [
      {
        title: "资产与知识",
        columns: 3,
        items: ["商品库", "品牌资产库", "渠道规则库", "创意知识库", "BGM／音色库", "数字人库"]
      },
      {
        title: "Agent 与生产",
        columns: 3,
        items: ["Agent 理解与追问", "策略与创意引擎", "Schema 配置中心", "Prompt 中心", "工作流与状态机", "任务调度与重试"]
      },
      {
        title: "模型与工程",
        columns: 3,
        items: ["LLM", "图片模型", "视频模型", "TTS／数字人", "OCR／视觉检测", "媒体合成引擎"]
      },
      {
        title: "数据与存储",
        columns: 3,
        items: ["关系数据库", "对象存储", "向量数据库", "日志与监控", "投放数据关联", "成本与额度"]
      }
    ],

    governance: {
      title: "全链路治理",
      items: ["状态管理", "版本与审计", "全链路追溯"]
    }
  };
})();
