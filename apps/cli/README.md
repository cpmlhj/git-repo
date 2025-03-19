# GitHub Sentinel CLI

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/lang-typescript-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/node-%3E%3D14-brightgreen.svg)](https://nodejs.org/)

GitHub Sentinel 的命令行工具，提供便捷的仓库监控管理功能。

## 🚀 快速开始

### 安装

```bash
npm install -g @github-analytics/cli
```

### 环境变量配置

在使用CLI之前，需要设置以下环境变量：

```bash
# GitHub API Token（必需）
export GITHUB_TOKEN=your_github_token

# OpenAI配置（可选，用于AI分析功能）
export OPENAI_API_KEY=your_openai_api_key    # OpenAI API密钥
export OPENAI_MODEL=gpt-4-turbo-preview      # 可选，默认使用gpt-4-turbo-preview
export OPENAI_BASE_URL=your_api_base_url     # 可选，自定义API基础URL


# 代理配置（可选）
export proxy=http://your-proxy-url  # 设置HTTPS代理
```

### 配置文件

除了环境变量，你还可以通过 `config.yaml` 文件进行配置：

```yaml
# 通知配置
notifications:
  # 邮件配置（可选）
  email:
    host: smtp.example.com
    port: 587
    user: your-email@example.com
    pass: your-password
    from: your-email@example.com
  # Webhook配置（可选）
  webhook:
    url: https://your-webhook-url.com

# 导出配置（可选）
exports:
  path: ./exports    # 导出文件路径
  format: md         # 导出格式：md或json
  show_export: true  # 是否启用导出
```

## 📋 命令使用说明

### 添加订阅

```bash
# 交互式添加仓库订阅
github-sentinel add
```

添加订阅时可配置的选项：
- 仓库所有者名称（必填）
- 仓库名称（必填）
- 更新频率：每日（daily）或每周（weekly）
- 监控事件类型：
  - issues：问题事件
  - pull_requests：拉取请求事件
  - releases：发布事件
  - discussions：讨论事件

### 查看订阅列表

```bash
# 列出所有订阅
github-sentinel list
```

### 取消订阅

```bash
# 交互式取消订阅
github-sentinel remove
```

### 检查更新

```bash
# 立即检查仓库更新
github-sentinel check [options]

选项：
  -p, --proxy <VALUE>      设置代理地址
  -f, --file-path <VALUE>  导出文件路径
  -t, --range-time <VALUE> 设置检查时间范围（格式：YYYY-MM-DD~YYYY-MM-DD）
```

### 启动调度器

```bash
# 启动后台监控服务
github-sentinel start [options]

选项：
  -p, --proxy <VALUE>      设置代理地址
  -f, --file-path <VALUE>  导出文件路径
```

## 💾 数据存储

- 订阅配置数据存储在 `data/subscriptions.json` 文件中
- 导出的更新记录将保存在指定的导出文件路径（通过 --file-path 选项或config.yaml中的exports.path设置）
- 导出格式可以是Markdown（md）或JSON格式（通过config.yaml中的exports.format设置）

## 🔧 代理配置

可以通过以下三种方式配置代理：
1. 环境变量：`export HTTPS_PROXY=http://your-proxy-url`
2. 命令行参数：使用 `-p` 或 `--proxy` 选项
3. 配置文件：在config.yaml中设置httpsProxy字段
