# Chen.のhomepage - 静态网页版本

#### 功能描述

这是一个完全静态化的个人主页和每日记录系统，支持在 GitHub Pages 上部署。

在这个网站中你会看到以下功能：
1. **英雄区域** - 带有淡出效果的背景图片（滚动时逐渐消失）
2. **打卡热图** - 类似 GitHub 贡献图的频率记录器（追踪学习频率）
3. **快速导航** - 自定义导航链接，支持添加/删除
4. **每日记录** - 完整的日记系统，包括：
   - 关键词标签
   - 今日完成事项
   - 明天计划（含 AI 建议）
   - 待办清单（支持勾选）
   - 感悟记录
5. **数据导出** - 将记录导出为纯文本文件

---

## 项目结构

### 根目录文件
- **index.html** - 首页（热图 + 快速导航）
- **records.html** - 每日记录页面
- **README.md** - 项目文档
- **.gitignore** - Git 忽略文件配置

### static/ 目录
- **styles.css** - 全局样式表（深色主题，响应式设计）
- **data.js** - LocalStorage 数据管理模块
- **fade.js** - 英雄区域滚动淡出动画

---

## 使用说明

### 在本地使用

1. **直接打开** - 在浏览器中打开 `index.html` 即可使用（推荐用现代浏览器）

2. **使用 Python 本地服务器**（可避免跨域问题）：
   ```bash
   # Python 3.x
   python -m http.server 8000
   
   # 然后在浏览器打开 http://localhost:8000
   ```

### 部署到 GitHub Pages

1. 推送到 GitHub 仓库的 `main` 或 `master` 分支

2. 在 GitHub 仓库设置中启用 GitHub Pages：
   - Settings → Pages
   - Source 选择 `Deploy from a branch`
   - Branch 选择 `main` (或 `master`)
   - 点击 Save

3. 访问你的 GitHub Pages URL（通常为 `https://username.github.io/repo-name`）

### 功能使用

#### 首页（index.html）
- **打卡热图** - 显示过去 52 周的打卡情况，同时显示快速导航
- **快速导航** - 点击 `+` 按钮添加常用网址，支持自定义标题

#### 记录页（records.html）
- **日期导航** - 在不同日期之间切换查看/编辑记录
- **关键词** - 为每日记录添加标签
- **今天做了什么** - 记录今日完成的事项
- **明天打算做** - 计划明天的任务，点击"AI 建议"获得智能提示
- **待办清单** - 添加待办项目，支持勾选完成状态
- **感悟** - 记录今日的思考和反思
- **导出功能** - 将当前日期的记录导出为格式化的纯文本文件

---

## 数据存储

所有数据都存储在**浏览器的 LocalStorage** 中，这意味着：

### 优点
✅ 完全离线使用，无需后端服务器
✅ 数据完全保存在你的浏览器中，隐私性强
✅ 无需配置数据库

### 注意事项
⚠️ 数据仅在当前浏览器中保存（切换浏览器或清空浏览器数据会丢失）
⚠️ LocalStorage 通常限制在 5-10MB（足够存储数千条记录）
⚠️ 在浏览器隐私模式中可能无法保存

### 备份与恢复
可以通过浏览器开发者工具（F12）的 Application → LocalStorage 来查看所有数据：
- 所有记录键：`daily_record_YYYY-MM-DD`
- 快速导航键：`quicknav_links_v1`

---

## 技术栈

- **前端框架** - 原生 HTML5, CSS3, JavaScript（无任何外部依赖）
- **数据存储** - 浏览器 LocalStorage API
- **部署平台** - GitHub Pages（完全静态化）

---

## 浏览器兼容性

- ✅ Chrome/Chromium（推荐）
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ❓ IE11（不支持某些现代 API）

---

## 许可证

自由使用和修改
