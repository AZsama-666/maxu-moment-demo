# MAXU Moment Web Demo

手机优先的网页点击原型：用 **Moment** 替代原「市集」心智，跑通 **固定档期 1V1 语音 + 视频** 购买 → 支付 → 等待室 → 履约 → 完成。其余入口均为 mock。

## 本地运行

```bash
cd moment-demo
npm install
npm run dev
```

浏览器打开终端提示的地址（默认 `http://localhost:5173/moment/`）。

## 演示路径

1. 底部 **Moment** → 选择「60 秒语音」或「60 秒视频」
2. 选档期 → 确认预约 → Mock 支付成功
3. 等待室点「模拟到点 · 进入履约」
4. 履约页倒计时结束或点挂断 → 完成页 → 我的订单

订单保存在浏览器 `localStorage`，刷新不丢。

## 构建与部署（up9.life）

默认按子路径 **`/moment/`** 构建：

```bash
npm run build
```

产物在 `dist/`。将 `dist` 内文件上传到站点的 `/moment/` 目录，访问：

`https://up9.life/moment/`

若挂在域名根路径：

```bash
# Windows PowerShell
$env:VITE_BASE="/"; npm run build

# macOS / Linux
VITE_BASE=/ npm run build
```

需要服务器对 SPA 做 fallback（未知路径回 `index.html`），或仅通过首页内链浏览。

## 说明

- 无后端、无真实支付 / 音视频 SDK / 登录。
- 用户侧文案避免「市集 / NFT / 链上 / 漂流」等禁用表达。
- 不修改 NaltrexoneApp 原生工程；本目录为独立演示。
