# GitHub Sentinel Server

这是GitHub Sentinel项目的后端服务器，提供了GitHub仓库监控、事件处理和LLM分析等核心功能。

## 功能特点

- 基于tRPC的API接口
- WebSocket实时通信
- GitHub仓库事件订阅管理
- LLM智能分析支持
- 事件报告生成

## 技术栈

- Node.js
- Express
- tRPC
- WebSocket (ws)
- TypeScript
- dotenv (环境配置)

## 项目结构

```
├── config.json          # 配置文件
├── src/
│   ├── index.ts        # 应用入口
│   ├── trpc.ts         # tRPC配置
│   ├── web-socket.ts   # WebSocket服务
│   └── routers/        # API路由
└── subscriptions/      # 订阅配置
```

## 开发指南

### 环境要求

- Node.js 18+
- npm 或 yarn

### 环境变量配置

在使用服务器之前，需要设置以下环境变量：

```bash
# 服务器配置
PORT=9090                           # 服务器端口号（可选，默认：9090）

# GitHub配置（必需）
GITHUB_TOKEN=your_github_token      # GitHub API访问令牌

# OpenAI配置（用于LLM分析功能）
OPENAI_API_KEY=your_openai_api_key  # OpenAI API密钥（必需）

OPENAI_BASE_URL=your_api_base_url   # 自定义API基础URL（可选）

# 代理配置（可选）
proxy=http://your-proxy-url   # HTTPS代理设置
```

### 配置文件

在`config.json`中可以配置以下参数：

```json
{

  "exports": {
    "path": "./exports",                // 导出文件路径
    "format": "md"                      // 导出格式：md或json
  }
}
```

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 开发模式

```bash
npm run dev
# 或
yarn dev
```

### 构建项目

```bash
npm run build
# 或
yarn build
```

### 启动服务

```bash
npm start
# 或
yarn start
```

## API接口

服务器提供以下主要API路由：

- `/api/trpc/subscriptions/*` - 订阅管理相关接口
- `/api/trpc/llm/*` - LLM分析相关接口
- `/api/trpc/report/*` - 报告生成相关接口

## 部署

1. 构建项目
```bash
npm run build
```

2. 配置环境变量和config.json

3. 启动服务
```bash
npm start
```

建议使用PM2等进程管理工具进行部署：
```bash
pm2 start dist/index.js --name "github-sentinel-server"
```

## 许可证

MIT