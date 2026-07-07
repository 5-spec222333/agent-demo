(function () {
  "use strict";

  let lastFocused = null;

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>'"]/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char];
    });
  }

  function statusClass(status) {
    if (["通过", "成功", "已确认", "已创建", "已入库", "可复用", "投放中", "已恢复"].includes(status)) return "status-good";
    if (["驳回", "部分失败", "失败"].includes(status)) return "status-bad";
    if (["自动重试", "技术处理", "降级", "待人工复核"].includes(status)) return "status-warn";
    return "status-neutral";
  }

  function status(status, detail) {
    return '<span class="status ' + statusClass(status) + '"><span aria-hidden="true"></span>' + esc(status) + (detail ? " · " + esc(detail) : "") + "</span>";
  }

  function sectionHeader(eyebrow, title, description, extra) {
    return '<div class="section-header"><div><p class="eyebrow">' + esc(eyebrow) + "</p><h2>" + esc(title) + "</h2>" + (description ? "<p>" + esc(description) + "</p>" : "") + "</div>" + (extra || "") + "</div>";
  }

  function gate(title, message, route, label) {
    return '<section class="gate"><span class="gate-icon" aria-hidden="true">↳</span><div><h3>' + esc(title) + "</h3><p>" + esc(message) + '</p></div><button class="button button-secondary" type="button" data-route="' + esc(route) + '">' + esc(label) + "</button></section>";
  }

  function empty(title, message) {
    return '<div class="empty-state"><span aria-hidden="true">◇</span><h3>' + esc(title) + "</h3><p>" + esc(message) + "</p></div>";
  }

  function fieldGrid(rows) {
    return '<dl class="field-grid">' + rows.map(function (row) {
      return "<div><dt>" + esc(row[0]) + "</dt><dd>" + esc(row[1]) + "</dd></div>";
    }).join("") + "</dl>";
  }

  function productVisual(product) {
    return '<div class="product-visual tone-' + esc(product.tone) + '" aria-hidden="true"><span class="hanger">⌁</span><b>' + esc(product.category) + "</b></div>";
  }

  function metric(value) {
    return new Intl.NumberFormat("zh-CN").format(value);
  }

  function openDrawer(options) {
    const drawer = document.getElementById("detail-drawer");
    const backdrop = document.getElementById("drawer-backdrop");
    lastFocused = document.activeElement;
    drawer.hidden = false;
    document.getElementById("drawer-eyebrow").textContent = options.eyebrow || "详情";
    document.getElementById("drawer-title").textContent = options.title;
    document.getElementById("drawer-body").innerHTML = options.body;
    backdrop.hidden = false;
    drawer.setAttribute("aria-hidden", "false");
    drawer.classList.add("is-open");
    document.getElementById("close-drawer").focus();
  }

  function closeDrawer() {
    const drawer = document.getElementById("detail-drawer");
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    drawer.hidden = true;
    document.getElementById("drawer-backdrop").hidden = true;
    if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
  }

  function trapFocus(event) {
    const drawer = document.getElementById("detail-drawer");
    if (!drawer.classList.contains("is-open")) return;
    if (event.key === "Escape") return closeDrawer();
    if (event.key !== "Tab") return;
    const focusable = Array.from(drawer.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')).filter(function (el) { return !el.disabled; });
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function toast(message) {
    const node = document.getElementById("toast");
    node.textContent = message;
    node.classList.add("is-visible");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { node.classList.remove("is-visible"); }, 2600);
    document.getElementById("live-region").textContent = message;
  }

  document.addEventListener("keydown", trapFocus);

  window.DEMO_UI = { esc, status, statusClass, sectionHeader, gate, empty, fieldGrid, productVisual, metric, openDrawer, closeDrawer, toast };
})();
