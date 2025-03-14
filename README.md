# GitHub Sentinel

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/lang-typescript-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/node-%3E%3D14-brightgreen.svg)](https://nodejs.org/)

GitHub Sentinel 是一个强大的 GitHub 仓库监控工具，帮助您自动追踪和管理仓库的重要动态。通过邮件或 Webhook 实时获取 Issues、Pull Requests、Releases 和 Discussions 的更新通知。

## 🌟 主要特性

- 🔄 灵活的监控频率（每日/每周）
- 📦 多样化的事件订阅（Issues、PRs、Releases、Discussions）
- 📧 支持邮件和 Webhook 通知
- 🎯 智能的事件过滤和聚合
- 📊 美观的报告生成

## 🚀 快速开始

### 安装

```bash
npm install @github-sentinel/core
```

### 基础配置

1. 创建配置文件 `config.yaml`：

```yaml
notifications:
  email:
    host: smtp.example.com
    port: 587
    user: your-email@example.com
    pass: your-password
    from: your-email@example.com
  webhook:
    url: https://your-webhook-url.com

subscriptions:
  defaultFrequency: daily
  defaultEventTypes:
    - issues
    - pull_requests
    - releases
```

2. 设置环境变量：

```bash
GITHUB_TOKEN=your_github_token
```

### 使用示例

```typescript
import { App } from '@github-sentinel/core';

// 启动应用
const app = App.getInstance();
app.start();
```

## 📦 项目结构

```
.
├── apps/
│   └── cli/          # 命令行工具
└── packages/
    └── core/         # 核心功能模块
```

## 🛠️ 技术栈

- TypeScript
- Node.js
- GitHub API
- YAML

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！如果您有任何问题或建议，请通过 GitHub Issues 与我们联系。