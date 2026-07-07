(function () {
  "use strict";

  window.DEMO_SCENARIO = {
    createInitialState: function () {
      return {
        route: "agent",
        requirement: {
          id: "req-summer-001",
          version: 1,
          status: "草稿",
          text: window.DEMO_DATA.meta.originalIntent,
          questionIndex: 0,
          answers: {},
          timeline: [{ at: "10:00", actor: "运营", text: "创建需求草稿" }]
        },
        object: {
          id: "object-summer-001",
          status: "待确认",
          productOrder: ["sku-001", "sku-002", "sku-003", "sku-004", "sku-005", "sku-006"],
          landingId: "landing-summer",
          timeline: []
        },
        creative: {
          id: "creative-summer-001",
          status: "待确认",
          directionId: "direction-scene",
          focus: "清凉通勤",
          storyboardVersion: 1,
          previousVersions: [],
          sceneCopies: {},
          previewConfirmed: false,
          previewFrame: 0,
          rework: null,
          timeline: []
        },
        task: {
          id: "task-summer-001",
          status: "待创建",
          count: 10,
          priority: "高",
          deadline: window.DEMO_DATA.meta.deadline,
          timeline: []
        },
        production: [],
        audits: [],
        materials: [],
        campaign: {
          id: "campaign-summer-001",
          status: "待投放",
          selectedMaterialIds: [],
          metricsVisible: false,
          timeline: []
        },
        analysis: {
          decision: "",
          conclusion: "",
          knowledgeStatus: "待复盘",
          confirmed: false
        },
        activityLog: [],
        ui: { drawerOpen: false }
      };
    },
    queuePaths: {
      "待排队": [],
      "排队中": ["QUEUE"],
      "生成中": ["QUEUE", "GENERATE"],
      "合成中": ["QUEUE", "GENERATE", "COMPOSE"],
      "质检中": ["QUEUE", "GENERATE", "COMPOSE", "QUALITY"],
      "待审核": ["QUEUE", "GENERATE", "COMPOSE", "QUALITY", "SUBMIT_AUDIT"]
    }
  };
})();
