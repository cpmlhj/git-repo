# GitHub Sentinel

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/lang-typescript-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/node-%3E%3D14-brightgreen.svg)](https://nodejs.org/)

GitHub Sentinel 是一个强大的 GitHub 仓库监控工具，它能够自动追踪仓库的重要动态（如 Issues、Pull Requests、Releases 和 Discussions），并通过邮件或 Webhook 及时通知您。

## 🌟 特性

- 🔄 支持多种更新频率（每日/每周）的仓库动态监控
- 📦 灵活的事件类型订阅（Issues、Pull Requests、Releases、Discussions）
- 📧 支持邮件通知和 Webhook 通知
- 🎯 智能的事件过滤和聚合
- 📊 美观的报告生成
- ⚙️ 简单的配置方式（YAML/环境变量）
- 🔒 安全的令牌管理

## 🏗️ 技术架构

- 采用 TypeScript 开发，提供类型安全
- 模块化设计，核心功能解耦
- 单例模式确保资源高效利用
- 支持定时任务调度
- 可扩展的通知系统

## 📦 安装

```bash
npm install @github-sentinel/core
```

## 🚀 快速开始

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

3. 使用示例：

```typescript
import { App } from '@github-sentinel/core';

// 启动应用
const app = App.getInstance();
app.start();
```

## 📖 API 文档

### SubscriptionManager

```typescript
// 添加订阅
await subscriptionManager.addSubscription({
  owner: 'owner',
  repo: 'repo',
  frequency: 'daily',
  eventTypes: ['issues', 'pull_requests']
});

// 获取所有订阅
const subscriptions = await subscriptionManager.getSubscriptions();
```

### NotificationSystem

```typescript
// 添加通知配置
await notificationSystem.addNotificationConfig({
  type: 'email',
  target: 'your-email@example.com'
});

// 发送通知
await notificationSystem.sendNotification(
  { type: 'email', target: 'your-email@example.com' },
  'Notification content'
);
```

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系方式

如有问题或建议，请通过 GitHub Issues 与我们联系。