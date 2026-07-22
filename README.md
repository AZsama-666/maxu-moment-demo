# MAXU Moment Web Demo

手机优先的网页点击原型：用 **Moment** 替代原「市集」心智，跑通 **固定档期 1V1 语音 + 视频** 购买 → 支付 → 等待室 → 履约 → 完成。其余入口均为 mock。

## 本地运行

```bash
cd moment-demo
npm install
npm run dev
```

浏览器打开终端提示的地址（默认 `http://localhost:5173/`；子路径部署见下方 `VITE_BASE`）。

## 演示路径

1. 底部 **Moment** → 选人卡片 → TA 页 → 选 1V1 Moment
2. 详情页选档期 → **去下单** → **支付成功**
3. 等待室点 **我已就位** → **双方已就位 · 开始履约**（或到点 **到点 · 进入履约**）
4. 履约页倒计时结束或点挂断 → 完成页 → 我的订单

UI 产品文档见 [docs/UI_PRODUCT_SPEC.md](./docs/UI_PRODUCT_SPEC.md)。

订单保存在浏览器 `localStorage`，刷新不丢。

## 构建与部署（up9.life）

默认部署到域名根路径 **`https://up9.life/`**：

```bash
npm run build
```

产物在 `dist/`。仓库已配置 GitHub Actions，推送到 `main` 会自动发布。

若需挂到子路径 `/moment/`：

```bash
# Windows PowerShell
$env:VITE_BASE="/moment/"; npm run build

# macOS / Linux
VITE_BASE=/moment/ npm run build
```

## 说明

- 无后端、无真实支付 / 音视频 SDK / 登录。
- 用户侧文案避免「市集 / NFT / 链上 / 漂流」等禁用表达。
- 不修改 NaltrexoneApp 原生工程；本目录为独立演示。
