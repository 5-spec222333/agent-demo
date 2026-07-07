(function () {
  "use strict";

  const data = window.DEMO_DATA;
  const engine = window.DEMO_ENGINE;
  const ui = window.DEMO_UI;
  const workspace = document.getElementById("workspace");
  let draggedProductId = null;
  let previewTimer = null;
  let previewFrame = 0;

  function state() { return engine.getState(); }
  function productById(id) { return data.products.find(function (p) { return p.id === id; }); }
  function sceneCopy(scene) { return state().creative.sceneCopies[scene.id] || scene.copy; }

  function isStageComplete(route) {
    const s = state();
    return {
      agent: !["草稿", "解析中", "待补充"].includes(s.requirement.status),
      requirement: ["已确认", "已创建任务"].includes(s.requirement.status),
      products: s.object.status === "已确认",
      creative: s.creative.previewConfirmed,
      production: s.task.status === "已创建",
      audit: s.audits.some(function (a) { return a.status === "通过"; }),
      library: s.materials.length > 0,
      results: s.campaign.metricsVisible,
      trace: s.analysis.confirmed
    }[route];
  }

  function renderNav() {
    const s = state();
    document.getElementById("main-nav").innerHTML = '<ol class="nav-list">' + data.navigation.map(function (item, index) {
      return '<li><button type="button" data-route="' + item.id + '" class="nav-item ' + (s.route === item.id ? "is-active" : "") + '"><span class="nav-index">' + (isStageComplete(item.id) ? "✓" : String(index + 1).padStart(2, "0")) + '</span><span>' + ui.esc(item.label) + "</span></button></li>";
    }).join("") + "</ol>";
    const done = data.navigation.filter(function (item) { return isStageComplete(item.id); }).length;
    document.getElementById("case-progress").innerHTML = '<span><b>' + done + '</b> / 9 已完成</span><div><i style="width:' + Math.round(done / 9 * 100) + '%"></i></div>';
  }

  function intro(eyebrow, title, description, status) {
    return ui.sectionHeader(eyebrow, title, description, status ? ui.status(status) : "");
  }

  function answerLabel(key, value) {
    return {
      "q-difference": value === "diverse" ? "10 条 = 3 类差异化创意" : "10 条 = 同模板替换商品",
      "q-audience": value === "new-25-35" ? "25–35 岁通勤新客" : value === "student" ? "18–24 岁学生新客" : "宽泛女装新客",
      channel: value === "feed" ? "通用短视频信息流" : "活动频道焦点位",
      scope: value === "summer-all" ? "夏季女装可售池" : "仅连衣裙"
    }[key] || value;
  }

  function agentSide() {
    const timeline = state().requirement.timeline.slice(-5).reverse();
    return '<aside class="context-panel"><p class="eyebrow">Agent 理解进度</p><h3>从原始意图到可确认需求</h3><ol class="mini-timeline">' + timeline.map(function (item) {
      return '<li><time>' + ui.esc(item.at) + '</time><span>' + ui.esc(item.text) + '</span></li>';
    }).join("") + '</ol><div class="callout"><b>当前识别</b><p>目标是拉新；素材为竖屏视频；商品和活动页必须在创意前确认。</p></div></aside>';
  }

  function questionCard(question) {
    let fields;
    if (question.compound) {
      fields = '<div class="form-grid two"><label>投放渠道<select name="channel">' + question.channelOptions.map(function (o) { return '<option value="' + o.value + '">' + ui.esc(o.label) + '</option>'; }).join("") + '</select></label><label>商品范围<select name="scope">' + question.scopeOptions.map(function (o) { return '<option value="' + o.value + '">' + ui.esc(o.label) + '</option>'; }).join("") + '</select></label></div>';
    } else {
      fields = '<div class="choice-list">' + question.options.map(function (o, i) {
        return '<label class="choice-card"><input type="radio" name="answer" value="' + o.value + '" ' + (i === 0 ? "checked" : "") + '><span><b>' + ui.esc(o.label) + '</b>' + (o.recommended ? '<small>Agent 推荐</small>' : "") + '</span></label>';
      }).join("") + "</div>";
    }
    return '<form id="question-form" data-question="' + question.id + '" class="question-card"><p class="eyebrow">第 ' + (state().requirement.questionIndex + 1) + ' / ' + data.questions.length + ' 轮追问</p><h3>' + ui.esc(question.title) + '</h3><p class="muted">' + ui.esc(question.help) + '</p>' + fields + '<div class="form-footer"><span>只询问会改变商品、创意或渠道的变量。</span><button class="button button-primary" type="submit">确认本轮回答</button></div></form>';
  }

  function renderAgent() {
    const s = state();
    let main;
    if (s.requirement.status === "草稿") {
      main = '<div class="agent-layout"><section class="agent-chat"><div class="chat-message agent"><span class="avatar">A</span><div><b>增长素材 Agent</b><p>请先告诉我这次希望达成什么业务结果。我会先补齐关键决策，再推进生产。</p></div></div><form id="intent-form" class="intent-box"><label for="intent-input">业务目标</label><textarea id="intent-input" rows="4" required>' + ui.esc(s.requirement.text) + '</textarea><div class="form-footer"><span>原始描述会保留，不直接改写为模型 Prompt。</span><button class="button button-primary" type="submit">提交给 Agent 理解</button></div></form></section>' + agentSide() + "</div>";
    } else if (s.requirement.status === "待补充") {
      main = '<div class="agent-layout"><section class="agent-chat"><div class="chat-message user"><span class="avatar">你</span><div><b>增长运营</b><p>' + ui.esc(s.requirement.text) + '</p></div></div><div class="system-strip"><span>系统自动完成</span> 已解析目标、素材形态与数量，并发现 ' + (data.questions.length - s.requirement.questionIndex) + ' 组会改变方案方向的缺失信息。</div>' + questionCard(data.questions[s.requirement.questionIndex]) + '</section>' + agentSide() + "</div>";
    } else {
      main = '<div class="agent-layout"><section class="agent-chat"><div class="chat-message agent"><span class="avatar">A</span><div><b>增长素材 Agent</b><p>关键歧义已处理。我已生成结构化需求摘要，下一步需要你确认业务口径。</p><button class="button button-primary" type="button" data-route="requirement">查看并确认需求</button></div></div><div class="answer-summary">' + Object.keys(s.requirement.answers).filter(function (key) { return key !== "q-channel"; }).map(function (key) { return '<span>' + ui.esc(answerLabel(key, s.requirement.answers[key])) + '</span>'; }).join("") + '</div></section>' + agentSide() + "</div>";
    }
    return intro("业务意图 → Agent 理解", "先说目标，Agent 再追问", "本场景不会从一句提示词直接跳到生成视频。", s.requirement.status) + main;
  }

  function renderRequirement() {
    const s = state();
    if (["草稿", "解析中", "待补充"].includes(s.requirement.status)) {
      return intro("结构化中间层", "确认结构化需求", "确认后才会进入商品推荐。", s.requirement.status) + ui.gate("需求尚未补充完整", "请先回答 Agent 的关键问题。", "agent", "返回 Agent 工作台");
    }
    const rows = data.requirementFields.map(function (row) { return row.slice(); });
    rows[1][1] = answerLabel("q-audience", s.requirement.answers["q-audience"]);
    rows[2][1] = answerLabel("channel", s.requirement.answers.channel) + (s.requirement.answers.channel === "channel" ? " · 9:16 · 12 秒" : " · 9:16 · 15 秒");
    rows[3][1] = answerLabel("scope", s.requirement.answers.scope);
    rows[5][1] = s.requirement.answers["q-difference"] === "template" ? "同一模板替换商品，生成 10 条" : "场景种草 4 条 / 利益点直给 3 条 / 搭配对比 3 条";
    rows[6][1] = s.object.status === "已确认" ? "清凉一夏 · 女装活动页（已确认）" : "待确认：虚构夏装活动页";
    return intro("需求确认", "把模糊意图冻结为业务版本", "事实、补充回答和原型假设形成同一份可追溯需求。", s.requirement.status) + '<section class="panel"><div class="version-line"><div><span class="eyebrow">当前需求版本</span><h3>夏季女装拉新视频 · v2</h3></div><button type="button" class="button button-ghost" data-drawer="requirement">查看字段来源</button></div>' + ui.fieldGrid(rows) + '<div class="decision-bar"><div><b>确认影响</b><p>确认后 Agent 才会基于该人群、渠道和商品范围进行选品。</p></div>' + (s.requirement.status === "待确认" ? '<button class="button button-primary" id="confirm-requirement" type="button">确认结构化需求</button>' : '<span class="confirmation-mark">✓ 已由增长运营确认</span>') + "</div></section>";
  }

  function selectedProduct(product, index, locked) {
    return '<article class="product-row" draggable="' + (!locked) + '" data-product-id="' + product.id + '"><span class="drag-handle" aria-hidden="true">⋮⋮</span><span class="rank">' + (index + 1) + '</span>' + ui.productVisual(product) + '<div class="product-main"><b>' + ui.esc(product.name) + '</b><p>' + ui.esc(product.reason) + '</p></div><div class="product-facts"><span>¥' + product.price + '</span><span>库存 ' + ui.metric(product.stock) + '</span><span>匹配 ' + product.match + '%</span></div><div class="reorder-actions"><button type="button" class="icon-button" data-move="up" data-id="' + product.id + '" aria-label="上移 ' + ui.esc(product.name) + '" ' + (locked || index === 0 ? "disabled" : "") + '>↑</button><button type="button" class="icon-button" data-move="down" data-id="' + product.id + '" aria-label="下移 ' + ui.esc(product.name) + '" ' + (locked || index === 5 ? "disabled" : "") + '>↓</button></div></article>';
  }

  function otherProduct(product) {
    const role = product.role === "backup" ? "候补" : "排除";
    return '<article class="mini-product">' + ui.productVisual(product) + '<div><span class="eyebrow">' + role + '</span><h4>' + ui.esc(product.name) + '</h4><p>' + ui.esc(product.reason) + '</p><small>¥' + product.price + ' · 库存 ' + ui.metric(product.stock) + ' · 匹配 ' + product.match + '%</small></div></article>';
  }

  function renderProducts() {
    const s = state();
    if (!["已确认", "已创建任务"].includes(s.requirement.status)) {
      return intro("选品与承接", "先选对商品，再做创意", "商品与点击后页面是进入创意的前置闸门。", s.object.status) + ui.gate("需求尚未确认", "确认人群、渠道与商品范围后，Agent 才能解释推荐结果。", "requirement", "前往需求确认");
    }
    const landingCards = data.landings.map(function (landing) {
      const checked = s.object.landingId === landing.id;
      return '<label class="landing-card ' + (checked ? "is-selected" : "") + '"><input type="radio" name="landing" value="' + landing.id + '" ' + (checked ? "checked" : "") + '><span><small>' + ui.esc(landing.type) + ' · ' + ui.esc(landing.status) + '</small><b>' + ui.esc(landing.title) + '</b><p>' + ui.esc(landing.summary) + '</p></span>' + (landing.recommended ? '<em>推荐</em>' : "") + '</label>';
    }).join("");
    return intro("选品与承接确认", "6 个主推商品与活动页", "Agent 综合库存、价格带与活动匹配度给出推荐；运营只需调整顺序和确认承接。", s.object.status) +
      '<section class="panel"><div class="subhead"><div><p class="eyebrow">主推商品 List</p><h3>拖动排序，或使用上移 / 下移</h3></div><span>6 个主推 · 4 个候补/排除</span></div><div class="product-list" id="product-list">' + s.object.productOrder.map(productById).map(function (p, i) { return selectedProduct(p, i, s.object.status === "已确认"); }).join("") + '</div><details class="other-products"><summary>查看候补与排除商品</summary><div class="product-grid">' + data.products.filter(function (p) { return p.role !== "selected"; }).map(otherProduct).join("") + '</div></details></section>' +
      '<section class="panel"><div class="subhead"><div><p class="eyebrow">点击后页面</p><h3>确认视频承接对象</h3></div><span>商品与页面一致性已自动校验</span></div><div class="landing-grid">' + landingCards + '</div></section><div class="decision-bar sticky-decision"><div><b>前置闸门</b><p>商品顺序和点击后页面未确认前，创意页面只读。</p></div>' + (s.object.status === "待确认" ? '<button class="button button-primary" id="confirm-object" type="button">确认商品与点击后页面</button>' : '<span class="confirmation-mark">✓ 商品与承接已锁定</span>') + '</div>';
  }

  function previewPanel() {
    const scene = data.storyboards[previewFrame % data.storyboards.length];
    const product = productById(state().object.productOrder[previewFrame % state().object.productOrder.length]);
    return '<aside class="preview-panel"><div class="subhead"><div><p class="eyebrow">离线预览</p><h3>竖屏 9:16</h3></div><span>' + (previewFrame + 1) + ' / 6</span></div><div class="phone-preview tone-' + product.tone + '"><div class="phone-safe"><span class="preview-brand">清凉一夏</span><div class="preview-product"><span>LOOK ' + String(scene.order).padStart(2, "0") + '</span><b>' + ui.esc(product.name) + '</b></div><p>' + ui.esc(sceneCopy(scene)) + '</p><small>' + ui.esc(scene.title) + ' · ' + scene.time + '</small></div></div><button class="button button-secondary button-full" id="play-preview" type="button">播放六镜预览</button><p class="preview-note">静态帧仅用于确认结构和版本，不代表模型真实成片。</p></aside>';
  }

  function renderCreative() {
    const s = state();
    if (!engine.can("enterCreative")) {
      return intro("创意与视频分镜", "商品之后，才是创意", "视频生产必须先经过分镜、组件和预览确认。", s.creative.status) + ui.gate("前置闸门未通过", "请先确认 6 个主推商品和点击后的活动页。", "products", "前往商品选择");
    }
    const directions = data.creativeDirections.map(function (d) {
      const selected = s.creative.directionId === d.id;
      return '<label class="direction-card ' + (selected ? "is-selected" : "") + '"><input type="radio" name="direction" value="' + d.id + '" ' + (selected ? "checked" : "") + '><span class="direction-no">' + d.accent + '</span><b>' + ui.esc(d.name) + '</b><p>' + ui.esc(d.tagline) + '</p><small>适用：' + ui.esc(d.fit) + ' · 配额 ' + d.quota + ' 条</small></label>';
    }).join("");
    const rows = data.storyboards.map(function (scene) {
      const target = s.creative.rework && s.creative.rework.target === scene.id;
      return '<tr class="' + (target ? "is-target" : "") + '"><td><span class="shot-index">' + scene.order + '</span></td><td><b>' + ui.esc(scene.title) + '</b><small>' + scene.time + '</small></td><td>' + ui.esc(scene.visual) + '</td><td><label class="sr-only" for="copy-' + scene.id + '">镜头文案</label><input class="table-input" id="copy-' + scene.id + '" data-scene-copy="' + scene.id + '" value="' + ui.esc(sceneCopy(scene)) + '" ' + (s.creative.status === "已确认" ? "disabled" : "") + '></td><td><div class="chip-row">' + scene.components.map(function (c) { return '<span>' + ui.esc(c) + '</span>'; }).join("") + '</div></td></tr>';
    }).join("");
    const rework = s.creative.rework ? '<div class="rework-banner"><div><p class="eyebrow">审核返工 · 新版本 v' + s.creative.storyboardVersion + '</p><h3>只修改镜头 4 与尾帧品牌组件</h3><p>' + ui.esc(s.creative.rework.reason) + '</p></div><span>原 v1 已保留</span></div>' : "";
    const action = s.creative.status === "待确认" ? '<button class="button button-primary" id="confirm-preview" type="button">' + (s.creative.rework ? '保存 v' + s.creative.storyboardVersion + ' 并重新送审' : '确认分镜与预览版本') + '</button>' : '<span class="confirmation-mark">✓ 分镜与预览版本已冻结</span>';
    return intro("创意方案 → 视频分镜 → 预览", "10 条视频不是 10 次盲生成", "先确定三类创意配额，再把画面、文案、语音与工程组件拆成可编辑分镜。", s.creative.status) + rework +
      '<section class="panel"><div class="subhead"><div><p class="eyebrow">创意方向与表达重点</p><h3>三类差异化方向，共 10 条</h3></div><label class="compact-field">表达重点<select id="creative-focus" ' + (s.creative.status === "已确认" ? "disabled" : "") + '><option value="清凉通勤" ' + (s.creative.focus === "清凉通勤" ? "selected" : "") + '>清凉通勤</option><option value="活动利益" ' + (s.creative.focus === "活动利益" ? "selected" : "") + '>活动利益</option><option value="一衣多搭" ' + (s.creative.focus === "一衣多搭" ? "selected" : "") + '>一衣多搭</option></select></label></div><div class="direction-grid">' + directions + '</div></section>' +
      '<div class="creative-layout"><section class="panel storyboard-panel"><div class="subhead"><div><p class="eyebrow">视频分镜 v' + s.creative.storyboardVersion + '</p><h3>15 秒 · 六镜结构</h3></div><button class="button button-ghost" type="button" data-drawer="video-components">查看组件与合成</button></div><div class="table-scroll"><table class="storyboard-table"><thead><tr><th>镜</th><th>节奏</th><th>商品画面</th><th>文案 / 口播</th><th>组件</th></tr></thead><tbody>' + rows + '</tbody></table></div></section>' + previewPanel() + '</div><div class="decision-bar"><div><b>确认影响</b><p>确认后冻结商品、承接页、创意与分镜版本，供批量任务引用。</p></div>' + action + '</div>';
  }

  function renderProduction() {
    const s = state();
    if (!s.creative.previewConfirmed) {
      return intro("任务编排与生产", "预览确认后再创建批量任务", "系统会冻结依赖版本并拆分为可局部重试的镜头与组件子任务。", s.task.status) + ui.gate("分镜预览尚未确认", "请先确认创意方向、六镜分镜和预览版本。", "creative", "前往创意与分镜");
    }
    if (s.task.status === "待创建") {
      return intro("批量任务", "确认生产范围", "这是进入长任务队列前的最后一次业务确认。", s.task.status) + '<section class="panel task-summary"><div class="task-number"><span>生产数量</span><strong>10</strong><small>条差异化竖屏视频</small></div><div class="task-fields"><label>优先级<select id="task-priority"><option>高</option><option>中</option><option>低</option></select></label><label>截止时间<input id="task-deadline" type="datetime-local" value="2026-07-05T18:00"></label><div><span>冻结依赖</span><b>需求 v2 · 商品 List v1 · 分镜 v' + s.creative.storyboardVersion + '</b></div></div><div class="callout"><b>系统将自动完成</b><p>Prompt 拼装、模型路由、镜头拆分、组件生产、工程合成、自动重试与质检。</p></div><button class="button button-primary button-large" id="create-task" type="button">确认并创建 10 条批量任务</button></section>';
    }
    const rows = s.production.map(function (job) {
      const p = productById(job.productId);
      return '<tr><td><div class="job-name"><span class="job-thumb tone-' + p.tone + '"></span><div><b>' + ui.esc(job.name) + '</b><small>' + ui.esc(p.name) + '</small></div></div></td><td>' + ui.status(job.outcome) + '</td><td><div class="progress-cell"><div><i style="width:' + job.progress + '%"></i></div><span>' + job.progress + '%</span></div></td><td>' + ui.esc(job.note) + '</td><td><button type="button" class="text-button" data-job-detail="' + job.id + '">查看记录</button></td></tr>';
    }).join("");
    return intro("生产队列", "10 条视频已拆为镜头与组件作业", "队列展示确定的 Mock 状态快照，不用加载动画冒充模型进度。", s.task.status) +
      '<div class="stats-grid four"><div><span>生产成功</span><b>2</b><small>已进入审核</small></div><div><span>处理中</span><b>4</b><small>生成 / 合成 / 质检</small></div><div><span>异常恢复</span><b>3</b><small>失败 / 重试 / 降级</small></div><div><span>等待资源</span><b>1</b><small>待排队</small></div></div>' +
      '<section class="panel"><div class="subhead"><div><p class="eyebrow">系统自动生产</p><h3>批量任务 · 10 条</h3><small>优先级：' + ui.esc(s.task.priority) + ' · 截止：' + ui.esc(s.task.deadline.replace("T", " ")) + '</small></div><button class="button button-ghost" data-drawer="state-machine" type="button">查看状态规则</button></div><div class="table-scroll"><table class="data-table"><thead><tr><th>视频作业</th><th>当前结果</th><th>进度</th><th>系统说明</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div></section>';
  }

  function auditCard(audit) {
    let actions = "";
    if (audit.status === "待审核") {
      actions = audit.canPass ? '<button class="button button-primary" type="button" data-audit-pass="' + audit.id + '">审核通过</button>' :
        '<form class="reject-form" data-reject-form="' + audit.id + '"><div class="form-grid two"><label>问题类型<select name="reasonType"><option>合规文案</option><option>品牌规范</option><option>版权问题</option></select></label><label>问题位置<select name="location"><option value="shot-04">镜头 4 · 活动文案</option><option value="shot-06">镜头 6 · Logo 组件</option><option value="compose">工程合成 · 安全区</option></select></label></div><label>具体修改意见<textarea name="comment" rows="3" required>删除未经证明的“全网最低价”；将尾帧 Logo 调整到品牌安全区内。</textarea></label><button class="button button-danger" type="submit">驳回并创建新版本</button></form>';
    } else if (audit.status === "驳回") {
      actions = '<div class="audit-result rejected"><b>已返回镜头与品牌组件</b><p>' + ui.esc(audit.comment) + '</p><button class="button button-primary" type="button" data-route="creative">前往修改 v' + (audit.version + 1) + '</button></div>';
    } else if (audit.status === "通过") {
      actions = '<div class="audit-result passed"><b>审核通过，系统已自动入库</b><button class="text-button" type="button" data-route="library">查看素材</button></div>';
    }
    return '<article class="audit-card"><div class="audit-preview"><span>15s · 9:16</span><div><small>VIDEO 0' + audit.id.slice(-1) + '</small><b>' + ui.esc(audit.name) + '</b></div></div><div class="audit-content"><div class="version-line"><div><span class="eyebrow">素材 v' + audit.version + '</span><h3>' + ui.esc(audit.name) + '</h3></div>' + ui.status(audit.status) + '</div><div class="risk-box ' + (audit.canPass ? "is-clear" : "") + '"><b>预检提示</b><p>' + ui.esc(audit.risk) + '</p></div><button class="button button-ghost button-full" type="button" data-trace="' + audit.id + '">查看生产与追溯</button>' + actions + '</div></article>';
  }

  function renderAudit() {
    const s = state();
    if (!engine.can("audit")) {
      return intro("审核与返工", "问题必须定位到具体环节", "审核结论会决定入库或返回分镜、组件、文案与合成环节。", "待审核") + ui.gate("批量任务尚未创建", "创建任务后，质检通过的素材会自动进入审核队列。", "production", "前往批量任务");
    }
    return intro("人工审核", "通过、驳回与版本保留", "预检只提供证据，最终审核结论由业务审核人员作出。", "审核中") + '<div class="audit-grid">' + s.audits.map(auditCard).join("") + '</div><div class="system-strip"><span>系统自动完成</span> 通过后校验追溯元数据并入库；驳回后仅重做问题镜头或组件，保留原版本。</div>';
  }

  function renderLibrary() {
    const s = state();
    if (!s.materials.length) {
      return intro("素材库", "审核通过后自动入库", "素材入库不是手工确认点；系统会校验完整追溯元数据。", "待入库") + ui.empty("暂无已入库素材", "先在审核队列通过一条素材。通过后会自动出现在这里。");
    }
    const cards = s.materials.map(function (m) {
      return '<article class="material-card"><div class="material-cover"><span>9:16 · 15s</span><b>' + ui.esc(m.name) + '</b><small>素材版本 v' + m.version + '</small></div><div class="material-body"><div class="version-line"><div><p class="eyebrow">已审核素材</p><h3>' + ui.esc(m.name) + '</h3></div>' + ui.status(m.status) + '</div><div class="material-meta"><span>需求 v2</span><span>分镜 v' + m.version + '</span><span>' + (m.parentVersion ? "由 v1 返工" : "首版通过") + '</span></div><button class="button button-secondary button-full" type="button" data-material="' + m.id + '">查看完整追溯</button></div></article>';
    }).join("");
    return intro("素材库", "审核、版本与生产记录统一入库", "复杂参数藏在详情抽屉；主界面只呈现业务可用范围。", "已入库") + '<div class="library-grid">' + cards + '</div><div class="system-strip"><span>系统自动完成</span> 素材 ID、父版本、适用范围和生产记录已关联，无需再次确认入库。</div>';
  }

  function analysisForm() {
    const s = state();
    if (s.analysis.confirmed) {
      return '<section class="knowledge-result"><span>已沉淀</span><div><h3>' + (s.analysis.knowledgeStatus === "可复用" ? "可复用经验" : "待继续观察") + '</h3><p>' + ui.esc(s.analysis.conclusion) + '</p><small>适用边界：夏季女装新客 · 通用短视频信息流 · 当前 Mock 样本</small></div></section>';
    }
    return '<section class="panel"><div class="subhead"><div><p class="eyebrow">人工判断与策略沉淀</p><h3>决定下一步，而不是让系统自动优化</h3></div></div><form id="analysis-form"><div class="choice-list horizontal"><label class="choice-card"><input type="radio" name="decision" value="reuse" checked><span><b>标记可复用</b><small>在相似条件下复用结构</small></span></label><label class="choice-card"><input type="radio" name="decision" value="verify"><span><b>继续验证</b><small>扩大样本后再判断</small></span></label><label class="choice-card"><input type="radio" name="decision" value="stop"><span><b>停止使用</b><small>下线并保留失败经验</small></span></label></div><label>复盘结论<textarea name="conclusion" rows="3" required>当前样本中，通勤场景开场的素材表现更高；建议在相似人群与渠道下继续验证，不将差异直接归因为创意结构。</textarea></label><div class="form-footer"><span>结论将带着样本、周期与适用边界写入创意知识库。</span><button class="button button-primary" type="submit">确认可复用经验</button></div></form></section>';
  }

  function renderResults() {
    const s = state();
    if (!engine.can("delivery")) {
      return intro("模拟投放与效果观察", "审核通过并入库后才能投放", "投放只记录模拟状态与结果关联，不连接真实广告平台。", s.campaign.status) + ui.gate("需要两条可用素材", "请完成一条素材通过、另一条驳回返工并复审通过，随后可比较观察。", "audit", "前往审核与返工");
    }
    let campaignAction = "";
    if (["待投放", "已下线"].includes(s.campaign.status)) campaignAction = '<button class="button button-primary" id="enable-campaign" type="button">确认计划并启用模拟投放</button>';
    if (s.campaign.status === "投放中") campaignAction = '<button class="button button-secondary" id="stop-campaign" type="button">停止模拟投放</button>';
    let metrics = "";
    if (s.campaign.metricsVisible) {
      metrics = '<section class="panel"><div class="subhead"><div><p class="eyebrow">模拟数据回流</p><h3>素材级效果比较</h3></div><span>观察周期：3 天 · 同一口径</span></div><div class="metric-table">' + data.metrics.map(function (row) {
        const ctr = (row.clicks / row.impressions * 100).toFixed(2);
        const cvr = (row.conversions / row.clicks * 100).toFixed(2);
        return '<article><h4>' + ui.esc(row.label) + '</h4><div><span>曝光<b>' + ui.metric(row.impressions) + '</b></span><span>点击<b>' + ui.metric(row.clicks) + '</b></span><span>转化<b>' + ui.metric(row.conversions) + '</b></span><span>点击率<b>' + ctr + '%</b></span><span>点击转化率<b>' + cvr + '%</b></span></div></article>';
      }).join("") + '</div><div class="observation"><span>观察，不是归因</span><p>在当前 Mock 样本与三天观察期内，“场景种草 · 防晒通勤”的点击率与点击转化率均高于返工版；差异可能同时受到商品、人群、样本量或投放环境影响，不能据此声明创意导致了提升。</p></div></section>' + analysisForm();
    }
    return intro("投放与数据回流", "从素材可用到效果观察", "所有指标均为演示数据，页面只支持记录、比较和人工判断。", s.campaign.status) + '<section class="panel campaign-panel"><div><p class="eyebrow">模拟投放计划</p><h3>夏季女装新客 · 通用短视频信息流</h3><p>2 条已入库素材 · 清凉一夏活动页 · 25–35 岁通勤女装新客</p></div><div class="campaign-actions">' + ui.status(s.campaign.status) + campaignAction + '</div></section>' + metrics;
  }

  function renderTrace() {
    const s = state();
    const assets = data.assets.map(function (a) {
      return '<article class="asset-card"><span class="eyebrow">' + ui.esc(a.type) + '</span><h3>' + ui.esc(a.name) + '</h3><p>' + ui.esc(a.detail) + '</p>' + ui.status(a.status) + '</article>';
    }).join("");
    const cards = s.materials.length ? s.materials.map(function (m) {
      return '<button type="button" class="trace-card" data-material="' + m.id + '"><span>素材 v' + m.version + '</span><b>' + ui.esc(m.name) + '</b><small>需求 → 商品 → 创意 → 生产 → 审核 → 投放</small></button>';
    }).join("") : '<p class="muted">素材通过审核后，可在这里打开完整追溯链。</p>';
    return intro("资产底座与全链路追溯", "复杂信息随时可查，不挤占主操作区", "资产、规则、知识与素材记录边界清晰；技术配置只在详情中展开。", "可追溯") + '<section class="panel"><div class="subhead"><div><p class="eyebrow">资产与规则</p><h3>生产所引用的四类底座</h3></div><span>均为虚构演示资产</span></div><div class="asset-grid">' + assets + '</div></section><section class="panel"><div class="subhead"><div><p class="eyebrow">素材追溯</p><h3>从原始需求到投放结果</h3></div><button type="button" class="button button-ghost" data-drawer="activity-log">查看全局状态记录</button></div><div class="trace-grid">' + cards + '</div></section>';
  }

  const renderers = {
    agent: renderAgent, requirement: renderRequirement, products: renderProducts,
    creative: renderCreative, production: renderProduction, audit: renderAudit,
    library: renderLibrary, results: renderResults, trace: renderTrace
  };

  function stopPreview() {
    if (previewTimer) { clearInterval(previewTimer); previewTimer = null; }
  }

  function render() {
    stopPreview();
    renderNav();
    const nav = data.navigation.find(function (n) { return n.id === state().route; });
    document.title = (nav ? nav.label : data.meta.title) + " · Agent 广告素材生产平台";
    workspace.innerHTML = '<div class="page-wrap">' + renderers[state().route]() + '<footer class="page-footer"><span>' + ui.esc(data.meta.disclaimer) + '</span><span>Demo v1.0 · 离线可用</span></footer></div>';
  }

  function navigate(route) {
    engine.setRoute(route);
    render();
    workspace.focus();
  }

  function safeAction(action, success) {
    try {
      action();
      render();
      if (success) ui.toast(success);
    } catch (error) {
      console.error(error);
      ui.toast(error.message);
    }
  }

  function openTrace(trace, title) {
    const labels = { requirement: "需求版本", products: "商品 / SKU", landing: "点击后页面", creative: "创意版本", prompt: "生成提示词", model: "模型版本", storyboard: "分镜参数", compose: "工程合成", audit: "审核记录", material: "素材版本", delivery: "投放结果" };
    ui.openDrawer({
      eyebrow: "全链路追溯", title: title,
      body: '<ol class="trace-timeline">' + Object.keys(labels).map(function (key, i) {
        return '<li><span>' + String(i + 1).padStart(2, "0") + '</span><div><b>' + labels[key] + '</b><p>' + ui.esc(trace[key]) + '</p></div></li>';
      }).join("") + '</ol><div class="drawer-note">所有模型名称、参数和结果均为 Mock，用于演示可追溯关系。</div>'
    });
  }

  function openNamedDrawer(name) {
    const s = state();
    if (name === "requirement") return ui.openDrawer({ eyebrow: "字段来源", title: "结构化需求 v2", body: ui.fieldGrid([["原始事实", "拉新、夏季女装、10 条竖屏视频、活动频道"], ["用户补充", "目标人群、通用信息流、商品范围、差异策略"], ["原型假设", "15 秒、9:16、虚构夏装活动页"], ["版本规则", "确认后冻结；重大修改创建新版本"]]) });
    if (name === "video-components") return ui.openDrawer({ eyebrow: "视频生产结构", title: "组件与工程合成", body: '<div class="drawer-stack"><section><h3>模型片段</h3><p>六个镜头独立生成，保留 Prompt、参考商品、模型版本与参数。</p></section><section><h3>TTS / 数字人 / 字幕</h3><p>配音、口播、字幕、背景音乐、商品贴片与 Logo 独立生产，可单独替换或降级。</p></section><section><h3>工程合成</h3><p>按时间轴拼接镜头，叠加转场、字幕、BGM、Logo、CTA 和首尾帧。</p></section><section><h3>异常原则</h3><p>镜头失败只重试镜头；组件失败可替换或降级；合成失败只重合成受影响部分。</p></section></div>' });
    if (name === "state-machine") return ui.openDrawer({ eyebrow: "集中状态规则", title: "生产、异常与审核状态机", body: '<div class="drawer-stack"><section><h3>生产主状态</h3><p>待排队 → 排队中 → 生成中 → 合成中 → 质检中 → 待审核</p></section><section><h3>异常旁路</h3><p>部分失败 → 自动重试 → 技术处理或降级 → 返回失败镜头/组件</p></section><section><h3>审核</h3><p>待审核 → 审核中 → 通过 / 驳回 / 待人工复核</p></section><section><h3>素材</h3><p>待入库 → 已入库 → 待投放 → 投放中 → 已下线 → 可复用 / 已归档</p></section></div>' });
    if (name === "activity-log") return ui.openDrawer({ eyebrow: "状态与操作记录", title: "全局状态时间线", body: s.activityLog.length ? '<ol class="activity-list">' + s.activityLog.slice().reverse().map(function (item) { return '<li><time>' + ui.esc(item.at) + '</time><div><b>' + ui.esc(item.actor || "系统") + '</b><p>' + ui.esc(item.text) + '</p></div></li>'; }).join("") + '</ol>' : ui.empty("暂无状态记录", "提交业务需求后，合法状态转换会出现在这里。") });
  }

  function openJob(jobId) {
    const job = state().production.find(function (j) { return j.id === jobId; });
    const lines = job.timeline.concat([{ at: "当前", actor: "系统", text: job.note }]);
    ui.openDrawer({ eyebrow: "子任务与局部重试", title: job.name, body: '<div class="drawer-summary">' + ui.status(job.outcome) + '<b>主生产状态：' + ui.esc(job.status) + '</b></div><ol class="activity-list">' + lines.map(function (item) { return '<li><time>' + ui.esc(item.at) + '</time><div><b>' + ui.esc(item.actor || "系统") + '</b><p>' + ui.esc(item.text) + '</p></div></li>'; }).join("") + '</ol><div class="drawer-note">失败片段之外的镜头和组件均被保留，没有重新生产整条视频。</div>' });
  }

  function playPreview() {
    stopPreview();
    previewFrame = 0;
    previewTimer = setInterval(function () {
      previewFrame += 1;
      if (previewFrame >= data.storyboards.length) { previewFrame = 0; stopPreview(); ui.toast("六镜预览播放完成"); }
      if (state().route === "creative") {
        const panel = document.querySelector(".preview-panel");
        if (panel) panel.outerHTML = previewPanel();
      }
    }, 900);
  }

  function reorderProduct(id, offset) {
    const order = state().object.productOrder.slice();
    const index = order.indexOf(id);
    const next = index + offset;
    if (next < 0 || next >= order.length) return;
    const temp = order[index]; order[index] = order[next]; order[next] = temp;
    safeAction(function () {
      engine.transition("object", state().object.id, "REORDER", { order: order, actor: "商品运营", note: "通过排序控件调整商品优先级" });
    }, "商品顺序已更新");
  }

  function confirmPreview() {
    const wasRework = !!state().creative.rework;
    safeAction(function () {
      document.querySelectorAll("[data-scene-copy]").forEach(function (input) {
        engine.transition("creative", state().creative.id, "UPDATE_SCENE", { sceneId: input.dataset.sceneCopy, copy: input.value, actor: "增长运营", note: "确认镜头文案" });
      });
      const rework = state().creative.rework;
      engine.transition("creative", state().creative.id, "CONFIRM_PREVIEW", { actor: "增长运营", note: rework ? "确认返工分镜 v" + state().creative.storyboardVersion : "确认创意、分镜与预览 v1" });
      if (rework) {
        engine.transition("audit", rework.auditId, "RESUBMIT", { note: "仅重做镜头 4 与尾帧 Logo，重新质检后送审" });
      }
    }, wasRework ? "新版本已局部重制并重新送审" : "分镜与预览版本已确认");
  }

  function passAudit(auditId) {
    safeAction(function () {
      const audit = state().audits.find(function (item) { return item.id === auditId; });
      engine.transition("audit", auditId, "START", { actor: "审核人员", note: "开始审核素材 v" + audit.version });
      engine.transition("audit", auditId, "PASS", { actor: "审核人员", note: "内容、品牌与规格审核通过" });
    }, "审核通过，素材已自动入库");
  }

  document.addEventListener("click", function (event) {
    const routeButton = event.target.closest("[data-route]");
    if (routeButton) return navigate(routeButton.dataset.route);
    if (event.target.id === "close-drawer" || event.target.id === "drawer-backdrop") return ui.closeDrawer();
    if (event.target.id === "reset-demo") {
      stopPreview(); engine.reset(); previewFrame = 0; ui.closeDrawer(); render();
      return ui.toast("演示已重置到初始场景");
    }
    if (event.target.id === "confirm-requirement") return safeAction(function () {
      engine.transition("requirement", state().requirement.id, "CONFIRM", { actor: "增长运营", note: "确认目标、人群、渠道与生产约束" });
    }, "需求已确认，可以进入商品选择");
    if (event.target.id === "confirm-object") return safeAction(function () {
      engine.transition("object", state().object.id, "CONFIRM", { actor: "商品运营", note: "确认主推顺序与清凉一夏活动页" });
    }, "商品与点击后页面已锁定");
    const move = event.target.closest("[data-move]");
    if (move) return reorderProduct(move.dataset.id, move.dataset.move === "up" ? -1 : 1);
    if (event.target.id === "confirm-preview") return confirmPreview();
    if (event.target.id === "play-preview") return playPreview();
    if (event.target.id === "create-task") return safeAction(function () {
      const priority = document.getElementById("task-priority").value;
      const deadline = document.getElementById("task-deadline").value;
      engine.transition("task", state().task.id, "CREATE", { actor: "增长运营", priority: priority, deadline: deadline, note: "确认 10 条、" + priority + "优先级与截止时间" });
    }, "批量任务已创建，系统开始自动生产");
    const job = event.target.closest("[data-job-detail]"); if (job) return openJob(job.dataset.jobDetail);
    const drawer = event.target.closest("[data-drawer]"); if (drawer) return openNamedDrawer(drawer.dataset.drawer);
    const trace = event.target.closest("[data-trace]"); if (trace) return openTrace(data.traceTemplates[trace.dataset.trace], "生产与追溯记录");
    const material = event.target.closest("[data-material]");
    if (material) {
      const m = state().materials.find(function (item) { return item.id === material.dataset.material; });
      if (m) return openTrace(m.trace, m.name + " · v" + m.version);
    }
    const pass = event.target.closest("[data-audit-pass]"); if (pass) return passAudit(pass.dataset.auditPass);
    if (event.target.id === "enable-campaign") return safeAction(function () {
      engine.transition("campaign", state().campaign.id, "ENABLE", { actor: "增长运营", note: "确认计划并启用模拟投放" });
    }, "模拟投放已启用，数据已回流");
    if (event.target.id === "stop-campaign") return safeAction(function () {
      engine.transition("campaign", state().campaign.id, "STOP", { actor: "增长运营", note: "停止模拟投放" });
    }, "模拟投放已停止");
  });

  document.addEventListener("change", function (event) {
    if (event.target.name === "landing") safeAction(function () {
      engine.transition("object", state().object.id, "SELECT_LANDING", { landingId: event.target.value, actor: "商品运营", note: "调整点击后页面" });
    });
    if (event.target.name === "direction") safeAction(function () {
      engine.transition("creative", state().creative.id, "SELECT_DIRECTION", { directionId: event.target.value, focus: document.getElementById("creative-focus").value, actor: "增长运营", note: "选择创意方向" });
    });
    if (event.target.id === "creative-focus") safeAction(function () {
      engine.transition("creative", state().creative.id, "SELECT_DIRECTION", { directionId: state().creative.directionId, focus: event.target.value, actor: "增长运营", note: "调整表达重点" });
    });
    if (event.target.matches("[data-scene-copy]")) safeAction(function () {
      engine.transition("creative", state().creative.id, "UPDATE_SCENE", { sceneId: event.target.dataset.sceneCopy, copy: event.target.value, actor: "增长运营", note: "修改镜头文案" });
    });
  });

  document.addEventListener("submit", function (event) {
    if (event.target.id === "intent-form") {
      event.preventDefault();
      const text = document.getElementById("intent-input").value.trim();
      return safeAction(function () {
        if (!text) throw new Error("请先说明业务目标");
        engine.transition("requirement", state().requirement.id, "SUBMIT", { text: text, actor: "增长运营", note: "提交原始业务需求" });
        engine.transition("requirement", state().requirement.id, "NEED_INPUT", { note: "Agent 完成解析并识别到关键缺失项" });
      }, "Agent 已完成理解，发现 3 组关键信息需要补充");
    }
    if (event.target.id === "question-form") {
      event.preventDefault();
      const questionId = event.target.dataset.question;
      const compound = event.target.querySelector("[name=channel]");
      const value = compound ? compound.value : event.target.querySelector("[name=answer]:checked").value;
      const extra = compound ? { channel: compound.value, scope: event.target.querySelector("[name=scope]").value } : null;
      const isLast = state().requirement.questionIndex + 1 >= data.questions.length;
      return safeAction(function () {
        engine.transition("requirement", state().requirement.id, "ANSWER", { questionId: questionId, value: value, extra: extra, actor: "增长运营", note: "回答 Agent 第 " + (state().requirement.questionIndex + 1) + " 轮追问" });
        if (state().requirement.questionIndex >= data.questions.length) engine.transition("requirement", state().requirement.id, "READY", { note: "关键信息已完整，生成待确认需求 v2" });
      }, isLast ? "关键信息已补齐，请确认结构化需求" : "回答已记录，Agent 继续下一轮追问");
    }
    const reject = event.target.closest("[data-reject-form]");
    if (reject) {
      event.preventDefault();
      const form = new FormData(reject);
      const auditId = reject.dataset.rejectForm;
      return safeAction(function () {
        const audit = state().audits.find(function (a) { return a.id === auditId; });
        engine.transition("audit", auditId, "START", { actor: "审核人员", note: "开始审核素材 v" + audit.version });
        engine.transition("audit", auditId, "REJECT", { actor: "审核人员", reasonType: form.get("reasonType"), location: form.get("location"), comment: form.get("comment"), note: "驳回并定位到" + form.get("location") });
        engine.transition("creative", state().creative.id, "START_REWORK", { auditId: auditId, target: "shot-04", reason: form.get("comment"), actor: "系统", note: "创建分镜 v2，保留 v1" });
      }, "素材已驳回，已创建新版本并返回具体镜头");
    }
    if (event.target.id === "analysis-form") {
      event.preventDefault();
      const form = new FormData(event.target);
      return safeAction(function () {
        engine.setAnalysis({ decision: form.get("decision"), conclusion: form.get("conclusion"), confirmed: true });
      }, "复盘结论已写入创意知识库");
    }
  });

  document.addEventListener("dragstart", function (event) {
    const row = event.target.closest("[data-product-id]");
    if (row && state().object.status !== "已确认") {
      draggedProductId = row.dataset.productId;
      row.classList.add("is-dragging");
    }
  });
  document.addEventListener("dragover", function (event) {
    if (event.target.closest("[data-product-id]")) event.preventDefault();
  });
  document.addEventListener("drop", function (event) {
    const target = event.target.closest("[data-product-id]");
    if (!target || !draggedProductId) return;
    event.preventDefault();
    const order = state().object.productOrder.slice();
    const from = order.indexOf(draggedProductId);
    const to = order.indexOf(target.dataset.productId);
    order.splice(from, 1); order.splice(to, 0, draggedProductId);
    draggedProductId = null;
    safeAction(function () {
      engine.transition("object", state().object.id, "REORDER", { order: order, actor: "商品运营", note: "拖动调整商品优先级" });
    }, "商品顺序已更新");
  });
  document.addEventListener("dragend", function () { draggedProductId = null; });

  document.getElementById("close-drawer").addEventListener("click", ui.closeDrawer);
  document.getElementById("drawer-backdrop").addEventListener("click", ui.closeDrawer);
  render();
})();
