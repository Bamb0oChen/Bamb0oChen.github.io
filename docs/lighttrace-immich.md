# 光影留痕：从 Immich 发布地图照片

主页在 GitHub Pages 上运行，无法访问局域网地址，也不能安全保存 Immich API Key。因此地图读取的是事先导出的公开副本，不在访客浏览器中请求 NAS。

1. 在 Immich 中把准备公开的照片标为 **Favorite / 收藏**。按照当前选择，所有被收藏的图片都会成为公开网站的候选；不再使用“公开展示”相册作白名单。
2. 在 Immich 创建用于导出的只读 API Key。密钥只放在运行导出命令的机器环境变量中，绝不提交到仓库或写入网页配置。
3. 在能访问 NAS 且有此主页仓库的机器上复制 `.env.local.example` 为 `.env.local`，只在本机填入 `IMMICH_API_KEY`，然后运行 `npm run export:lighttrace:local`。`.env.local` 已被 Git 忽略。也可以通过环境变量设置 `IMMICH_BASE_URL`、`IMMICH_API_KEY` 和 `IMMICH_PUBLISH_FAVORITES=YES`，运行 `npm run export:lighttrace`。显式开关用于防止误将个人收藏发布到公网。
4. 检查 `public/photos/lighttrace-published/manifest.json` 和生成的缩略图；确认公开范围、照片和 GPS 坐标后，再提交并推送这些文件。GitHub Pages 构建会自动包含它们。可在 NAS 上用定时任务定期运行导出与发布；本仓库目前没有配置自动推送，也不需要将 API Key 放进 GitHub Actions。

导出程序会分页读取收藏中的图片，只导出缩略图、标题、拍摄时间、日期、经纬度；不复制原图、完整 EXIF 或 NAS 地址。没有 GPS 的图片仍在“全部照片”视图中，地图只显示有坐标的照片。地图按 Immich 的绝对拍摄时间排序连线；间隔超过 24 小时或直线距离超过 100 公里的两站使用虚线提示。这是照片地点之间的示意连线，不是 GPS 轨迹或实际行驶路线。取消收藏后，下次导出会移除当前公开副本，但 **Git 历史、第三方缓存和已下载的副本无法保证清除**。不要收藏不愿长期公开的照片和住处等精确位置。

地图使用 OpenStreetMap 标准瓦片，显示署名，不做瓦片预取或批量下载。若访问量增加，应换成有服务承诺的地图瓦片服务。
