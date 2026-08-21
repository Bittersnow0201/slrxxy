# slr和xxy的小宇宙

属于你们两个人的温馨纪念站。线上地址：https://slrxxy.cn

## 第一次怎么打开

1. 安装 [Node.js](https://nodejs.org/)（选 LTS 版本）
2. 在本项目文件夹打开终端，执行：

```bash
npm install
npm run dev
```

3. 浏览器打开终端里显示的地址（一般是 `http://localhost:5173`）

## 两人怎么一起改内容（推荐）

登录网站后点导航 **编辑**，可在手机上改时间线、信件、首页短句，并上传相册。

这需要先开通腾讯云 CloudBase，步骤见：[docs/CLOUDBASE.md](docs/CLOUDBASE.md)

配置好 `.env` 里的 `VITE_CLOUDBASE_ENV` 后重新构建并发布到 EdgeOne。

## 本地默认内容

未配置云端时，仍可读 [`src/data/content.ts`](src/data/content.ts) 里的默认文案。

## 构建发布

```bash
npm run build
```

把 `dist` 打成 `site.zip` 上传到 EdgeOne 生产环境。
