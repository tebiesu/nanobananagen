# GitHub Actions 学习版配置说明

## 1. 已添加的工作流

- `.github/workflows/ci.yml`
  - 触发时机：`push main`、`pull_request -> main`
  - 执行内容：`npm ci`、`npm run lint`、`npm run build`
- `.github/workflows/deploy-ssh.yml`
  - 触发时机：`push main`、手动 `workflow_dispatch`
  - 执行内容：SSH 到服务器后 `git pull`、`npm ci`、`npm run build`、`pm2` 重启

## 2. 仓库 Secrets 配置

在 GitHub 仓库中进入：
`Settings -> Secrets and variables -> Actions -> New repository secret`

需要添加以下 4 个 Secret：

- `SSH_HOST`：服务器公网 IP 或域名
- `SSH_USER`：登录用户（如 `root` 或 `ubuntu`）
- `SSH_PRIVATE_KEY`：私钥内容（与服务器公钥配对）
- `PROJECT_DIR`：服务器项目目录（如 `/var/www/nanobanana`）

## 3. 服务器前置准备

部署工作流假设服务器已经完成：

1. 安装 Node.js 20+
2. 安装 PM2：`npm i -g pm2`
3. 首次手动拉取项目到 `PROJECT_DIR`
4. 能用 `SSH_PRIVATE_KEY` 对应私钥免密登录

## 4. 推荐学习顺序

1. 先看 `ci.yml`，理解最基础 CI 流程
2. 再看 `deploy-ssh.yml`，理解 CD 的远程执行方式
3. 在 GitHub Actions 页面手动触发一次 Deploy，观察日志

## 5. 常见问题

- 部署失败 `Permission denied (publickey)`：
  - 检查私钥是否完整、是否有换行丢失
- 部署失败 `No such file or directory`：
  - 检查 `PROJECT_DIR` 是否正确
- 部署后访问失败：
  - 检查服务器安全组、Nginx 反代和 PM2 进程状态
