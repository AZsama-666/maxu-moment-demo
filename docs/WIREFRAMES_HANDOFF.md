# MAXU Moment Demo — 屏清单索引

> **UI 开稿请先看 [UI_PRODUCT_SPEC.md](./UI_PRODUCT_SPEC.md)**。  
> 本文档作路由 ↔ 源文件 ↔ Tab ↔ 优先级速查；**范围仅含 demo 已实现/占位页面**。

## 链接

| 资源 | URL |
|------|-----|
| **Figma 线框** | https://www.figma.com/design/0MZOzEUjLCSIUVR9aJ9pOS |
| **FigJam 用户流程** | https://www.figma.com/board/D1infAENGjlXpTuJRDqDiF |
| **Live Demo** | https://www.up9.life/ |

## 画板规范

- 手机帧：**390 × 844**
- 主色占位：`#12B89A`
- 视觉以 live demo 为准，线框作历史参考

## Tab Bar 显隐规则

**隐藏 Tab：** `/waiting*`、`/fulfill*`（买家）、`/done*`、`/pending-accept*`、`/profile/my-moments/launch/type`–`preview`

**显示 Tab：** 其余（含 `/supply/waiting`、`/supply/fulfill`、`/moment/:id`、`/launch/success/:id`）

## 优先级说明

| 级别 | 含义 |
|------|------|
| **P0** | 第一批高保真：买家 1V1 全链 + 供给发起/履约 |
| **P1** | 第二批：我的 Moment、管理、消息、组局 |
| **P2** | mock/壳层，对齐 demo 即可 |

## 屏清单 ↔ 路由 ↔ 源文件

| ID | 页面 | 路由 | 源文件 | Tab | 优先级 |
|----|------|------|--------|-----|--------|
| WF-001 | TabBar 显示 | 壳层 | `AppShell.tsx` | 显示 | — |
| WF-002 | TabBar 隐藏 | 壳层 | `AppShell.tsx` | 隐藏 | — |
| WF-010 | Moment 首页 | `/` | `HomePage.tsx` | 显示 | P0 |
| WF-011 | 首页空态 | `/` | `HomePage.tsx` | 显示 | P0 |
| WF-012 | TA 主页 | `/ta/:providerId` | `PlaceholderPages.tsx` | 显示 | P0 |
| WF-013 | Moment 详情 | `/moment/:id` | `DetailPage.tsx` | 显示 | P0 |
| WF-014 | 确认下单 | `/checkout/:id` | `CheckoutPage.tsx` | 显示 | P0 |
| WF-015 | Mock 支付 | `/pay/:id` | `PayPage.tsx` | 显示 | P0 |
| WF-016 | 等待确认 | `/pending-accept/:id` | `PendingAcceptPage.tsx` | 隐藏 | P1 |
| WF-017 | 买家等待室 booked | `/waiting/:id` | `WaitingPage.tsx` | 隐藏 | P0 |
| WF-018 | 买家等待室 pending | `/waiting/:id` | `WaitingPage.tsx` | 隐藏 | P0 |
| WF-019 | 语音履约（买家） | `/fulfill/voice/:id` | `FulfillVoicePage.tsx` | 隐藏 | P0 |
| WF-020 | 视频履约（买家） | `/fulfill/video/:id` | `FulfillVideoPage.tsx` | 隐藏 | P0 |
| WF-021 | 履约完成 | `/done/:id` | `DonePage.tsx` | 隐藏 | P0 |
| WF-022 | 我的订单 | `/profile/orders` | `OrdersPage.tsx` | 显示 | P0 |
| WF-023 | 组局详情 | `/group/:id` | `GroupDetailPage.tsx` | 显示 | P1 |
| WF-024 | 组局订单确认 | `/group-order/:id` | `GroupConfirmPage.tsx` | 显示 | P1 |
| WF-025 | 转约占位 | `/transfer/:id` | `TransferPlaceholderPage.tsx` | 显示 | P2 |
| WF-030 | 选择 SKU | `/profile/my-moments/launch/type` | `LaunchTypePage.tsx` | 隐藏 | P0 |
| WF-031 | 商品与定价 1v1 | `/launch/product` | `LaunchProductPage.tsx` | 隐藏 | P0 |
| WF-032 | 商品与定价 陪玩 | `/launch/product` | `LaunchProductPage.tsx` | 隐藏 | P0 |
| WF-033 | 履约设置 1v1 | `/launch/fulfillment` | `LaunchFulfillmentPage.tsx` | 隐藏 | P0 |
| WF-034 | 履约设置 陪玩 | `/launch/fulfillment` | `LaunchFulfillmentPage.tsx` | 隐藏 | P0 |
| WF-035 | 确认发布 | `/launch/preview` | `LaunchPreviewPage.tsx` | 隐藏 | P0 |
| WF-036 | 发布成功 | `/launch/success/:id` | `LaunchSuccessPage.tsx` | 显示 | P1 |
| WF-037 | 我的 Moment | `/profile/my-moments` | `MyMomentsPage.tsx` | 显示 | P1 |
| WF-038 | 我的 Moment 空态 | `/profile/my-moments` | `MyMomentsPage.tsx` | 显示 | P1 |
| WF-039 | 待处理任务 | `/profile/my-moments/tasks` | `SupplyTasksPage.tsx` | 显示 | P0 |
| WF-040 | 待处理任务 空态 | `/profile/my-moments/tasks` | `SupplyTasksPage.tsx` | 显示 | P0 |
| WF-041 | 管理 Moment | `/profile/my-moments/:id/manage` | `SupplyManagePage.tsx` | 显示 | P1 |
| WF-042 | 供给等待室 | `/supply/waiting/:id` | `supply/SupplyWaitingPage.tsx` | 显示 | P0 |
| WF-043 | 供给语音履约 | `/supply/fulfill/voice/:id` | `supply/SupplyFulfillVoicePage.tsx` | 显示 | P0 |
| WF-044 | 供给视频履约 | `/supply/fulfill/video/:id` | `supply/SupplyFulfillVideoPage.tsx` | 显示 | P0 |
| WF-050 | 消息 有提醒 | `/messages` | `MessagesPage.tsx` | 显示 | P1 |
| WF-051 | 消息 无提醒 | `/messages` | `MessagesPage.tsx` | 显示 | P1 |
| WF-052 | 我的 | `/profile` | `ProfilePage.tsx` | 显示 | P2 |
| WF-053 | 我的 产品 Tab | `/profile` | `ProfilePage.tsx` | 显示 | P2 |
| WF-054 | 主页 Feed | `/feed` | `FeedPage.tsx` | 显示 | P2 |
| WF-055 | 发布占位 | `/publish` | `PlaceholderPages.tsx` | 显示 | P2 |
| WF-056 | 分类页 | `/category/:key` | `PlaceholderPages.tsx` | 显示 | P2 |
| WF-057 | 404 | `*` | `PlaceholderPages.tsx` | 显示 | P2 |

**未单独列屏**：`/profile/my-moments/create` → 重定向到 `/launch/type`；`/home` → `/`。

## Figma 文件结构（Starter 3 页）

1. **Cover, Index & Components** — 封面、屏清单、WF 组件库
2. **Flows - Moment & Buy** — WF-010~024 买家链路
3. **Flows - Supply & Account** — WF-030~057 供给与账户

## 高保真建议

1. 先做 **P0**（WF-010~021 + WF-030~035 + WF-039~040 + WF-042~044）
2. 复用 Figma 内 `WF/TabBar`、`WF/PersonCard` 等组件升维
3. 对照 live demo 校验文案与区块顺序，勿改信息架构
