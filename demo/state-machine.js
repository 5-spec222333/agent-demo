(function () {
  "use strict";

  const clone = function (value) { return JSON.parse(JSON.stringify(value)); };
  let state = window.DEMO_SCENARIO.createInitialState();

  const rules = {
    requirement: {
      草稿: { SUBMIT: "解析中" },
      解析中: { NEED_INPUT: "待补充" },
      待补充: { ANSWER: "待补充", READY: "待确认" },
      待确认: { CONFIRM: "已确认" },
      已确认: { TASK_CREATED: "已创建任务" }
    },
    object: { 待确认: { REORDER: "待确认", SELECT_LANDING: "待确认", CONFIRM: "已确认" } },
    creative: {
      待确认: { SELECT_DIRECTION: "待确认", UPDATE_SCENE: "待确认", CONFIRM_PREVIEW: "已确认" },
      已确认: { START_REWORK: "待确认" }
    },
    task: { 待创建: { CREATE: "已创建" } },
    production: {
      待排队: { QUEUE: "排队中" },
      排队中: { GENERATE: "生成中" },
      生成中: { COMPOSE: "合成中" },
      合成中: { QUALITY: "质检中" },
      质检中: { SUBMIT_AUDIT: "待审核" }
    },
    exception: {
      无: { PARTIAL_FAIL: "部分失败" },
      部分失败: { AUTO_RETRY: "自动重试" },
      自动重试: { TECHNICAL: "技术处理", RESOLVE: "已恢复" },
      技术处理: { DEGRADE: "降级", RESOLVE: "已恢复" },
      降级: { RESOLVE: "已恢复" }
    },
    audit: {
      待审核: { START: "审核中" },
      审核中: { PASS: "通过", REJECT: "驳回", MANUAL: "待人工复核" },
      驳回: { RESUBMIT: "待审核" },
      待人工复核: { START: "审核中" }
    },
    material: {
      待入库: { LIBRARY: "已入库" },
      已入库: { PLAN: "待投放", REUSE: "可复用", ARCHIVE: "已归档" },
      待投放: { ENABLE: "投放中" },
      投放中: { STOP: "已下线", REUSE: "可复用" },
      已下线: { REUSE: "可复用", ARCHIVE: "已归档", ENABLE: "投放中" },
      可复用: { ARCHIVE: "已归档" }
    },
    campaign: {
      待投放: { ENABLE: "投放中" },
      投放中: { STOP: "已下线" },
      已下线: { ENABLE: "投放中" }
    }
  };

  function nowLabel() {
    const total = 10 * 60 + state.activityLog.length * 2;
    return String(Math.floor(total / 60)).padStart(2, "0") + ":" + String(total % 60).padStart(2, "0");
  }

  function record(domain, entity, event, from, to, note, actor) {
    const item = { at: nowLabel(), domain, event, from, to, actor: actor || "系统", text: note || (from + " → " + to) };
    if (!entity.timeline) entity.timeline = [];
    entity.timeline.push(item);
    state.activityLog.push(item);
  }

  function findEntity(domain, id) {
    if (["requirement", "object", "creative", "task", "campaign"].includes(domain)) return state[domain];
    if (domain === "production" || domain === "exception") return state.production.find(function (item) { return item.id === id; });
    if (domain === "audit") return state.audits.find(function (item) { return item.id === id; });
    if (domain === "material") return state.materials.find(function (item) { return item.id === id; });
    return null;
  }

  function currentStatus(domain, entity) {
    return domain === "exception" ? (entity.exceptionStatus || "无") : entity.status;
  }

  function setStatus(domain, entity, value) {
    if (domain === "exception") entity.exceptionStatus = value;
    else entity.status = value;
  }

  function can(action) {
    const checks = {
      confirmRequirement: state.requirement.status === "待确认",
      confirmObject: state.requirement.status === "已确认" && state.object.productOrder.length === 6 && !!state.object.landingId,
      enterCreative: state.object.status === "已确认",
      createTask: state.requirement.status === "已确认" && state.object.status === "已确认" && state.creative.previewConfirmed,
      audit: state.task.status === "已创建",
      delivery: state.materials.filter(function (item) { return item.status === "已入库" || item.status === "待投放" || item.status === "投放中" || item.status === "已下线" || item.status === "可复用"; }).length >= 2,
      analyze: state.campaign.metricsVisible
    };
    return !!checks[action];
  }

  function assertAllowed(domain, entity, event) {
    if (!entity) throw new Error("未找到状态实体：" + domain);
    const from = currentStatus(domain, entity);
    const to = rules[domain] && rules[domain][from] && rules[domain][from][event];
    if (!to) throw new Error("不允许的状态转换：" + domain + " / " + from + " / " + event);
    return { from, to };
  }

  function buildProduction() {
    state.production = window.DEMO_DATA.productionTemplates.map(function (template) {
      return {
        id: template.id,
        name: template.name,
        productId: template.productId,
        status: "待排队",
        exceptionStatus: "无",
        outcome: template.outcome,
        progress: template.progress,
        note: template.note,
        timeline: [{ at: nowLabel(), actor: "系统", text: "拆分为独立镜头与组件子任务" }]
      };
    });
    state.production.forEach(function (item) {
      const template = window.DEMO_DATA.productionTemplates.find(function (row) { return row.id === item.id; });
      (window.DEMO_SCENARIO.queuePaths[template.final] || []).forEach(function (event) {
        transition("production", item.id, event, { silent: true });
      });
      if (template.exception === "部分失败") transition("exception", item.id, "PARTIAL_FAIL", { note: template.note, silent: true });
      if (template.exception === "自动重试") {
        transition("exception", item.id, "PARTIAL_FAIL", { note: "镜头 3 生成失败", silent: true });
        transition("exception", item.id, "AUTO_RETRY", { note: template.note, silent: true });
      }
      if (template.exception === "降级") {
        transition("exception", item.id, "PARTIAL_FAIL", { note: "数字人组件校验失败", silent: true });
        transition("exception", item.id, "AUTO_RETRY", { note: "自动重试仍未通过唇形校验", silent: true });
        transition("exception", item.id, "TECHNICAL", { note: "系统进入技术处理", silent: true });
        transition("exception", item.id, "DEGRADE", { note: template.note, silent: true });
      }
    });
    state.audits = clone(window.DEMO_DATA.auditTemplates).map(function (item) {
      item.timeline = [{ at: nowLabel(), actor: "系统", text: "生产质检通过，进入审核队列" }];
      item.history = [];
      return item;
    });
  }

  function createMaterial(audit) {
    const existing = state.materials.find(function (item) { return item.auditKey === audit.id; });
    if (existing) return existing;
    const material = {
      id: "material-" + audit.id.split("-")[1],
      auditKey: audit.id,
      name: audit.name,
      version: audit.version,
      parentVersion: audit.version > 1 ? 1 : null,
      status: "待入库",
      trace: clone(window.DEMO_DATA.traceTemplates[audit.id]),
      timeline: [{ at: nowLabel(), actor: "系统", text: "审核通过，创建待入库素材" }]
    };
    material.trace.audit = audit.version > 1 ? "v1 驳回记录 + v2 复审通过" : "v1 审核通过";
    material.trace.material = "素材 v" + audit.version + " · 已入库";
    if (audit.version > 1) {
      material.trace.creative = "利益点直给 · 创意方案 v2（由 v1 返工）";
      material.trace.storyboard = "六镜分镜 v2 · 仅修改镜头 4 与尾帧组件";
      material.trace.compose = "1080×1920 / 25fps / Logo 安全区 8% / 局部重合成";
    }
    state.materials.push(material);
    transition("material", material.id, "LIBRARY", { note: "系统自动完成元数据校验并入库", silent: true });
    return material;
  }

  function transition(domain, id, event, payload) {
    payload = payload || {};
    const entity = findEntity(domain, id);
    const move = assertAllowed(domain, entity, event);

    if (domain === "requirement" && event === "SUBMIT") entity.text = payload.text || entity.text;
    if (domain === "requirement" && event === "ANSWER") {
      entity.answers[payload.questionId] = payload.value;
      if (payload.extra) Object.assign(entity.answers, payload.extra);
      entity.questionIndex += 1;
    }
    if (domain === "object" && event === "REORDER") entity.productOrder = payload.order.slice();
    if (domain === "object" && event === "SELECT_LANDING") entity.landingId = payload.landingId;
    if (domain === "creative" && event === "SELECT_DIRECTION") {
      entity.directionId = payload.directionId;
      entity.focus = payload.focus || entity.focus;
    }
    if (domain === "creative" && event === "UPDATE_SCENE") entity.sceneCopies[payload.sceneId] = payload.copy;
    if (domain === "creative" && event === "CONFIRM_PREVIEW") entity.previewConfirmed = true;
    if (domain === "task" && event === "CREATE") {
      entity.priority = payload.priority || entity.priority;
      entity.deadline = payload.deadline || entity.deadline;
    }
    if (domain === "creative" && event === "START_REWORK") {
      entity.previousVersions.push({ version: entity.storyboardVersion, sceneCopies: clone(entity.sceneCopies), reason: payload.reason });
      entity.storyboardVersion += 1;
      entity.previewConfirmed = false;
      entity.rework = { auditId: payload.auditId, target: payload.target, reason: payload.reason };
    }
    if (domain === "audit" && event === "REJECT") {
      entity.reasonType = payload.reasonType;
      entity.location = payload.location;
      entity.comment = payload.comment;
      entity.history.push({ version: entity.version, status: "驳回", reasonType: payload.reasonType, location: payload.location, comment: payload.comment });
    }
    if (domain === "audit" && event === "RESUBMIT") {
      entity.version += 1;
      entity.canPass = true;
      entity.risk = "已替换镜头 4 文案并修正尾帧 Logo 安全区";
      state.creative.rework = null;
    }

    setStatus(domain, entity, move.to);
    record(domain, entity, event, move.from, move.to, payload.note, payload.actor);

    if (domain === "task" && event === "CREATE") {
      buildProduction();
      if (state.requirement.status === "已确认") transition("requirement", state.requirement.id, "TASK_CREATED", { note: "预览版本已冻结并关联批量任务", silent: true });
    }
    if (domain === "audit" && event === "PASS") createMaterial(entity);
    if (domain === "material" && event === "PLAN") {
      if (!state.campaign.selectedMaterialIds.includes(entity.id)) state.campaign.selectedMaterialIds.push(entity.id);
    }
    if (domain === "campaign" && event === "ENABLE") {
      state.campaign.metricsVisible = true;
      state.materials.forEach(function (material) {
        if (material.status === "已入库") transition("material", material.id, "PLAN", { note: "关联到模拟投放计划", silent: true });
        if (material.status === "待投放") transition("material", material.id, "ENABLE", { note: "模拟投放已启用", silent: true });
        material.trace.delivery = "模拟投放中；已关联曝光、点击与转化记录";
      });
    }
    if (domain === "campaign" && event === "STOP") {
      state.materials.forEach(function (material) {
        if (material.status === "投放中") transition("material", material.id, "STOP", { note: "模拟投放已停止", silent: true });
        material.trace.delivery = "模拟投放已下线；保留曝光、点击与转化记录";
      });
    }
    return move.to;
  }

  function setRoute(route) { state.route = route; }
  function setAnalysis(payload) {
    if (payload.decision !== undefined) state.analysis.decision = payload.decision;
    if (payload.conclusion !== undefined) state.analysis.conclusion = payload.conclusion;
    if (payload.confirmed) {
      if (!state.analysis.decision || !state.analysis.conclusion.trim()) throw new Error("请先完成效果判断和复盘结论");
      state.analysis.confirmed = true;
      state.analysis.knowledgeStatus = state.analysis.decision === "reuse" ? "可复用" : "观察中";
      state.materials.forEach(function (material) {
        if (state.analysis.decision === "reuse" && ["投放中", "已下线", "已入库"].includes(material.status)) {
          if (material.status === "已入库") transition("material", material.id, "REUSE", { note: "人工确认可复用", actor: "运营", silent: true });
          else if (material.status === "投放中") transition("material", material.id, "REUSE", { note: "人工确认可复用", actor: "运营", silent: true });
          else if (material.status === "已下线") transition("material", material.id, "REUSE", { note: "人工确认可复用", actor: "运营", silent: true });
        }
      });
      state.activityLog.push({ at: nowLabel(), domain: "knowledge", actor: "运营", text: "确认复盘结论并沉淀为" + state.analysis.knowledgeStatus + "经验" });
    }
  }

  window.DEMO_ENGINE = {
    getState: function () { return state; },
    getRules: function () { return rules; },
    transition,
    can,
    setRoute,
    setAnalysis,
    reset: function () { state = window.DEMO_SCENARIO.createInitialState(); return state; },
    clone: clone
  };
})();
