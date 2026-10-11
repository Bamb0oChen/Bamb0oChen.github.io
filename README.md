# Chen.のhomepage

我的个人主页：[bamb0ochen.com](https://bamb0ochen.com/)。

这里放个人介绍、精选笔记、项目、照片、视频和友链。完整笔记在[移动的大图书馆](https://bamb0ochen.com/notes/)，由独立的 notes 仓库维护，不在本仓库里编辑。

## 页面与功能

- 首页：个人介绍、内容展示、友链、统一导航和 Private Dock。
- 光影留痕：照片地图、按拍摄时间连接的轨迹、全部照片列表。轨迹只是照片地点的连线，不代表实际行驶路线。
- 更新日志：浏览器里的伪终端。文件和命令均为模拟；只有 ~/test 内允许临时修改，不会操作服务器文件或持久保存这些修改。
- 每日记录：保留的记录页面，数据使用浏览器本地存储，不是跨设备同步服务。
- Notes Copilot：通过运行时配置连接外部 Agent 服务；本仓库不提供其后端。

这是 React + Vite 多页面项目，不是直接双击 HTML 就能完整使用的原生静态页面。

## 本地启动

使用支持 --env-file 的 Node.js（建议 20.6+）和 npm：

```sh
npm ci
npm run dev
```

打开终端打印的本地地址。开发端口由 Vite 决定，不固定为历史预览端口。

```sh
npm run build
npm run preview
```

构建产物在 dist/。preview 只用于检查构建结果，不代替生产部署。

## 目录

```text
index.html / gallery.html / records.html   多页面入口
docs/changelog.html                       终端日志页
src/
  pages/                                  首页、相册、记录页
  components/                             共用 UI 和交互
  data/siteData.js                         主页内容、友链等
  data/featuredProjects.js                 项目展示数据
  styles/                                 页面样式
  utils/                                  照片轨迹、虚拟终端等逻辑
public/                                   原样发布的静态资源
scripts/                                  Immich 导出及验证脚本
.github/workflows/                        GitHub Pages 构建部署
```

## 日常维护

友链在 src/data/siteData.js 的 FRIEND_LINKS 中添加，提供唯一 id、name、url、avatar、description、note。
站点和头像尽量使用 HTTPS；不要把新友链误加到 notes 的前言里。

主页内容也优先从数据文件修改；共用导航与页面组件在 src/components/。
改动后检查差异、运行构建，只提交本次相关文件，不提交 node_modules/、dist/ 或本地配置。

```sh
npm run test:lighttrace
npm run test:terminal
npm run build
```

这些命令检查轨迹／导出逻辑、伪终端和打包；通过并不等于页面交互、外部服务和线上部署全部验证完成。

## NAS 照片如何发布

公开相册读取本仓库发布的照片及清单，不让访客直接连接内网 NAS。
在能够访问 Immich 的本机上导出收藏照片，然后检查、提交并推送生成文件。

1. 将 .env.local.example 复制为 .env.local。
2. 在本机填写 IMMICH_BASE_URL 和 IMMICH_API_KEY。
3. 确认 IMMICH_PUBLISH_FAVORITES=YES 表示允许公开当前收藏照片。
4. 执行：

```sh
npm run export:lighttrace:local
```

输出位于 public/photos/lighttrace-published/，包含照片与 manifest.json。
导出脚本会根据新清单清理此前发布、如今不在清单中的照片；零收藏默认中止，避免意外清空。

**收藏在这里也是公开范围。** 发布前检查人物、住址及拍摄位置。
GPS 和拍摄时间会用于地图和轨迹；把照片取消收藏不会立即从线上删除，需要重新导出并部署。
.env.local 和 API Key 不能进入 Git、聊天或公开清单。导出需要本机访问 NAS，GitHub Actions 不会替你连接内网。

## Agent 与 Private Dock 配置

参考 public/agent-config.example.json，在本机准备被 Git 忽略的 public/agent-config.json。
配置包括 Agent endpoint、模型选项，以及 qb / immich / nginx 的入口。
样例中的 /api/agent 和 /go/* 只是配置示例，GitHub Pages 不会自动提供这些后端路由。

部署工作流根据以下 GitHub Variables / Secrets 生成运行时配置：

- AGENT_ENDPOINT、AGENT_MODEL
- QB_ROUTE、IMMICH_ROUTE、NGINX_ROUTE

**生成到前端的内容都能被访客读取，即使它最初来自 GitHub Secret。**
这里只能放可公开的地址和选项，不能放 API 密钥、长期令牌或管理员凭据。
鉴权、访问控制、CORS 和请求限额应由实际后端或反向代理处理；Private Dock 不是安全边界。

## 部署

仓库使用 GitHub Actions 构建并发布 GitHub Pages，不使用旧 README 所说的“直接从源码分支发布”。
工作流监听 main 和 newhead；当前主页维护分支为 newhead，两者都可能触发部署。
GitHub 项目的 Settings → Pages 应选择 GitHub Actions。

推送后查看 Deploy to GitHub Pages 的构建和部署结果，再核对公开页面。
只有 Git push 成功不代表网站已经更新。图片导出、Agent 后端与 NAS 本身也不是这条部署流水线提供的服务。

## 技术与素材

React、Vite、Leaflet / MarkerCluster、Three.js / React Three Fiber、GSAP。
个人照片、文章、第三方头像和其他素材的权利分别属于其权利人；不要将旧文档里的“自由使用和修改”理解为所有内容的统一授权。
