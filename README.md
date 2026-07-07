# Agent 广告素材生产平台：产品大图与 Demo

本项目先使用 HTML 产品大图梳理业务全景，再基于确认后的业务逻辑开发交互 Demo。

## 目录

```text
/
├─ AGENTS.md                  # 全项目共同规则
├─ README.md                  # 项目入口
├─ docs/
│  ├─ product-context.md      # 产品背景、主链路与风险基线
│  ├─ product-map-decisions.md # 产品大图结构与实施决策
│  └─ demo-decisions.md       # Demo 假设、状态与实施决策
├─ product-map/
│  ├─ AGENTS.md               # 产品大图专项规则
│  ├─ index.html              # 产品大图页面入口
│  ├─ styles.css              # 页面布局与视觉样式
│  ├─ app.js                  # 导航、筛选、详情和缩放交互
│  └─ data/product-map.js     # 结构化节点、状态和连线 Mock 数据
├─ demo/
│  ├─ AGENTS.md               # Demo 专项规则
│  ├─ index.html              # 可交互 Demo 入口
│  ├─ styles.css              # 页面视觉与响应式样式
│  ├─ app.js                  # 页面路由与交互
│  ├─ state-machine.js        # 集中状态机与前置闸门
│  └─ data/                   # 场景与集中 Mock 数据
```

## 推荐推进顺序

1. 在 `product-map/` 完成静态 HTML 产品全景图；
2. 确认主链路、状态机、异常流和数据流；
3. 将大图升级为可点击、可切换视图的交互大图；
4. 在 `demo/` 使用 Mock 数据实现贯穿式演示场景；
5. 最后再讨论真实模型、数据库和投放系统集成。

## 当前进度

`product-map/` 已完成第一版交互式产品全景大图；`demo/` 已实现“夏季女装生成 10 条拉新视频”的端到端可交互场景。两个入口均可直接离线打开。

Demo 覆盖 Agent 分阶段追问、选品与承接闸门、视频分镜、10 条批量队列、镜头级失败重试、审核驳回返工、素材版本、模拟投放、效果观察和策略沉淀。所有业务、模型和投放数据均为虚构 Mock。

## 给 Codex 的首个任务示例

在 `product-map/` 中开始：

> 阅读根目录和当前目录的 AGENTS.md，以及 docs/product-context.md。先输出产品大图的信息架构和页面草图，不要立刻写代码；将事实、推断和待确认项分开。

在产品逻辑确认后，可以继续：

> 根据已确认的信息架构，实现 product-map 的第一版 HTML 大图，并在浏览器中检查 1440px 和 1920px 布局。
