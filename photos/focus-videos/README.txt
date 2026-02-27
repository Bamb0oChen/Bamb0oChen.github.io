专心做视频 - 本地素材目录

使用方式：
1. 把视频文件放在本目录（建议使用 .mp4，文件体积尽量小）
2. 打开 static/data.js
3. 在 window.FOCUS_VIDEO_LIBRARY 中新增条目，例如：
   {
       id: 'vid0001',
       title: '番茄钟学习实录',
       description: '30 分钟无干扰学习片段',
       src: 'photos/focus-videos/vid0001.mp4',
       comment: '学习天地'
   }
4. 保存后刷新首页即可看到“专心做视频”板块更新
