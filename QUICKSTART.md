# 快速开始指南

## 本地测试

### 方法 1：直接打开（最简单）
1. 在项目文件夹中找到 `index.html`
2. 右键选择 "用浏览器打开" 或双击打开
3. 享受你的个人主页！

### 方法 2：使用 Python 本地服务器（推荐）
```bash
# 打开终端/命令行，进入项目目录
cd 你的项目路径

# 启动本地服务器
python -m http.server 8000

# 在浏览器中打开
http://localhost:8000
```

### 方法 3：使用其他服务器
- Visual Studio Code 中的 Live Server 扩展
- Node.js 的 http-server
- Nginx / Apache（如已安装）

---

## 部署到 GitHub Pages

### 前置条件
- GitHub 账户
- 已创建的 GitHub 仓库（仓库名为 `username.github.io` 或其他名称）

### 部署步骤

#### 第一次设置

1. **初始化 Git（如未初始化）**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Convert Flask app to static HTML"
   ```

2. **添加远程仓库**
   ```bash
   # 替换 username 和 repo-name
   git remote add origin https://github.com/username/repo-name.git
   git branch -M main
   git push -u origin main
   ```

3. **在 GitHub 上启用 Pages**
   - 打开你的仓库
   - 进入 Settings → Pages
   - Source 选择 `Deploy from a branch`
   - Branch 选择 `main` 并保存
   - 等待几分钟，GitHub 会自动部署

4. **访问你的网站**
   - 如果仓库名为 `username.github.io`：`https://username.github.io`
   - 如果是其他名称：`https://username.github.io/repo-name`

#### 更新内容

修改完文件后，使用以下命令更新：
```bash
git add .
git commit -m "Update: 你的更改描述"
git push
```

GitHub Pages 会自动重新部署。刷新浏览器即可看到最新内容（可能需要 1-2 分钟）。

---

## 数据管理

### 数据存储位置
所有用户数据存储在浏览器的 **LocalStorage** 中：
- **记录数据**：键名格式为 `daily_record_YYYY-MM-DD`
- **快速导航**：键名为 `quicknav_links_v1`

### 查看数据
1. 打开浏览器的开发者工具（F12 或 右键 → 检查）
2. 进入 Application/Storage 选项卡
3. 在左侧找到 LocalStorage，点击你的网站 URL
4. 可以看到所有保存的数据

### 导出备份
建议定期导出数据作为备份：
1. 在 records.html 页面打开浏览器控制台（F12）
2. 执行：`exportAllRecordsAsJSON()`
3. 浏览器会自动下载包含所有记录的 JSON 文件

### 导入备份
```javascript
// 在浏览器控制台中：
// 1. 创建文件输入
let input = document.createElement('input');
input.type = 'file';
input.onchange = e => importRecordsFromJSON(e.target.files[0]);
input.click();
```

### 清除所有数据
```javascript
// 在浏览器控制台中谨慎执行：
clearAllData()  // 会要求确认，此操作无法撤销！
```

---

## 常见问题

### Q: 数据会丢失吗？
**A**: 数据存储在浏览器 LocalStorage 中，以下情况会导致数据丢失：
- 清空浏览器缓存/历史记录
- 在隐私模式下使用（数据不会被保存）
- 卸载/重新安装浏览器
- 切换到不同的浏览器或设备

**解决方案**：定期导出数据备份。

### Q: 能在多个设备上同步数据吗？
**A**: 原生不支持。可以采用以下方案：
1. 定期导出并备份到云盘（Google Drive, OneDrive 等）
2. 手动导入到其他设备
3. 修改代码集成云同步服务（需要额外配置）

### Q: 我可以修改页面样式吗？
**A**: 当然可以！直接编辑以下文件：
- `static/styles.css` - 修改样式、颜色、布局
- `index.html` 和 `records.html` - 修改 HTML 结构和内容

### Q: 能离线使用吗？
**A**: 是的！这是完全静态的网站，可以：
1. 保存页面为本地文件
2. 使用浏览器的下载功能
3. 离线访问 `index.html` 和 `records.html`

### Q: GitHub Pages 的域名能改吗？
**A**: 可以的，需要：
1. 购买自定义域名
2. 在 DNS 提供商配置 DNS 记录
3. 在 GitHub 仓库设置中配置自定义域名
（具体步骤见 GitHub 官方文档）

---

## 支持与反馈

如有问题或建议，欢迎：
- 在 GitHub 上提交 Issue
- 修改代码并提交 Pull Request
- 在项目 README 中补充文档

---

## 下一步

### 可以尝试的优化
- [ ] 添加更多 AI 建议的模板
- [ ] 实现数据导入/导出 UI 按钮
- [ ] 添加深色/浅色主题切换
- [ ] 实现数据云同步功能
- [ ] 优化移动设备体验
- [ ] 添加搜索功能
- [ ] 实现数据统计分析

祝你使用愉快！ 🚀
