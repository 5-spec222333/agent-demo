(function () {
  const go = (url) => { window.location.href = url; };
  const setMessage = (id, text, type = "") => {
    const node = document.getElementById(id);
    if (!node) return;
    node.textContent = text;
    node.className = `form-message ${type}`;
  };

  document.querySelectorAll("[data-href]").forEach((button) => button.addEventListener("click", () => go(button.dataset.href)));
  document.querySelectorAll("[data-conversation]").forEach((button) => button.addEventListener("click", () => {
    go(`02-agent-workbench.html?conversation=${encodeURIComponent(button.dataset.conversation)}`);
  }));
  document.querySelectorAll("[data-open-dialog]").forEach((button) => button.addEventListener("click", () => document.getElementById(button.dataset.openDialog)?.showModal()));
  document.querySelectorAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => button.closest("dialog")?.close()));
  const updateGlobalRecentConversation = () => {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem("agentWorkbenchCurrentConversation")); } catch (error) {}
    const hasConversation = !!(saved && saved.started);
    document.querySelectorAll('[data-conversation="current"]').forEach((button) => {
      button.hidden = !hasConversation;
      button.style.display = hasConversation ? "" : "none";
      if (hasConversation) button.textContent = saved.title || "夏季女装10条拉新视频";
    });
    document.querySelectorAll(".recent-empty").forEach((item) => {
      item.hidden = hasConversation;
      item.style.display = hasConversation ? "none" : "";
    });
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

  if (document.body.dataset.page === "plan") {
    const stepOrder = ["requirement", "selection-strategy", "product-list", "image-creative", "video-structure", "storyboard-script", "video-components", "task-config"];
    const stepMeta = {
      requirement: { label: "需求理解", status: "需求理解待确认", next: "确认需求后，Agent将生成选品策略。" },
      "selection-strategy": { label: "选品策略", status: "选品策略待确认", next: "确认策略后，Agent将生成商品 List。" },
      "product-list": { label: "商品 List", status: "商品清单待确认", next: "确认商品后，Agent将生成图片创意方案。" },
      "image-creative": { label: "图片创意方案", status: "图片创意方案待确认", next: "确认图片方案后，Agent将生成视频创意结构。" },
      "video-structure": { label: "视频创意结构", status: "视频创意结构待确认", next: "确认视频结构后，Agent将生成分镜脚本。" },
      "storyboard-script": { label: "分镜脚本", status: "分镜脚本待确认", next: "确认分镜后，Agent将生成视频组件。" },
      "video-components": { label: "视频组件", status: "视频组件待确认", next: "确认组件后，Agent将生成任务配置。" },
      "task-config": { label: "配置与任务确认", status: "任务配置待确认", next: "确认任务配置后，将进入任务中心生产。" }
    };
    const panels = [...document.querySelectorAll("[data-plan-step]")];
    const tabs = [...document.querySelectorAll("[data-plan-tab]")];
    const showStep = (step) => {
      const current = stepOrder.includes(step) ? step : "requirement";
      const currentIndex = stepOrder.indexOf(current);
      panels.forEach((panel) => { panel.hidden = panel.dataset.planStep !== current; });
      tabs.forEach((tab) => {
        const tabIndex = stepOrder.indexOf(tab.dataset.planTab);
        tab.classList.toggle("current", tab.dataset.planTab === current);
        tab.classList.toggle("done", tabIndex < currentIndex);
        const number = tabIndex + 1;
        tab.textContent = `${tabIndex < currentIndex ? "✓" : number} ${stepMeta[tab.dataset.planTab].label}`;
      });
      document.getElementById("plan-status").textContent = stepMeta[current].status;
      document.getElementById("summary-step").textContent = `当前步骤：${stepMeta[current].label}`;
      document.getElementById("summary-artifact").textContent = stepMeta[current].label;
      document.getElementById("summary-next").textContent = stepMeta[current].next;
      const url = new URL(window.location.href);
      url.searchParams.set("step", current);
      window.history.replaceState({}, "", url);
    };
    tabs.forEach((tab) => tab.addEventListener("click", () => showStep(tab.dataset.planTab)));
    document.querySelectorAll("[data-plan-goto]").forEach((button) => button.addEventListener("click", () => showStep(button.dataset.planGoto)));
    const reviewDialog = document.getElementById("plan-review-dialog");
    const reviewTitle = document.getElementById("plan-review-title");
    const reviewText = document.getElementById("plan-review-text");
    const reviewSchema = document.getElementById("plan-review-schema");
    const reviewMessage = document.getElementById("plan-review-message");
    let activeReviewItem = null;
    let activeReviewMode = "text";
    const itemTitle = (item) => item.querySelector("strong")?.textContent.trim() || "当前项目";
    const itemStep = (item) => item.closest("[data-plan-step]")?.dataset.planStep || "";
    const schemaFields = (item) => {
      const step = itemStep(item);
      const spans = [...item.querySelectorAll("span")];
      const meta = item.querySelector(".product-meta")?.textContent.trim() || "";
      const recommend = item.querySelector(".recommend")?.textContent.trim() || "";
      if (step === "product-list") return [
        { label: "推荐理由", value: spans[0]?.textContent.trim() || "" },
        { label: "主卖点", value: spans[1]?.textContent.trim() || "" },
        { label: "创意方向", value: spans[2]?.textContent.trim() || "" },
        { label: "承接页", value: spans[3]?.textContent.trim() || "" }
      ];
      if (step === "image-creative") return [
        { label: "用途", value: meta },
        { label: "方案细节", value: recommend }
      ];
      if (step === "video-structure") return [
        { label: "结构", value: meta },
        { label: "适用商品", value: recommend }
      ];
      if (step === "storyboard-script") return [
        { label: "作用", value: spans[0]?.textContent.trim() || "" },
        { label: "画面", value: spans[1]?.textContent.trim() || "" },
        { label: "字幕/口播", value: spans[2]?.textContent.trim() || "" },
        { label: "时长", value: spans[3]?.textContent.trim() || "" }
      ];
      if (step === "video-components") return [
        { label: "包含内容", value: meta },
        { label: "来源/用途", value: recommend }
      ];
      return [];
    };
    const storyboardRows = () => [...document.querySelectorAll('[data-plan-step="storyboard-script"] .task-table-row')].filter((row) => !row.classList.contains("task-table-head"));
    const storyboardFields = () => storyboardRows().flatMap((row, index) => {
      const spans = [...row.querySelectorAll("span")];
      const name = row.querySelector("strong")?.textContent.trim() || `镜头${index + 1}`;
      return [
        { label: `${name} 作用`, value: spans[0]?.textContent.trim() || "" },
        { label: `${name} 画面`, value: spans[1]?.textContent.trim() || "" },
        { label: `${name} 字幕/口播`, value: spans[2]?.textContent.trim() || "" },
        { label: `${name} 时长`, value: spans[3]?.textContent.trim() || "" }
      ];
    });
    const renderSchema = (fields, readonly = true) => {
      reviewSchema.innerHTML = "";
      fields.forEach((field) => {
        const row = document.createElement("label");
        row.className = "schema-field-row";
        row.innerHTML = `<span>${field.label}</span><textarea ${readonly ? "readonly" : ""}>${field.value}</textarea>`;
        reviewSchema.appendChild(row);
      });
    };
    const currentSchemaValues = () => [...reviewSchema.querySelectorAll(".schema-field-row")].map((row) => ({
      label: row.querySelector("span").textContent.trim(),
      value: row.querySelector("textarea").value.trim()
    }));
    const regeneratedValue = (field, title) => {
      const step = itemStep(activeReviewItem);
      const cleanTitle = title.replace(/ · .*/, "").trim();
      const options = {
        "推荐理由": ["夏季通勤需求强", "新客理解成本低", "价格门槛适合拉新", "卖点清晰易转化"],
        "主卖点": ["清爽、不闷、显瘦", "轻薄、防晒、百搭", "显高、修饰腿型", "优惠、易搭、通勤"],
        "创意方向": ["场景种草", "通勤痛点", "利益直给", "搭配对比"],
        "承接页": ["商品详情页", "清凉一夏活动页", "夏装专区页"],
        "用途": ["用于开头吸引镜头", "用于商品展示镜头", "用于卖点说明镜头", "用于结尾转化镜头"],
        "方案细节": ["浅色背景，突出上身效果", "通勤场景，画面干净清爽", "短句卖点，信息不超过两层", "商品居中，保留CTA空间"],
        "结构": ["痛点 → 商品 → 卖点 → 场景 → CTA", "优惠 → 展示 → 理由 → CTA", "普通穿法 → 优化搭配 → 对比 → CTA"],
        "适用商品": ["通勤衬衫、防晒开衫", "连衣裙、通勤套装", "半身裙、T恤", "阔腿裤、亚麻西装"],
        "作用": ["痛点吸引", "商品出现", "卖点解释", "场景证明", "优惠提醒", "转化引导"],
        "画面": ["高温通勤场景", "模特上身展示", "面料与版型特写", "办公室通勤画面", "商品价格信息", "商品详情页入口"],
        "字幕/口播": ["30°C通勤怎么穿？", "清爽不闷，还显瘦", "轻薄透气，不贴身", "上班穿也干净利落", "新客限时优惠", "点击查看同款"],
        "时长": ["0-2s", "2-5s", "5-8s", "8-11s", "11-13s", "13-15s"],
        "包含内容": ["商品图、标题、价格、卖点", "模特图、场景图、商品特写", "字幕、口播、CTA文案", "TTS配音、BGM", "Logo、品牌色、字体", "详情页、活动页、跳转按钮"],
        "来源/用途": ["来源：商品库", "来源：素材库", "来源：分镜脚本", "来源：频道规则", "来源：品牌资产库", "来源：承接页配置"]
      };
      const list = options[field.label] || [field.value];
      const seed = (cleanTitle.length + field.label.length + step.length) % list.length;
      return list[seed];
    };
    const itemDetail = (item) => {
      return [...item.querySelectorAll(".product-meta, .recommend")].map((node) => node.textContent.trim()).join("\n");
    };
    const applyItemText = (item, text) => {
      const target = item.querySelector(".product-meta") || item.querySelector(".recommend");
      if (target) target.textContent = text;
    };
    const applyItemSchema = (item, values) => {
      const step = itemStep(item);
      if (step === "storyboard-script") {
        const rows = storyboardRows();
        rows.forEach((row, rowIndex) => {
          const rowValues = values.slice(rowIndex * 4, rowIndex * 4 + 4);
          row.querySelectorAll("span").forEach((span, index) => {
            if (rowValues[index]) span.textContent = rowValues[index].value;
          });
          row.classList.add("manual-updated");
        });
        return;
      }
      if (step === "product-list") {
        item.querySelectorAll("span").forEach((span, index) => {
          if (values[index]) span.textContent = values[index].value;
        });
        return;
      }
      const meta = item.querySelector(".product-meta");
      const recommend = item.querySelector(".recommend");
      if (meta && values[0]) meta.textContent = values[0].value;
      if (recommend && values[1]) recommend.textContent = values[1].value;
    };
    const openReview = (item) => {
      activeReviewItem = item;
      const fields = itemStep(item) === "storyboard-script" ? storyboardFields() : schemaFields(item);
      reviewTitle.textContent = itemStep(item) === "storyboard-script" ? "审核修改：整条分镜脚本" : `审核修改：${itemTitle(item)}`;
      activeReviewMode = fields.length ? "schema" : "text";
      reviewText.hidden = activeReviewMode === "schema";
      reviewSchema.hidden = activeReviewMode !== "schema";
      if (activeReviewMode === "schema") {
        renderSchema(fields, true);
      } else {
        reviewText.value = itemDetail(item);
        reviewText.readOnly = true;
      }
      reviewMessage.textContent = "";
      reviewMessage.className = "form-message";
      reviewDialog.showModal();
    };
    document.querySelectorAll('[data-plan-step="selection-strategy"] .product-card, [data-plan-step="product-list"] .task-table-row, [data-plan-step="image-creative"] .product-card, [data-plan-step="video-structure"] .product-card, [data-plan-step="storyboard-script"] .task-table-row, [data-plan-step="video-components"] .product-card').forEach((item) => {
      item.classList.add("plan-review-item");
      item.title = "点击审核修改";
      item.addEventListener("click", (event) => {
        if (event.target.closest("input, label")) return;
        openReview(item);
      });
    });
    const structureInputs = [...document.querySelectorAll(".structure-count-input")];
    const updateStructureCount = () => {
      const total = structureInputs.reduce((sum, input) => sum + Number(input.value || 0), 0);
      document.getElementById("video-structure-count").textContent = `已分配 ${total}/10 条`;
      const ok = total === 10;
      setMessage("video-structure-message", ok ? "当前合计10条，可以进入下一步。" : "三类创意结构合计必须为10条。", ok ? "success" : "error");
      document.querySelector('[data-plan-goto="storyboard-script"]').disabled = !ok;
    };
    structureInputs.forEach((input) => input.addEventListener("input", updateStructureCount));
    updateStructureCount();
    document.getElementById("plan-regenerate")?.addEventListener("click", () => {
      if (!activeReviewItem) return;
      const title = itemTitle(activeReviewItem);
      if (activeReviewMode === "schema") {
        const regenerated = itemStep(activeReviewItem) === "storyboard-script"
          ? [
            { label: "镜头1 作用", value: "痛点吸引" }, { label: "镜头1 画面", value: "高温通勤出门前" }, { label: "镜头1 字幕/口播", value: "30°C通勤，怎么穿才清爽？" }, { label: "镜头1 时长", value: "0-2s" },
            { label: "镜头2 作用", value: "商品出现" }, { label: "镜头2 画面", value: "模特上身冰丝衬衫" }, { label: "镜头2 字幕/口播", value: "冰丝面料，清爽不贴身" }, { label: "镜头2 时长", value: "2-5s" },
            { label: "镜头3 作用", value: "卖点解释" }, { label: "镜头3 画面", value: "面料和版型特写" }, { label: "镜头3 字幕/口播", value: "透气、不闷、不显臃肿" }, { label: "镜头3 时长", value: "5-8s" },
            { label: "镜头4 作用", value: "场景证明" }, { label: "镜头4 画面", value: "办公室与地铁通勤" }, { label: "镜头4 字幕/口播", value: "上班穿也干净利落" }, { label: "镜头4 时长", value: "8-11s" },
            { label: "镜头5 作用", value: "优惠提醒" }, { label: "镜头5 画面", value: "商品与新客价信息" }, { label: "镜头5 字幕/口播", value: "新客限时优惠" }, { label: "镜头5 时长", value: "11-13s" },
            { label: "镜头6 作用", value: "转化引导" }, { label: "镜头6 画面", value: "商品详情页入口" }, { label: "镜头6 字幕/口播", value: "点击查看同款" }, { label: "镜头6 时长", value: "13-15s" }
          ]
          : currentSchemaValues().map((field) => ({
            label: field.label,
            value: regeneratedValue(field, title)
          }));
        renderSchema(regenerated, false);
        reviewMessage.textContent = itemStep(activeReviewItem) === "storyboard-script" ? "AI已按整条视频上下文重新生成6个分镜。" : "AI已在Schema框架内重新生成，可直接保存或继续修改字段。";
      } else {
        reviewText.readOnly = false;
        reviewText.value = "优先选择新客理解成本低、卖点直观、承接链路清楚的商品。";
        reviewMessage.textContent = "AI已重新生成文本，可直接保存或继续手动调整。";
      }
      reviewMessage.className = "form-message success";
    });
    document.getElementById("plan-manual-edit")?.addEventListener("click", () => {
      if (activeReviewMode === "schema") {
        reviewSchema.querySelectorAll("textarea").forEach((input) => { input.readOnly = false; });
        reviewSchema.querySelector("textarea")?.focus();
        reviewMessage.textContent = "已进入人工修改，可在Schema字段内直接增删文字。";
      } else {
        reviewText.readOnly = false;
        reviewText.focus();
        reviewMessage.textContent = "已进入人工修改，可直接增删上方文字。";
      }
      reviewMessage.className = "form-message success";
    });
    document.getElementById("plan-save-edit")?.addEventListener("click", () => {
      if (!activeReviewItem) return;
      if (activeReviewMode === "schema") applyItemSchema(activeReviewItem, currentSchemaValues());
      else applyItemText(activeReviewItem, reviewText.value.trim());
      activeReviewItem.classList.add("manual-updated");
      reviewMessage.textContent = "已保存到当前方案项。";
      reviewMessage.className = "form-message success";
    });
    showStep(new URLSearchParams(window.location.search).get("step"));
  }

  if (document.body.dataset.page === "tasks") {
    const shell = document.getElementById("task-shell");
    const rows = [...document.querySelectorAll("[data-task]")];
    let activeFilter = "全部";
    let typeFilter = "全部";
    let statusFilter = "全部";
    const typeSelect = document.getElementById("task-type-filter");
    const statusSelect = document.getElementById("task-status-filter");
    const applyTaskFilters = () => {
      const keyword = document.getElementById("task-search").value.trim().toLowerCase();
      let visibleCount = 0;
      rows.forEach((row) => {
        const matchText = !keyword || row.dataset.name.toLowerCase().includes(keyword);
        const matchActive = activeFilter === "全部" || (activeFilter === "异常" ? row.dataset.exception === "true" : row.dataset.status === activeFilter);
        const matchType = typeFilter === "全部" || row.dataset.type === typeFilter;
        const matchStatus = statusFilter === "全部" || row.dataset.status === statusFilter;
        const visible = matchText && matchActive && matchType && matchStatus;
        row.hidden = !visible;
        row.style.display = visible ? "" : "none";
        if (visible) visibleCount += 1;
      });
      setMessage("task-message", `当前筛选结果：${visibleCount}个任务。`);
    };
    document.getElementById("task-search").addEventListener("input", applyTaskFilters);
    document.querySelectorAll("[data-task-filter]").forEach((button) => button.addEventListener("click", () => {
      activeFilter = button.dataset.taskFilter;
      typeFilter = "全部";
      statusFilter = "全部";
      typeSelect.value = "全部";
      statusSelect.value = "全部";
      document.querySelectorAll(".task-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.taskFilter === activeFilter));
      applyTaskFilters();
    }));
    typeSelect.addEventListener("change", (event) => {
      typeFilter = event.currentTarget.value;
      activeFilter = "全部";
      statusFilter = "全部";
      statusSelect.value = "全部";
      document.querySelectorAll(".task-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.taskFilter === "全部"));
      applyTaskFilters();
    });
    statusSelect.addEventListener("change", (event) => {
      statusFilter = event.currentTarget.value;
      activeFilter = "全部";
      document.querySelectorAll(".task-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.taskFilter === "全部"));
      applyTaskFilters();
    });
    document.getElementById("task-date-filter").addEventListener("click", () => setMessage("task-message", "当前展示最近7天创建的任务。"));

    const taskData = {
      summer: ["夏季女装10条拉新视频", "生产中 · 总体进度 8/10", "8条已进入审核队列，1条正在合成，1条因第4镜画面异常等待处理。"],
      qixi: ["七夕活动主图制作", "待审核 · 总体进度 20/20", "20张图片已完成生产，正在等待运营审核。"],
      coupon: ["新客优惠券视频改版", "生产中 · 总体进度 3/6", "3条视频已完成，另外3条正在继续生产。"],
      commute: ["通勤女装商品推广", "等待生产 · 总体进度 0/12", "任务已创建，正在等待进入生产队列。"],
      sunscreen: ["防晒开衫主图批量改版", "已完成 · 总体进度 12/12", "12张图片已审核并完成入库。"]
    };
    document.querySelectorAll("[data-open-task]").forEach((button) => button.addEventListener("click", () => {
      const data = taskData[button.dataset.openTask];
      document.getElementById("detail-title").textContent = data[0];
      document.getElementById("detail-status").textContent = data[1];
      document.getElementById("detail-summary").textContent = data[2];
      document.getElementById("summer-detail").hidden = button.dataset.openTask !== "summer";
      shell.classList.remove("detail-closed");
    }));
    document.getElementById("close-task-detail").addEventListener("click", () => shell.classList.add("detail-closed"));
    document.getElementById("retry-shot").addEventListener("click", (event) => {
      const retryButton = event.currentTarget;
      document.getElementById("retry-status").textContent = "局部重试中";
      document.getElementById("retry-status").className = "warning-text";
      document.getElementById("exception-result").textContent = "正在重新生成并质检第4镜，其他镜头保持不变。";
      retryButton.disabled = true;
      retryButton.textContent = "重试中…";
      setTimeout(() => {
        document.getElementById("retry-status").textContent = "重试成功";
        document.getElementById("retry-status").className = "good";
        document.getElementById("exception-result").textContent = "第4镜已重新生成并通过质检，当前视频已进入待审核状态。";
        document.getElementById("detail-status").textContent = "生产中 · 总体进度 9/10";
        document.getElementById("detail-summary").textContent = "9条已进入审核队列，剩余1条正在合成。";
        retryButton.textContent = "重试成功";
        const row = document.querySelector('[data-task="summer"]');
        row.dataset.exception = "false";
        const warningCell = row.querySelector(".warning-text");
        warningCell.textContent = "无";
        warningCell.className = "";
      }, 1000);
    });
  }
})();
