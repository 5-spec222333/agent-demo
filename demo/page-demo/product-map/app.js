(function () {
  "use strict";

  var data = window.PRODUCT_FRAMEWORK;
  var flowTrack = document.getElementById("flow-track");
  var applicationGrid = document.getElementById("application-grid");
  var accessStack = document.getElementById("access-stack");
  var capabilityStack = document.getElementById("capability-stack");
  var governanceStack = document.getElementById("governance-stack");

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function setActiveStage(stageId) {
    document.querySelectorAll(".flow-step").forEach(function (step) {
      step.classList.toggle("is-active", step.dataset.stageId === stageId);
    });
    document.querySelectorAll(".application-column").forEach(function (column) {
      column.classList.toggle("is-active", column.dataset.stageId === stageId);
    });
  }

  data.flow.forEach(function (stage) {
    var step = element("li", "flow-step", stage.label);
    step.dataset.stageId = stage.id;
    step.tabIndex = 0;
    step.setAttribute("role", "button");
    step.setAttribute("aria-label", "查看" + stage.label + "对应能力");
    step.addEventListener("click", function () { setActiveStage(stage.id); });
    step.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setActiveStage(stage.id);
      }
    });
    flowTrack.appendChild(step);
  });

  data.application.forEach(function (columnData) {
    var column = element("section", "application-column");
    column.dataset.stageId = columnData.stageId;
    column.appendChild(element("h3", "", columnData.title));

    var cards = element("div", "application-cards");
    columnData.cards.forEach(function (cardData) {
      var classes = ["application-card"];
      if (cardData.wide) classes.push("wide");
      if (cardData.tall) classes.push("tall");
      if (cardData.accent) classes.push("accent");
      cards.appendChild(element("div", classes.join(" "), cardData.label));
    });
    column.appendChild(cards);
    applicationGrid.appendChild(column);
  });

  data.access.forEach(function (label) {
    accessStack.appendChild(element("div", "foundation-card", label));
  });

  data.capabilities.forEach(function (groupData) {
    var group = element("section", "capability-group");
    group.appendChild(element("h3", "", groupData.title));
    var items = element("div", "capability-items");
    items.style.setProperty("--columns", groupData.columns);
    groupData.items.forEach(function (label) {
      items.appendChild(element("div", "foundation-card", label));
    });
    group.appendChild(items);
    capabilityStack.appendChild(group);
  });

  governanceStack.appendChild(element("h3", "", data.governance.title));
  data.governance.items.forEach(function (label) {
    governanceStack.appendChild(element("div", "foundation-card", label));
  });
})();
