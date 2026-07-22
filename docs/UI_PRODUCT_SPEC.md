# MAXU Moment — UI 产品规格（Demo 对齐版）

> **给 UI 同事**：要粘贴飞书 wiki，直接用 **[UI_FEISHU_COPY.md](./UI_FEISHU_COPY.md)**（逐页文案版，无图）。  
> 本文作 Markdown 查阅；流程图见 [UI_MAIN_FLOWS.md](./UI_MAIN_FLOWS.md) · 屏清单见 [WIREFRAMES_HANDOFF.md](./WIREFRAMES_HANDOFF.md)

| 资源 | URL |
|------|-----|
| **Live Demo** | https://www.up9.life/ |
| **本地** | `cd moment-demo && npm install && npm run dev` |

---

## 1. 30 秒读懂

**Moment** = MAXU 体验型权益入口（替代原市集心智）。Demo 已跑通 **1V1 固定档期语音/视频** 全闭环；**组局**与**陪玩**为不同 SKU（组局按活动发现，陪玩归入 1V1 按人发现）。

| 项 | 值 |
|----|-----|
| 画板 | 390 × 844 |
| 主色占位 | `#12B89A` |
| 设计原则 | 对照 demo 点一遍再出稿；Figma 线框仅历史参考 |
| 禁用表达 | 市集、NFT、链上、漂流、陪聊、私密视频（demo 内个别「回到市集」→ 设计稿用 **回到 Moment**） |

---

## 2. 壳层与 Tab

来源：`src/components/AppShell.tsx`

**底部 Tab**：主页 `/feed` · 消息 `/messages` · **Moment** `/` · 我的 `/profile` · 右侧 **+** → `/publish`

**Tab 隐藏**（全屏沉浸）：

| 路径前缀 | 说明 |
|----------|------|
| `/waiting*` | 买家等待室 |
| `/fulfill*` | 买家履约（不含 `/supply/fulfill`） |
| `/done*` | 完成页 |
| `/pending-accept*` | 远档确认 |
| `/profile/my-moments/launch*` | 发起 4 步（type/product/fulfillment/preview） |

**Tab 仍显示**：`/supply/waiting`、`/supply/fulfill`、发布成功 `/launch/success/:id`、详情 `/moment/:id` 等其余路由。

> **双视角必做**：同一订单，买家走 `/waiting` + `/fulfill`，供给走 `/supply/waiting` + `/supply/fulfill`；供给履约结束回任务页，**不走**买家完成页。

---

## 3. 必点演示路径

### 路径 A — 买家 1V1（P0）

`/` → `/ta/:id` → `/moment/:id` → 选档 → `/checkout` → `/pay` → `/waiting` → `/fulfill/voice|video` → `/done`

1. 底部 **Moment** → 人卡 → TA 页 → 选 1V1 Moment  
2. 详情选时段 → **去下单** → **去支付** → **支付成功**  
3. 等待室 → **我已就位** → **双方已就位 · 开始履约**（或到点 **到点 · 进入履约**）  
4. 履约页倒计时结束或 **挂断** → 完成页

### 路径 B — 供给发起 + 履约（P0）

`/profile/my-moments` → 发起 4 步 → `/tasks` → `/supply/waiting` → `/supply/fulfill` → 回 `/tasks`

1. **我的** → **我的 Moment** → **发起第一个 / + 发起新的**  
2. 四步：选择 SKU → 商品与定价 → 履约设置 → 确认发布  
3. 发布成功 → **待处理任务** 或 **供给等待室**  
4. 任务页 **进入等待室**（不在任务页点就绪）→ 等待室内 **标记就绪** → **开始履约** → **结束服务**

### 路径 C — 组局 + 陪玩（P1）

- **组局**（主理人召集）：**Moment 首页 → 组局 Tab** → `GroupCard` → `/group/:id` → **报名下单** → `/group-order/:id` → 双方模拟确认（也可从 TA 页组局区块进入）
- **陪玩**（本质 1V1）：**全部/1V1 Tab 人卡** → TA 页 **陪玩** 区块 → `CompanionCard` → `/companion/:id` → **立即下单** → `/group-order/:id` → 双方模拟确认

---

## 4. 交互规则（设计注释用）

| 规则 | 说明 |
|------|------|
| 标记就绪 | 仅在等待室内：买家 **我已就位**；供给 **标记就绪** |
| 任务页 | 只有 **进入等待室** / **继续履约**，无标记就绪 |
| Demo 联调 | 单方点就绪会模拟双方就绪（`DEMO_MIRROR_READY`） |
| 提前开始 | 双方就绪 → 可 **双方已就位 · 开始履约**；到点仍可兜底进入 |
| 近档退款 | 距预约 < 60 分钟：到点前 3 分钟供给未就绪 → 买家 **申请退款**；到点未履约自动退 |
| 远档确认 | UI 存在（`/pending-accept`），demo 默认不触发（`ENABLE_FAR_TERM_CONFIRM=false`） |

---

## 5. 订单状态 → UI

| 状态 | 用户看到 | 主操作 |
|------|----------|--------|
| pending_payment | 待支付 | 去支付 |
| pending_confirm | 待供给确认 | 查看确认进度 |
| booked | 已预约待履约 | 进入等待室 |
| in_progress | 履约中 | 继续履约 |
| completed | 已完成 | 查看完成页 |
| refunded | 已退款 | 重新预约 |

---

## 6. P0 屏规格（第一批高保真）

### 6.1 Moment 首页 `/`

**Tab** 显示 · `HomePage.tsx`

| 区块 | 内容 |
|------|------|
| 顶栏 | 搜索「搜索想约的人或专属时刻」（不可交互）· **我的订单** |
| 分类 | 全部 / 1V1 / 组局 |
| 筛选 | **15分钟内可约** toggle（**组局 Tab 下隐藏**） |
| 列表 | **全部/1V1**：人卡（含提供陪玩的人）· **组局 Tab**：`GroupCard` 活动列表 + 说明「线下履约 · 到场后双方在 App 内确认交割」 |
| 底卡 | **发起自己的 Moment** · 「开放语音、视频或陪玩…」· **去发起** |

**空态**：「该分类暂无供给」/「暂时没有 15 分钟内可约的供给…」/ 组局 Tab「暂时没有开放的组局活动」

**跳转**：人卡 → `/ta/:id` · 组局卡 → `/group/:id` · 去发起 → `/launch/type`

---

### 6.2 TA 主页 `/ta/:providerId`

**Tab** 显示 · `PlaceholderPages.tsx` → `TaMomentPage`

| 区块 | 内容 |
|------|------|
| Hero | 封面 / 渐变 · 返回 · 姓名 + **已认证** · bio · 「N 个可约 Moment」 |
| 1V1 | 区标题 **1V1** · `MomentCard` 列表 |
| 陪玩 | 区标题 **陪玩** · `CompanionCard` 列表 · 说明「1V1 服务 · 完成后双方确认交割」 |
| 组局 | 区标题 **组局** · `GroupCard` 列表 · 说明「主理人召集 · 报名后双方确认交割」 |

**空态**：「用户不存在」/「暂无开放的 Moment」

**跳转**：MomentCard → `/moment/:id` · CompanionCard → `/companion/:id` · GroupCard → `/group/:id`

---

### 6.3 Moment 详情 `/moment/:momentId`

**Tab** 显示 · `DetailPage.tsx`

| 区块 | 内容 |
|------|------|
| Hero | 供给方封面 · 返回 TA · 已认证 · 已履约 N · 营业中/打烊 |
| 商品 | 标题 · 场景 tag · 时长 · 价格 · 描述 |
| 可订时间 | `BookingTimePicker`：日期 chip · 时段 **空闲/已满** · **全部时间/收起** |
| 履约须知 | 4 条规则（锁定时段、提前分钟、近档退款、Demo 说明） |
| 底栏 | 已选时段 / 最早可约 / 已约满 · 价格 · **去下单** |

**BookingTimePicker 文案**：「暂无可预约时间」· 时段标签 **空闲** / **已满**

**跳转**：去下单 → `/checkout/:id?slot=…`（须选中时段）

---

### 6.4 确认下单 `/checkout/:momentId`

**Tab** 显示 · `CheckoutPage.tsx`

| 区块 | 内容 |
|------|------|
| 商品卡 | 标题 · 供给方 · 场景 · 时长/份 · 份数 stepper（1–5） |
| 预约时间 | 时段 label · 近档/远档提示文案 |
| 支付方式 | **现金支付** / **平台币支付** |
| 底栏 | 预约摘要 · 总价 · **去支付** |

**错误**：「创建失败：名额不足，未扣款」

---

### 6.5 Mock 支付 `/pay/:orderId`

**Tab** 显示 · `PayPage.tsx`

| 区块 | 内容 |
|------|------|
| 订单卡 | 订单号 · 标题 · 供给方 · 预约 · 方式 · 时长 · 状态 · 价格 |
| 说明 | 「点击下方按钮模拟支付成功…」 |
| CTA | **支付成功** · **稍后再付 · 查看订单** |

**跳转**：支付成功 → `/waiting/:id` · 稍后再付 → `/profile/orders`

---

### 6.6 买家等待室 `/waiting/:orderId`

**Tab** 隐藏 · `WaitingPage.tsx`

| 区块 | 内容 |
|------|------|
| 头图 | 供给方 avatar · 标题 · 语音/视频 · 时长 |
| 时间 | 预约时间 · 距到点倒计时 |
| Checklist | ✓/○ 你已就位 · ✓/○ 供给方已就绪 · 麦克风/摄像头权限（模拟） |
| 操作 | **我已就位** · 等待供给方… · 近档 **申请退款** |
| 主 CTA | **双方已就位 · 开始履约** / **到点 · 进入履约** / **等待双方就位** |
| 次 CTA | **稍后再来** |

**变体**：`pending_confirm` → 标题「等待供给方确认预约」

---

### 6.7 买家履约 `/fulfill/voice|video/:orderId`

**Tab** 隐藏 · `FulfillVoicePage.tsx` / `FulfillVideoPage.tsx`

**语音**：标签「语音互动进行中」· 大 avatar · 倒计时 · 网络/麦克风 · **静音** · **挂断** · 举报 disabled

**视频**：对方画面（模拟）· 自拍 PIP · 顶栏标题+倒计时 · **静音** · **开/关摄像头** · 切换 disabled · **挂断**

**结束**：倒计时结束或挂断 → `/done/:id`

---

### 6.8 履约完成 `/done/:orderId`

**Tab** 隐藏 · `DonePage.tsx`

| 区块 | 内容 |
|------|------|
| 完成卡 | ✓ · **专属时刻已结束** · 订单信息 · 状态已完成 |
| 售后 | 说明文案 · **申请售后（占位）** disabled |
| CTA | **查看我的订单** · **回到 Moment** |

---

### 6.9 供给等待室 `/supply/waiting/:orderId`

**Tab** 显示 · `SupplyWaitingPage.tsx`

| 区块 | 内容 |
|------|------|
| 头图 | 买家 avatar · 标题 · 买家名 · 语音/视频 |
| Checklist | ✓/○ 你已标记就绪 · ✓/○ 买家已就位 |
| 提示 | 「Demo：点就绪会模拟对方也已就位」 |
| 操作 | **标记就绪** · 近档退款警告条 |
| 主 CTA | **双方已就位 · 开始履约** / **到点 · 开始履约** / **等待双方就位** |
| 次 CTA | **返回消息** |

---

### 6.10 待处理任务 `/profile/my-moments/tasks`

**Tab** 显示 · `SupplyTasksPage.tsx`

| 区块 | 内容 |
|------|------|
| 空态 | 「当前没有待处理任务」 |
| 待确认预约 | 远档说明 · **确认预约** |
| 待履约 | 订单卡 · **进入等待室** / **继续履约** |
| 待确认交割 | 陪玩 · **确认交割** |

> 无「标记就绪」按钮。

---

### 6.11 发起 Moment 四步 `/launch/*`

**Tab** 隐藏（success 页除外）· `LaunchTypePage` → `LaunchPreviewPage`

| 步 | 路由 | 标题 | 要点 |
|----|------|------|------|
| 1 | `/launch/type` | 选择 SKU | 1V1 语音/视频/陪玩 · 平台履约/双方确认 · 已发起→去管理 |
| 2 | `/launch/product` | 商品与定价 | 标题·介绍·价格·时长(1V1)或席位(陪玩) · **下一步：设置如何接单** |
| 3 | `/launch/fulfillment` | 履约设置 | 1V1：开放可约·营业时间·排期预览·履约说明；陪玩：服务时间·地点·交割方式 |
| 4 | `/launch/preview` | 确认发布 | 买家视角 Moment 卡预览 · **确认发布** |

**发布成功** `/launch/success/:id`（Tab **显示**）：Moment 已发布 · **查看待处理任务** · **直接进入供给等待室** · 查看我的 Moment · 查看买家页面

---

### 6.12 我的订单 `/profile/orders`

**Tab** 显示 · `OrdersPage.tsx`

| 区块 | 内容 |
|------|------|
| 筛选 | 全部 / 语音 / 视频 |
| 订单卡 | 标题 · 状态 pill · 供给方 · 预约 · 倒计时 · 价格 |
| 操作 | 去支付 / 查看确认进度 / 进入等待室 / 继续履约 / 查看完成页 / 重新预约 |

**空态**：「还没有订单。去 Moment 找人约一个专属时刻吧。」

---

## 7. P1 / P2 速查

| 优先级 | 页面 | 路由 | 说明 |
|--------|------|------|------|
| P1 | 我的 Moment | `/profile/my-moments` | 销售概览 · 任务 banner · SKU 卡片 |
| P1 | 管理 Moment | `/profile/my-moments/:id/manage` | 暂停/恢复可约 · 下架/上架 |
| P1 | 消息 | `/messages` | 履约提醒 → 各 waiting/fulfill/tasks |
| P1 | 组局详情 | `/group/:id` | 活动封面 Hero · 简介/活动内容/已报名/主理人（含组织次数）· **报名下单** |
| P1 | 陪玩详情 | `/companion/:id` | 1V1 陪玩 · 双方确认交割 · **立即下单** |
| P1 | 组局支付 | `/group-pay/:id` | 退改摘要 · Mock 支付 · 支付成功建群 |
| P1 | 组局确认 | `/group-order/:id` | 待支付/已支付分支 · 建联 · 双方确认 |
| P2 | 主页 Feed | `/feed` | 视频/发现/关注 mock |
| P2 | 我的 | `/profile` | 资料卡 · 动态/产品 tab · 重置 Demo |
| P2 | 分类页 | `/category/:key` | 1V1：人卡（含陪玩） · **组局：GroupCard 活动列表** |
| P2 | 404 | `*` | 页面不存在 |

完整路由 ↔ 源文件见 [WIREFRAMES_HANDOFF.md](./WIREFRAMES_HANDOFF.md)。

---

## 8. 组件复用

| 组件 | 用途 |
|------|------|
| `MomentCard` | TA 页、发起预览、列表 |
| `PersonCard` / `TransferCard` | 首页、分类 |
| `PageHeader` | 内页顶栏 |
| `BookingTimePicker` | 详情选档 |
| `SupplyLaunchProgress` | 发起 1/4–4/4 |
| 订单卡 / 状态 pill | 订单、任务 |

**建议**：1V1 详情页与发起预览共用一套 Moment 商品卡规范；买家/供给等待室与履约页可同源布局，改文案与 CTA。

---

## 9. Demo 边界（勿过度设计）

- 无真实登录、支付 SDK、音视频 SDK  
- **无** 大屏应援 / 心愿求购 / 预售 / 即时在线独立流程  
- 售后 **申请售后（占位）** disabled  
- 数据存 localStorage；Profile 有 **重置 Demo 数据**  
- Feed / 动态 / 我拥有的 等为 mock 壳层

---

## 10. UI 工作顺序

1. **P0 路径 A** 买家 1V1 全链路高保真 + 组件规范  
2. **P0 路径 B** 供给等待室、任务页、发起 4 步  
3. P1 我的 Moment、消息入口、组局  
4. P2 壳层页面对齐 demo 即可
