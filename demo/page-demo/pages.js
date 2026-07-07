(function () {
  const go = (url) => { window.location.href = url; };
  const msg = (id, text, type = "") => { const el = document.getElementById(id); if (el) { el.textContent = text; el.className = `form-message ${type}`; } };
  document.querySelectorAll("[data-href]").forEach((el) => el.addEventListener("click", () => go(el.dataset.href)));
  document.querySelectorAll("[data-conversation]").forEach((el) => el.addEventListener("click", () => {
    go(`02-agent-workbench.html?conversation=${encodeURIComponent(el.dataset.conversation)}`);
  }));
  document.querySelectorAll("[data-open-dialog]").forEach((el) => el.addEventListener("click", () => document.getElementById(el.dataset.openDialog)?.showModal()));
  document.querySelectorAll("[data-close-dialog]").forEach((el) => el.addEventListener("click", () => el.closest("dialog")?.close()));
  const updateGlobalRecentConversation = () => {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem("agentWorkbenchCurrentConversation")); } catch (error) {}
    const hasConversation = !!(saved && saved.started);
    document.querySelectorAll('[data-conversation="current"]').forEach((button) => {
      button.hidden = !hasConversation;
      button.style.display = hasConversation ? "" : "none";
      if (hasConversation) button.textContent = saved.title || "夏季女装10条拉新视频";
    });
    document.querySelectorAll(".recent-empty").forEach((item) => { item.hidden = hasConversation; item.style.display = hasConversation ? "none" : ""; });
  };
  updateGlobalRecentConversation();
  const updateGlobalReviewState = () => {
    const reviewCleared = sessionStorage.getItem("reviewQueueEmpty") === "true";
    const reviewCount = sessionStorage.getItem("reviewQueueCount");
    document.querySelectorAll('[data-href="05-review.html"]').forEach((button) => {
      const badge = button.querySelector(".badge");
      if (!badge) return;
      badge.hidden = false;
      badge.style.display = "";
      badge.classList.toggle("empty-badge", reviewCleared);
      if (reviewCleared) badge.textContent = "暂无";
      if (!reviewCleared && reviewCount) badge.textContent = reviewCount;
      button.title = reviewCleared ? "暂无需审核任务" : "";
    });
  };
  updateGlobalReviewState();

  if (document.body.dataset.page === "workbench") {
    const prompt = document.getElementById("agent-prompt");
    const fixedPrompt = "从夏季女装中选择合适商品，生成10条竖屏拉新视频，用于拉新。";
    const setPrompt = (text) => { prompt.value = text; prompt.focus(); };
    const conversation = new URLSearchParams(window.location.search).get("conversation");
    const savedDraft = sessionStorage.getItem("agentDraft");
    if (savedDraft && conversation !== "current") { setPrompt(savedDraft); sessionStorage.removeItem("agentDraft"); msg("workbench-message", "已带入上一页面的信息，可以继续让 Agent 处理。", "success"); }
    document.querySelectorAll("[data-load-prompt]").forEach((el) => el.addEventListener("click", () => setPrompt(el.dataset.loadPrompt)));
    document.querySelectorAll("[data-append-prompt]").forEach((el) => el.addEventListener("click", () => setPrompt(`${prompt.value} ${el.dataset.appendPrompt}`.trim())));
    const conversationLog = document.getElementById("conversation-log");
    const requirementSummary = document.getElementById("requirement-summary");
    const answers = {};
    const workbenchConversationKey = "agentWorkbenchCurrentConversation";
    const recentButton = document.getElementById("recent-current-conversation");
    const recentEmpty = document.getElementById("recent-empty");
    const clarificationSteps = [
      { key: "distribution", question: "收到。开始选品前，我需要确认“10条”的具体含义。", options: ["10个商品，每个商品1条", "少量商品，10个创意版本"] },
      { key: "channel", question: "这些视频主要投放到哪个渠道？", options: ["短视频信息流", "品牌自有频道"] },
      { key: "audience", question: "本次拉新主要面向哪类人群？", options: ["25—35岁通勤女装新客", "泛夏装新客"] },
      { key: "landing", question: "用户点击素材后进入哪个承接页面？", options: ["清凉一夏女装活动页", "对应商品详情页"] }
    ];
    const appendBubble = (className, text) => {
      const bubble = document.createElement("div");
      bubble.className = className;
      bubble.textContent = text;
      conversationLog.appendChild(bubble);
      return bubble;
    };
    const getSavedConversation = () => {
      try { return JSON.parse(localStorage.getItem(workbenchConversationKey)); } catch (error) { return null; }
    };
    const updateRecentEntry = () => {
      const saved = getSavedConversation();
      const hasConversation = !!(saved && saved.started);
      recentButton.hidden = !hasConversation;
      recentButton.style.display = hasConversation ? "" : "none";
      recentEmpty.hidden = hasConversation;
      recentEmpty.style.display = hasConversation ? "none" : "";
      if (hasConversation) recentButton.textContent = saved.title || "夏季女装10条拉新视频";
    };
    const saveCurrentConversation = () => {
      const started = !document.getElementById("agent-result").hidden;
      const data = { started, title: "夏季女装10条拉新视频", prompt: prompt.value, answers: { ...answers }, summaryVisible: !requirementSummary.hidden };
      localStorage.setItem(workbenchConversationKey, JSON.stringify(data));
      updateRecentEntry();
    };
    const restoreCurrentConversation = () => {
      const saved = getSavedConversation();
      if (!saved || !saved.started) return false;
      setPrompt(saved.prompt || fixedPrompt);
      Object.keys(answers).forEach((key) => delete answers[key]);
      Object.assign(answers, saved.answers || {});
      document.getElementById("conversation-history").hidden = true;
      document.getElementById("agent-result").hidden = false;
      conversationLog.innerHTML = "";
      requirementSummary.hidden = true;
      document.getElementById("workbench-title").textContent = saved.title || "夏季女装10条拉新视频";
      document.getElementById("workbench-subtitle").textContent = "已恢复到上次对话位置，可以继续确认需求。";
      appendBubble("user-bubble", saved.prompt || fixedPrompt);
      let answeredCount = 0;
      clarificationSteps.forEach((step) => {
        if (!answers[step.key]) return;
        appendBubble("agent-bubble", step.question);
        appendBubble("user-bubble", answers[step.key]);
        answeredCount += 1;
      });
      if (saved.summaryVisible || answeredCount === clarificationSteps.length) showRequirementSummary();
      else askClarification(answeredCount);
      msg("workbench-message", "已恢复最近对话。", "success");
      return true;
    };
    const showRequirementSummary = () => {
      document.getElementById("summary-distribution").textContent = answers.distribution;
      document.getElementById("summary-channel").textContent = answers.channel;
      document.getElementById("summary-audience").textContent = answers.audience;
      document.getElementById("summary-landing").textContent = answers.landing;
      requirementSummary.hidden = false;
      msg("workbench-message", "Agent已补全并结构化需求，请进行最终确认。", "success");
      saveCurrentConversation();
    };
    const askClarification = (index) => {
      const step = clarificationSteps[index];
      const bubble = appendBubble("agent-bubble", step.question);
      const options = document.createElement("div");
      options.className = "agent-options";
      step.options.forEach((option) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = option;
        button.addEventListener("click", () => {
          answers[step.key] = option;
          options.querySelectorAll("button").forEach((item) => { item.disabled = true; item.classList.toggle("selected-option", item === button); });
          appendBubble("user-bubble", option);
          saveCurrentConversation();
          if (index + 1 < clarificationSteps.length) askClarification(index + 1);
          else showRequirementSummary();
        }, { once: true });
        options.appendChild(button);
      });
      bubble.appendChild(options);
      saveCurrentConversation();
    };
    updateRecentEntry();
    if (conversation === "current") restoreCurrentConversation();
    document.getElementById("new-agent-task").addEventListener("click", () => { prompt.value = fixedPrompt; document.getElementById("agent-result").hidden = true; document.getElementById("conversation-history").hidden = true; conversationLog.innerHTML = ""; requirementSummary.hidden = true; Object.keys(answers).forEach((key) => delete answers[key]); document.getElementById("workbench-title").textContent = "上午好，林晓。今天想制作什么营销素材？"; document.getElementById("workbench-subtitle").textContent = "直接告诉我业务目标，我会帮你补全需求、推荐商品并推进素材生产。"; msg("workbench-message", "已创建新的需求对话。", "success"); prompt.focus(); });
    document.getElementById("attach-file").addEventListener("click", () => document.getElementById("agent-file").click());
    document.getElementById("agent-file").addEventListener("change", (event) => msg("workbench-message", event.target.files[0] ? `已添加附件：${event.target.files[0].name}` : "未选择附件。"));
    prompt.addEventListener("input", () => { if (!document.getElementById("agent-result").hidden) saveCurrentConversation(); });
    document.getElementById("send-agent-request").addEventListener("click", () => {
      if (!prompt.value.trim()) return msg("workbench-message", "请先输入素材需求。", "error");
      conversationLog.innerHTML = "";
      requirementSummary.hidden = true;
      Object.keys(answers).forEach((key) => delete answers[key]);
      document.getElementById("agent-result").hidden = false;
      appendBubble("user-bubble", prompt.value.trim());
      saveCurrentConversation();
      askClarification(0);
      msg("workbench-message", "Agent已识别需求，并提出一个必要问题。", "success");
    });
    document.getElementById("modify-agent-requirement").addEventListener("click", () => {
      document.getElementById("edit-distribution").value = answers.distribution;
      document.getElementById("edit-channel").value = answers.channel;
      document.getElementById("edit-audience").value = answers.audience;
      document.getElementById("edit-landing").value = answers.landing;
    });
    document.getElementById("confirm-agent-plan").addEventListener("click", saveCurrentConversation);
    document.getElementById("requirement-edit-form").addEventListener("submit", (event) => {
      event.preventDefault();
      answers.distribution = document.getElementById("edit-distribution").value;
      answers.channel = document.getElementById("edit-channel").value;
      answers.audience = document.getElementById("edit-audience").value;
      answers.landing = document.getElementById("edit-landing").value;
      const note = document.getElementById("edit-note").value.trim();
      appendBubble("user-bubble", `修改需求：${answers.distribution}；${answers.channel}；${answers.audience}；${answers.landing}${note ? `；补充：${note}` : ""}`);
      appendBubble("agent-bubble", "已根据你的修改更新需求，其他已确认内容保持不变。请继续确认当前需求摘要。");
      showRequirementSummary();
      document.getElementById("requirement-edit-dialog").close();
    });
    document.getElementById("send-team-message")?.addEventListener("click", () => {
      const input = document.getElementById("team-message-input");
      const text = input.value.trim();
      if (!text) return msg("team-message-tip", "请先输入要发送的消息。", "error");
      const item = document.createElement("div");
      item.className = "chat-row mine";
      item.innerHTML = `<div><span class="chat-name">林晓</span><p class="chat-bubble">${text}</p></div><span class="chat-avatar">林</span>`;
      document.getElementById("team-message-list").appendChild(item);
      input.value = "";
      msg("team-message-tip", "消息已发送给工作组。", "success");
    });
  }

  if (document.body.dataset.page === "review") {
    const items = [...document.querySelectorAll("[data-review-item]")];
    const reviewVideos = {
      video01: { title: "视频01 · 冰丝通勤衬衫", meta: "v1 · 场景种草 · 9:16 · 15秒", brand: "星河女装 · 冰丝通勤", product: "冰丝通勤衬衫", background: "linear-gradient(155deg,#173f55,#35a9a0)", shots: ["30℃上班\n怎么穿？","冰丝面料\n清爽不贴身","轻薄透气\n通勤不易皱","衬衫＋阔腿裤\n一套更利落","新客夏装\n限时优惠","点击进入\n清凉一夏专区"] },
      video02: { title: "视频02 · 法式收腰连衣裙", meta: "v1 · 场景种草 · 9:16 · 15秒", brand: "星河女装 · 法式通勤", product: "法式收腰连衣裙", background: "linear-gradient(155deg,#33255b,#7651d9)", shots: ["30℃通勤\n清爽又显瘦","收腰剪裁\n优化身材比例","轻盈裙摆\n通勤约会都适合","一件完成\n夏日通勤穿搭","新客专享\n夏装限时优惠","点击进入\n活动页面"] },
      video03: { title: "视频03 · 高腰垂感阔腿裤", meta: "v1 · 搭配对比 · 9:16 · 15秒", brand: "星河女装 · 显高搭配", product: "高腰垂感阔腿裤", background: "linear-gradient(155deg,#3c3325,#b48650)", shots: ["同一件上衣\n为什么不显高？","高腰线设计\n拉长腿部比例","垂感面料\n走路更利落","普通穿法 VS\n高腰搭配","通勤裤装\n新客优惠","点击查看\n完整搭配"] },
      video02v2: { title: "视频02 · 法式收腰连衣裙", meta: "v2 · 新版分镜待复审 · 镜头4已修改", brand: "星河女装 · Logo安全区已调整", product: "法式收腰连衣裙 v2", background: "linear-gradient(155deg,#4c2451,#b85a8a)", shots: ["30℃通勤\n清爽又显瘦","收腰剪裁\n优化身材比例","轻盈裙摆\n通勤约会都适合","Logo位置已调整\n展示时间已延长","新客专享\n夏装限时优惠","点击进入\n活动页面"] },
      video04: { title: "视频04 · 清凉亚麻西装", meta: "v2 · 返工中 · 字幕调整", brand: "星河女装 · 亚麻通勤", product: "清凉亚麻西装", background: "linear-gradient(155deg,#33402e,#71955e)", shots: ["夏天穿西装\n也能很清凉","亚麻混纺\n轻薄透气","自然肩线\n通勤更精神","一衣多搭\n会议约会都适合","活动字幕\n正在调整","点击进入\n通勤专区"] }
    };
    const shotTimes = ["0—2秒","2—5秒","5—8秒","8—11秒","11—13秒","13—15秒"];
    const shotTrace = [
      ["镜头1 · 痛点吸引", "字幕组件、场景画面组件", "分镜脚本 / 视频组件"],
      ["镜头2 · 商品出现", "商品组件、模特画面组件", "商品 List / 视频组件"],
      ["镜头3 · 卖点解释", "文案组件、商品特写组件", "分镜脚本 / 文案组件"],
      ["镜头4 · 场景证明", "品牌Logo组件、场景画面组件", "视频组件 · 品牌组件"],
      ["镜头5 · 优惠提醒", "活动文案组件、价格组件", "图片创意方案 / 文案组件"],
      ["镜头6 · 转化引导", "承接组件、CTA组件", "承接组件 / 任务配置"]
    ];
    let activeReviewId = "video02";
    let reviewStatus = "待审核";
    const setActiveReviewFilter = (status) => {
      reviewStatus = status;
      document.querySelectorAll("[data-review-filter]").forEach((tab) => tab.classList.toggle("active", tab.dataset.reviewFilter === status));
    };
    const updateReviewCounts = () => {
      const labels = { "待审核": "待我审核", "待复审": "待复审" };
      document.querySelectorAll("[data-review-filter]").forEach((tab) => {
        const status = tab.dataset.reviewFilter;
        const count = items.filter((item) => item.dataset.status === status).length;
        tab.textContent = `${labels[status]} ${count}`;
      });
    };
    const showReviewEmptyState = () => {
      activeReviewId = "";
      items.forEach((node) => node.classList.remove("active"));
      document.getElementById("review-title").textContent = "暂无需审核任务";
      document.getElementById("review-meta").textContent = "当前审核队列已清空";
      document.getElementById("review-video-stage").style.background = "linear-gradient(155deg,#edeaf5,#dcd6eb)";
      document.getElementById("video-brand").textContent = "审核队列";
      document.getElementById("review-copy").textContent = "暂无\n需审核任务";
      document.getElementById("review-product").textContent = "通过素材已转入素材库";
      document.getElementById("trace-shot").textContent = "暂无";
      document.getElementById("trace-component").textContent = "暂无";
      document.getElementById("trace-return").textContent = "暂无";
      document.querySelectorAll("[data-shot]").forEach((button) => {
        button.classList.remove("selected-shot", "risk");
        button.innerHTML = "暂无<br>任务";
      });
      document.getElementById("risk-box").hidden = true;
      document.getElementById("brand-check").checked = true;
      document.getElementById("brand-check-tip").textContent = "暂无待检查内容";
      document.getElementById("brand-check-tip").classList.remove("warning-text");
      document.getElementById("return-step-text").textContent = "无需回传";
      document.getElementById("return-action-text").textContent = "暂无需审核任务";
      document.querySelector('[data-open-dialog="reject-dialog"]').disabled = true;
      document.querySelector('[data-open-dialog="approve-dialog"]').disabled = true;
    };
    const enableReviewActions = () => {
      document.querySelector('[data-open-dialog="reject-dialog"]').disabled = false;
      document.querySelector('[data-open-dialog="approve-dialog"]').disabled = false;
    };
    const updateReviewAssist = (id) => {
      const isRisk = id === "video02";
      const isReturned = id === "video02v2";
      const riskBox = document.getElementById("risk-box");
      document.getElementById("brand-check").checked = !isRisk;
      document.getElementById("brand-check-tip").textContent = isRisk ? "系统提示：建议检查镜头4" : "系统检查：通过";
      document.getElementById("brand-check-tip").classList.toggle("warning-text", isRisk);
      riskBox.hidden = !isRisk;
      riskBox.classList.toggle("resolved", false);
      document.getElementById("risk-title").textContent = "辅助提示：镜头4存在风险";
      document.getElementById("risk-desc").textContent = "Logo距离右边缘过近，且展示时间较短。";
      document.getElementById("return-step-text").textContent = isRisk ? "视频组件 · 品牌组件" : (isReturned ? "已回传新版分镜 · 镜头4" : "无需回传");
      document.getElementById("return-action-text").textContent = isRisk ? "仅返工镜头4，不影响其他镜头" : (isReturned ? "可再次审核，通过后进入素材库" : "可直接审核通过");
    };
    const renderVideoCard = (id, shot = 1) => {
      const data = reviewVideos[id];
      if (!data) return showReviewEmptyState();
      enableReviewActions();
      document.getElementById("review-video-stage").style.background = data.background;
      document.getElementById("video-brand").textContent = data.brand;
      document.getElementById("review-copy").textContent = data.shots[shot - 1];
      document.getElementById("review-product").textContent = `${data.product} · 镜头${shot}`;
      document.getElementById("trace-shot").textContent = shotTrace[shot - 1][0];
      document.getElementById("trace-component").textContent = shotTrace[shot - 1][1];
      document.getElementById("trace-return").textContent = shotTrace[shot - 1][2];
      document.querySelectorAll("[data-shot]").forEach((button) => {
        const number = Number(button.dataset.shot);
        const logoRisk = (id === "video02" && number === 4);
        button.classList.toggle("selected-shot", number === shot);
        button.classList.toggle("risk", logoRisk);
        button.innerHTML = `${logoRisk ? "⚠ " : ""}镜头${number}<br>${logoRisk ? "Logo风险" : shotTimes[number - 1]}`;
      });
      updateReviewAssist(id);
    };
    const selectItem = (item) => {
      items.forEach((node) => node.classList.toggle("active", node === item));
      const id = item.dataset.reviewItem;
      activeReviewId = id;
      document.getElementById("review-title").textContent = reviewVideos[id].title;
      document.getElementById("review-meta").textContent = reviewVideos[id].meta;
      renderVideoCard(id, 1);
      msg("review-message", `已打开${item.querySelector("strong").textContent}。`);
    };
    const applyReviewFilters = () => {
      updateReviewCounts();
      const keyword = document.getElementById("review-search").value.trim().toLowerCase();
      let count = 0;
      let firstVisible = null;
      const actionableCount = items.filter((item) => ["待审核", "待复审"].includes(item.dataset.status)).length;
      sessionStorage.setItem("reviewQueueCount", String(actionableCount));
      sessionStorage.setItem("reviewQueueEmpty", actionableCount === 0 ? "true" : "false");
      updateGlobalReviewState();
      items.forEach((item) => {
        const visible = item.dataset.status === reviewStatus && (!keyword || item.dataset.name.toLowerCase().includes(keyword));
        item.hidden = !visible;
        item.style.display = visible ? "" : "none";
        if (visible) { count += 1; firstVisible ||= item; }
      });
      document.getElementById("review-empty").hidden = count !== 0;
      if (actionableCount === 0) {
        showReviewEmptyState();
        msg("review-message", "暂无需审核任务。", "success");
        return;
      }
      const activeItem = document.querySelector(".review-item.active");
      if (firstVisible && (!activeItem || activeItem.hidden)) selectItem(firstVisible);
      msg("review-message", `当前筛选结果：${count}个审核任务。`);
    };
    items.forEach((item) => item.addEventListener("click", () => selectItem(item)));
    document.getElementById("review-search").addEventListener("input", applyReviewFilters);
    document.querySelectorAll("[data-review-filter]").forEach((button) => button.addEventListener("click", () => { setActiveReviewFilter(button.dataset.reviewFilter); applyReviewFilters(); }));
    document.querySelectorAll("[data-shot]").forEach((button) => button.addEventListener("click", () => {
      if (!activeReviewId || !reviewVideos[activeReviewId]) return msg("review-message", "暂无需审核任务。", "success");
      renderVideoCard(activeReviewId, Number(button.dataset.shot));
      msg("review-message", `已切换到${reviewVideos[activeReviewId].title}的镜头${button.dataset.shot}。`);
    }));
    document.getElementById("locate-shot4").addEventListener("click", () => document.querySelector('[data-shot="4"]').click());
    document.getElementById("video-play").addEventListener("click", (event) => { const playing = event.currentTarget.dataset.playing === "true"; event.currentTarget.dataset.playing = String(!playing); event.currentTarget.textContent = playing ? "▶ 播放　00:08 / 00:15" : "Ⅱ 暂停　00:09 / 00:15"; });
    document.getElementById("confirm-approve").addEventListener("click", () => {
      const active = document.querySelector(".review-item.active");
      if (!active) return;
      sessionStorage.setItem("reviewResult", "approved");
      sessionStorage.setItem("approvedReviewItem", active.dataset.reviewItem);
      active.dataset.status = "已入库";
      active.classList.remove("active");
      document.getElementById("approve-dialog").close();
      applyReviewFilters();
      msg("review-message", "审核通过，素材已转入素材库。", "success");
    });
    document.getElementById("reject-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const active = document.querySelector(".review-item.active");
      const returnStep = document.getElementById("reject-return-step").value;
      const returnedItem = document.querySelector('[data-review-item="video02v2"]');
      active.dataset.status = "返工处理";
      active.querySelector(".warning-text, .good, span:last-child").textContent = "已驳回 · 返工中";
      document.getElementById("reject-dialog").close();
      applyReviewFilters();
      msg("review-message", `返工已开始，问题已回传到：${returnStep}。`, "success");
      setTimeout(() => {
        returnedItem.dataset.status = "待复审";
        returnedItem.querySelector(".queue-meta").textContent = "新版分镜已回传";
        returnedItem.querySelector(".good, span:last-child").textContent = "风险已处理 · 待复审";
        setActiveReviewFilter("待复审");
        selectItem(returnedItem);
        renderVideoCard("video02v2", 4);
        applyReviewFilters();
        msg("review-message", "返工完成：v2新版分镜已回传，镜头4风险已处理，请再次审核。", "success");
      }, 1000);
    });
    renderVideoCard(activeReviewId, 1);
    applyReviewFilters();
  }

  if (document.body.dataset.page === "library") {
    const shell = document.getElementById("library-shell");
    const cards = [...document.querySelectorAll("[data-material]")];
    let status = "全部", type = "全部", product = "全部";
    const apply = () => { const key = document.getElementById("material-search").value.trim().toLowerCase(); cards.forEach((card) => card.hidden = !((!key || card.dataset.name.toLowerCase().includes(key)) && (status === "全部" || card.dataset.status === status) && (type === "全部" || card.dataset.type === type) && (product === "全部" || card.dataset.product === product))); };
    let activeMaterial = "video02";
    const materialTrace = {
      video01: { creative: "场景种草", landing: "清凉一夏活动页", review: "v1审核通过", demand: "夏季女装10条拉新视频", config: "10条视频 · 6镜/条", shot: "镜头1-6 · 全部通过", components: "商品库、分镜脚本、字幕组件", traceCreative: "场景种草 · 痛点开场型", traceReview: "v1审核通过", traceStatus: "已入库 · 可投放" },
      video02: { creative: "场景种草", landing: "清凉一夏活动页", review: "v1驳回 → v2通过", demand: "夏季女装10条拉新视频", config: "10条视频 · 6镜/条", shot: "镜头4 · Logo组件返工", components: "商品库、品牌资产库、分镜脚本", traceCreative: "场景种草 · 6镜脚本", traceReview: "v1驳回镜头4 → v2复审通过", traceStatus: "已入库 · 可投放" },
      sunscreen: { creative: "利益点直给", landing: "商品详情页", review: "v1审核通过", demand: "夏季防晒商品推广", config: "3条视频 · 6镜/条", shot: "镜头5 · 优惠提醒", components: "商品库、字幕组件、承接组件", traceCreative: "利益点直给 · 优惠开场", traceReview: "v1审核通过", traceStatus: "投放中" },
      combo: { creative: "多商品组合", landing: "活动页", review: "v1审核通过", demand: "通勤女装商品推广", config: "12张图片 · 主图模板", shot: "图片主视觉", components: "商品库、图片创意方案、品牌模板", traceCreative: "图片创意方案 · 商品主视觉", traceReview: "v1审核通过", traceStatus: "已入库 · 可投放" },
      coupon: { creative: "利益点直给", landing: "活动页", review: "v1审核通过", demand: "夏装新客优惠素材", config: "6条视频 · 6镜/条", shot: "镜头5 · 新客优惠", components: "活动文案、字幕组件、CTA组件", traceCreative: "利益点直给 · 优惠提醒", traceReview: "v1审核通过", traceStatus: "即将失效" },
      linen: { creative: "场景种草", landing: "商品详情页", review: "v1审核通过", demand: "亚麻西装场景主图", config: "图片任务 · 3:4", shot: "图片场景方案", components: "商品库、图片创意方案、品牌模板", traceCreative: "图片创意方案 · 场景图", traceReview: "v1审核通过", traceStatus: "已入库 · 可投放" }
    };
    const updateMaterialSelection = () => {
      const selected = cards.filter((card) => card.querySelector(".material-select").checked);
      cards.forEach((card) => card.classList.toggle("multi-selected", card.querySelector(".material-select").checked));
      document.getElementById("selected-material-count").textContent = `已选 ${selected.length} 个素材`;
      document.getElementById("launch-selected-materials").disabled = selected.length === 0;
    };
    const openCard = (card) => { activeMaterial = card.dataset.material; const trace = materialTrace[activeMaterial] || materialTrace.video02; cards.forEach((item) => item.classList.toggle("detail-active", item === card)); document.getElementById("material-detail-title").textContent = card.querySelector("strong").textContent; document.getElementById("material-detail-status").textContent = `${card.dataset.status} · 当前版本`; document.getElementById("material-product").textContent = card.dataset.product; document.getElementById("material-spec").textContent = card.dataset.type === "视频" ? "9:16 · 15秒" : "1:1 · 图片"; document.getElementById("material-creative").textContent = trace.creative; document.getElementById("material-landing").textContent = trace.landing; document.getElementById("material-review-record").textContent = trace.review; shell.classList.remove("detail-closed"); };
    cards.forEach((card) => card.addEventListener("click", () => openCard(card)));
    cards.forEach((card) => card.querySelector(".material-select").addEventListener("change", updateMaterialSelection));
    document.getElementById("material-search").addEventListener("input", apply);
    document.querySelectorAll("[data-material-filter]").forEach((button) => button.addEventListener("click", () => { status = button.dataset.materialFilter; document.querySelectorAll(".material-tab").forEach((tab) => tab.classList.toggle("active", tab === button)); apply(); }));
    document.getElementById("material-type-filter").addEventListener("click", (event) => { const values = ["全部", "视频", "图片"]; type = values[(values.indexOf(type) + 1) % values.length]; event.currentTarget.textContent = `${type}类型⌄`; apply(); });
    document.getElementById("material-product-filter").addEventListener("click", (event) => { const values = ["全部", "冰丝通勤衬衫", "法式收腰连衣裙"]; product = values[(values.indexOf(product) + 1) % values.length]; event.currentTarget.textContent = `${product}⌄`; apply(); });
    document.getElementById("material-sort").addEventListener("click", (event) => { cards.reverse().forEach((card) => document.getElementById("material-grid").appendChild(card)); event.currentTarget.textContent = event.currentTarget.textContent.includes("最近") ? "最早入库⌄" : "最近入库⌄"; });
    document.getElementById("close-material-detail").addEventListener("click", () => shell.classList.add("detail-closed"));
    document.getElementById("download-material").addEventListener("click", () => msg("material-message", "素材、封面图和字幕文件已准备完成（演示）。", "success"));
    document.getElementById("select-current-material").addEventListener("click", () => { const card = cards.find((item) => item.dataset.material === activeMaterial); const checkbox = card.querySelector(".material-select"); if (checkbox.disabled) return msg("material-message", "该素材正在投放，不能重复加入。", "error"); checkbox.checked = true; updateMaterialSelection(); msg("material-message", "当前素材已加入投放选择。", "success"); });
    document.getElementById("clear-material-selection").addEventListener("click", () => { cards.forEach((card) => card.querySelector(".material-select").checked = false); updateMaterialSelection(); });
    document.getElementById("launch-selected-materials").addEventListener("click", () => { const ids = cards.filter((card) => card.querySelector(".material-select").checked).map((card) => card.dataset.material); sessionStorage.setItem("launchSelectedAssets", JSON.stringify(ids)); go("07-launch-center.html"); });
    document.getElementById("reuse-material").addEventListener("click", () => { sessionStorage.setItem("agentDraft", `基于${document.getElementById("material-detail-title").textContent}创建改版`); go("02-agent-workbench.html"); });
    updateMaterialSelection();
  }

  if (document.body.dataset.page === "launch") {
    const assetCatalog = {
      video01: { code: "01", name: "冰丝通勤衬衫", meta: "视频01 · v1 · 9:16 · 15秒", status: "审核通过" },
      video02: { code: "02", name: "法式收腰连衣裙", meta: "视频02 · v2 · 9:16 · 15秒", status: "复审通过" },
      combo: { code: "图", name: "通勤女装组合主图", meta: "图片 · v1 · 1:1", status: "审核通过" },
      linen: { code: "图", name: "亚麻西装场景主图", meta: "图片 · v1 · 3:4", status: "审核通过" },
      coupon: { code: "优", name: "夏装新客优惠视频", meta: "视频 · v1 · 9:16 · 15秒", status: "2天后失效" }
    };
    let selectedAssetIds = ["video01", "video02"];
    try { const savedAssets = JSON.parse(sessionStorage.getItem("launchSelectedAssets")); if (Array.isArray(savedAssets) && savedAssets.length) selectedAssetIds = savedAssets.filter((id) => assetCatalog[id]); } catch (error) {}
    const renderSelectedAssets = () => {
      const container = document.getElementById("selected-assets");
      container.innerHTML = "";
      selectedAssetIds.forEach((id) => {
        const asset = assetCatalog[id];
        const row = document.createElement("div");
        row.className = "asset-row";
        row.innerHTML = `<span class="asset-poster">${asset.code}</span><div><strong>${asset.name}</strong><div class="product-meta">${asset.meta}</div></div><span class="${asset.status.includes("失效") ? "warning-text" : "good"}">${asset.status}</span>`;
        const remove = document.createElement("button");
        remove.className = "remove-asset";
        remove.type = "button";
        remove.textContent = "×";
        remove.addEventListener("click", () => { selectedAssetIds = selectedAssetIds.filter((assetId) => assetId !== id); renderSelectedAssets(); });
        row.appendChild(remove);
        container.appendChild(row);
      });
      const count = selectedAssetIds.length;
      document.getElementById("launch-asset-count").textContent = `${count}个`;
      document.getElementById("summary-asset-count").textContent = `${count}个`;
      document.getElementById("launch-bind-count").textContent = `${count}个素材 · ${Math.max(count, 1)}个商品 · 1个任务`;
      document.getElementById("precheck-result").textContent = count ? `${count}个素材均已通过，可以发布` : "请至少选择一个素材";
      document.getElementById("precheck-result").className = count ? "good" : "warning-text";
      document.getElementById("publish-asset-text").textContent = `将${count}个素材发布到模拟短视频信息流，不会产生真实费用。`;
      document.getElementById("publish-launch").disabled = count === 0;
      sessionStorage.setItem("launchSelectedAssets", JSON.stringify(selectedAssetIds));
    };
    document.querySelector('[data-open-dialog="asset-picker-dialog"]').addEventListener("click", () => {
      document.querySelectorAll('#asset-picker-dialog input[type="checkbox"]').forEach((input) => { input.checked = selectedAssetIds.includes(input.value); });
      msg("asset-picker-message", "");
    });
    document.getElementById("confirm-add-assets").addEventListener("click", () => {
      const chosen = [...document.querySelectorAll('#asset-picker-dialog input[type="checkbox"]:checked')].map((input) => input.value);
      if (!chosen.length) return msg("asset-picker-message", "请至少选择一个素材。", "error");
      selectedAssetIds = chosen;
      renderSelectedAssets();
      document.getElementById("asset-picker-dialog").close();
      msg("launch-message", `已更新为${chosen.length}个投放素材。`, "success");
    });
    document.getElementById("launch-config-form").addEventListener("submit", (event) => { event.preventDefault(); const name = document.getElementById("launch-name-input").value.trim(); const goal = document.getElementById("launch-goal-input").value; const budget = document.getElementById("launch-budget-input").value; if (!name || !budget) return msg("launch-message", "请填写投放名称和预算。", "error"); document.getElementById("launch-name-title").textContent = name; document.getElementById("config-goal").textContent = goal; document.getElementById("config-budget").textContent = `每日¥${Number(budget).toLocaleString()} · 总计¥${(Number(budget) * 7).toLocaleString()}`; document.getElementById("launch-config-dialog").close(); msg("launch-message", "投放配置已更新并重新检查通过。", "success"); });
    document.getElementById("save-launch-draft").addEventListener("click", () => { sessionStorage.setItem("launchDraft", "saved"); document.getElementById("launch-status").textContent = "草稿已保存"; msg("launch-message", "投放草稿已保存。", "success"); });
    document.getElementById("confirm-publish").addEventListener("click", () => { document.getElementById("publish-dialog").close(); const button = document.getElementById("publish-launch"); button.textContent = "发布中…"; button.disabled = true; document.getElementById("launch-status").textContent = "发布中"; setTimeout(() => { sessionStorage.setItem("launchStatus", "running"); document.getElementById("launch-status").textContent = "投放中"; document.getElementById("precheck-result").textContent = "投放已开始，模拟数据正在回流"; document.getElementById("launch-step-check").className = "launch-step done"; document.getElementById("launch-step-publish").className = "launch-step done"; document.getElementById("launch-step-publish").textContent = "✓ 已发布"; button.disabled = false; button.textContent = "查看详细数据"; button.removeAttribute("data-open-dialog"); button.onclick = () => go("08-data-analysis.html"); msg("launch-message", "模拟投放已成功发布。", "success"); }, 700); });
    renderSelectedAssets();
  }

  if (document.body.dataset.page === "data") {
    const datasets = { all:["¥24,600","128,000","4,620","3.61%","186","4.03%"], video01:["¥13,000","70,000","2,870","4.10%","124","4.32%"], video02:["¥11,600","58,000","1,750","3.02%","62","3.54%"] };
    const showData = (key) => { const value = datasets[key]; ["metric-cost","metric-view","metric-click","metric-ctr","metric-conversion","metric-cvr"].forEach((id,index) => document.getElementById(id).textContent = value[index]); document.querySelectorAll("[data-data-row]").forEach((row) => row.hidden = key !== "all" && row.dataset.dataRow !== key); };
    let asset = "all";
    document.getElementById("asset-data-filter").addEventListener("click", (event) => { const values = ["all","video01","video02"]; asset = values[(values.indexOf(asset)+1)%values.length]; event.currentTarget.textContent = asset === "all" ? "全部素材⌄" : `${asset === "video01" ? "视频01" : "视频02"}⌄`; showData(asset); msg("data-message", "已更新当前素材筛选范围。"); });
    document.getElementById("product-data-filter").addEventListener("click", (event) => { const values = ["全部商品⌄","冰丝通勤衬衫⌄","法式收腰连衣裙⌄"]; const index = (values.indexOf(event.currentTarget.textContent)+1)%values.length; event.currentTarget.textContent = values[index]; msg("data-message", `已选择：${values[index].replace("⌄","")}`); });
    document.getElementById("date-data-filter").addEventListener("click", (event) => { event.currentTarget.textContent = event.currentTarget.textContent.includes("5日") ? "最近3天⌄" : "7月5日—12日⌄"; msg("data-message", "时间范围已更新。" ); });
    document.getElementById("export-data").addEventListener("click", () => msg("data-message", "数据导出成功", "success"));
    const returnToAgent = (draft) => { sessionStorage.setItem("agentDraft", draft); go("02-agent-workbench.html"); };
    document.getElementById("create-control-test").addEventListener("click", () => returnToAgent("基于夏季女装投放数据创建对照改版：保持商品不变，只测试开场文案。"));
    document.getElementById("discuss-data").addEventListener("click", () => returnToAgent("请帮我分析视频01与视频02的表现差异，并注意不要做未经验证的因果归因。"));
    const reviewStorageKey = "summerCampaignReviewNote";
    const renderReviewNote = (record) => {
      document.getElementById("saved-review-empty").hidden = !!record;
      document.getElementById("saved-review-note").hidden = !record;
      if (!record) return;
      document.getElementById("saved-review-text").textContent = record.note;
      document.getElementById("saved-review-time").textContent = record.time;
      document.getElementById("review-note-input").value = record.note;
    };
    let savedReview = null;
    try { savedReview = JSON.parse(localStorage.getItem(reviewStorageKey)); } catch (error) { try { savedReview = JSON.parse(sessionStorage.getItem(reviewStorageKey)); } catch (sessionError) {} }
    renderReviewNote(savedReview);
    document.getElementById("save-review").addEventListener("click", () => {
      const note = document.getElementById("review-note-input").value.trim();
      if (!note) return msg("data-message", "请先填写复盘备注。", "error");
      const record = { note, time: "刚刚", campaign: "夏季女装新客拉新第一轮", author: "林晓", confidence: "初步观察" };
      try { localStorage.setItem(reviewStorageKey, JSON.stringify(record)); } catch (error) { sessionStorage.setItem(reviewStorageKey, JSON.stringify(record)); }
      renderReviewNote(record);
      msg("data-message", "复盘备注已保存，可从页面顶部“复盘记录”打开。", "success");
    });
  }
})();
