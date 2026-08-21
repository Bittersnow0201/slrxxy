# 智能体（小丫头）对接说明

左下角卡通形象可点击对话。默认人设参考情侣 App「Suki」里共养小宠物的感觉：软、黏、像你们一起养的娃。名字默认「小丫头」，可在对话框里改人设。

## 你需要提供 / 配置的

1. **阿里云百炼 API Key**（DashScope）
   - 打开 [百炼控制台](https://bailian.console.aliyun.com/) → API-KEY 管理 → 创建
   - 本地：写进项目根目录 `.env`（不要提交到公开仓库）

```env
DASHSCOPE_API_KEY=sk-你的密钥
DASHSCOPE_MODEL=qwen-plus
```

2. **线上（EdgeOne Pages）环境变量**
   - 在 EdgeOne 项目设置里新增同名变量：`DASHSCOPE_API_KEY`
   - 可选：`DASHSCOPE_MODEL`（默认 `qwen-plus`）
   - 需要走 **仓库构建部署**（带 `/functions`），边缘函数才会生效  
   - 若只上传 `site.zip` 静态包，对话接口不会上线

## 原理

浏览器不能直接调百炼（CORS + 密钥暴露），因此：

- 本地：`vite` 中间件代理 `/api/agent-chat`
- 线上：`functions/api/agent-chat.js` 边缘函数代理

形象资源：`public/media/agent-chick.png`（已去底）
