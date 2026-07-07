(function () {
  const go = (url) => { window.location.href = url; };
  const message = (id, text, type = "") => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.className = `form-message ${type}`;
  };

  document.querySelectorAll("[data-open-dialog]").forEach((button) => {
    button.addEventListener("click", () => document.getElementById(button.dataset.openDialog)?.showModal());
  });
  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => button.closest("dialog")?.close());
  });

  function countdown(button) {
    if (button.disabled) return;
    let seconds = 60;
    button.disabled = true;
    button.textContent = `${seconds}s`;
    const timer = setInterval(() => {
      seconds -= 1;
      button.textContent = seconds > 0 ? `${seconds}s` : "获取验证码";
      if (seconds <= 0) { clearInterval(timer); button.disabled = false; }
    }, 1000);
  }
  document.querySelectorAll("[data-send-code]").forEach((button) => button.addEventListener("click", () => countdown(button)));

  if (document.body.dataset.page === "login") {
    const accountForm = document.getElementById("account-form");
    const codeForm = document.getElementById("code-form");
    const loginView = document.getElementById("login-view");
    const registerView = document.getElementById("register-view");

    document.querySelectorAll("[data-auth-view]").forEach((tab) => {
      tab.addEventListener("click", () => {
        const account = tab.dataset.authView === "account";
        accountForm.hidden = !account;
        codeForm.hidden = account;
        document.querySelectorAll("[data-auth-view]").forEach((item) => item.classList.toggle("active", item === tab));
      });
    });

    document.getElementById("toggle-password").addEventListener("click", (event) => {
      const input = document.getElementById("password");
      input.type = input.type === "password" ? "text" : "password";
      event.currentTarget.textContent = input.type === "password" ? "显示" : "隐藏";
    });

    accountForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const button = document.getElementById("login-button");
      button.disabled = true;
      button.textContent = "登录中…";
      setTimeout(() => {
        const ok = document.getElementById("account").value.trim() === "demo@agent.com" && document.getElementById("password").value === "123456";
        if (ok) go("01-workspace.html");
        else { message("account-message", "账号或密码错误，请使用页面中的演示账号。", "error"); button.disabled = false; button.textContent = "登录"; }
      }, 500);
    });

    codeForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const ok = document.getElementById("code-account").value.trim() && document.getElementById("login-code").value.trim();
      ok ? go("01-workspace.html") : message("code-message", "请填写账号和验证码。", "error");
    });

    document.getElementById("enterprise-login").addEventListener("click", () => {
      message("account-message", "企业身份验证成功，正在进入工作空间…", "success");
      setTimeout(() => go("01-workspace.html"), 500);
    });
    document.getElementById("show-register").addEventListener("click", () => { loginView.hidden = true; registerView.hidden = false; });
    document.getElementById("back-login").addEventListener("click", () => { registerView.hidden = true; loginView.hidden = false; });

    registerView.addEventListener("submit", (event) => {
      event.preventDefault();
      const filled = document.getElementById("register-name").value.trim() && document.getElementById("register-account").value.trim() && document.getElementById("register-code").value.trim();
      const samePassword = document.getElementById("register-password").value && document.getElementById("register-password").value === document.getElementById("register-confirm").value;
      const agreed = document.getElementById("register-agree").checked;
      if (!filled || !samePassword || !agreed) return message("register-message", "请完整填写信息、确认密码并同意协议。", "error");
      go("01-workspace.html");
    });

    document.getElementById("forgot-form").addEventListener("submit", (event) => {
      event.preventDefault();
      message("forgot-message", "密码已重置，请使用新密码登录。", "success");
      setTimeout(() => document.getElementById("forgot-dialog").close(), 700);
    });
    document.getElementById("invite-login-form").addEventListener("submit", (event) => {
      event.preventDefault();
      document.getElementById("invite-login-code").value.trim() ? go("01-workspace.html") : message("invite-login-message", "请输入团队邀请码。", "error");
    });
  }

  if (document.body.dataset.page === "workspace") {
    const list = document.getElementById("space-list");
    document.getElementById("workspace-search").addEventListener("input", (event) => {
      const keyword = event.target.value.trim().toLowerCase();
      let visible = 0;
      list.querySelectorAll(".space-card").forEach((card) => {
        const show = !keyword || card.dataset.search.toLowerCase().includes(keyword);
        card.hidden = !show;
        if (show) visible += 1;
      });
      message("workspace-message", visible ? "" : "没有找到匹配的工作空间。", visible ? "" : "error");
    });
    document.querySelectorAll("[data-enter-workspace]").forEach((button) => {
      button.addEventListener("click", () => {
        sessionStorage.setItem("demoWorkspace", button.dataset.enterWorkspace);
        go("02-agent-workbench.html");
      });
    });
    document.getElementById("logout").addEventListener("click", () => { sessionStorage.removeItem("demoWorkspace"); go("01-login.html"); });
    document.getElementById("pending-info").addEventListener("click", () => document.getElementById("pending-dialog").showModal());

    const appendPendingSpace = (name, meta) => {
      const card = document.createElement("div");
      card.className = "space-card disabled";
      card.dataset.search = `${name} ${meta}`;
      card.innerHTML = `<span class="space-logo">新</span><div><div class="space-name"></div><div class="space-meta"></div></div><span class="pending">权限审批中</span>`;
      card.querySelector(".space-name").textContent = name;
      card.querySelector(".space-meta").textContent = meta;
      list.appendChild(card);
    };
    document.getElementById("invite-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const code = document.getElementById("invite-code").value.trim();
      if (!code) return message("invite-message", "请输入邀请码。", "error");
      appendPendingSpace("邀请码加入的工作空间", `邀请码 ${code} · 申请成员`);
      document.getElementById("invite-dialog").close();
      message("workspace-message", "已提交加入申请，等待管理员审批。", "success");
    });
    document.getElementById("apply-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const name = document.getElementById("apply-name").value.trim();
      const reason = document.getElementById("apply-reason").value.trim();
      if (!name || !reason) return message("apply-message", "请填写工作空间名称和申请理由。", "error");
      appendPendingSpace(name, "申请成员 · 权限审批中");
      document.getElementById("apply-dialog").close();
      message("workspace-message", "申请已提交。", "success");
    });
  }
})();

