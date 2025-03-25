# GitHub Sentinel Client

这是GitHub Sentinel项目的前端界面，提供了GitHub仓库监控和事件分析的可视化展示。

## 功能特点

- 实时仓库事件监控
- 事件分析报告展示
- LLM智能分析结果可视化
- 订阅管理界面
- 响应式设计

## 技术栈

- React 19
- TypeScript
- Vite
- tRPC Client
- Ant Design
- TailwindCSS
- React Query
- WebSocket

## 项目结构

```
├── src/
│   ├── components/    # UI组件
│   ├── hooks/         # 自定义Hooks
│   ├── utils/         # 工具函数
│   ├── assets/        # 静态资源
│   ├── App.tsx        # 应用入口组件
│   └── main.tsx       # 应用入口文件
├── public/           # 公共资源
└── data/            # 本地数据
```

## 开发指南

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 开发模式

```bash
# 仅启动前端开发服务器
npm run dev:client
# 或
yarn dev:client

# 同时启动前端和后端服务
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

### 预览构建结果

```bash
npm run preview
# 或
yarn preview
```

## 配置说明


1. 在`vite.config.ts`中可以自定义：
   - 开发服务器配置
   - 构建选项
   - 插件配置

## 代码规范

项目使用ESLint进行代码规范检查，支持：

- TypeScript类型检查
- React最佳实践
- 代码风格统一

可以通过以下命令进行代码检查：

```bash
npm run lint
# 或
yarn lint
```

## 部署

1. 构建项目
```bash
npm run build
```

2. 将`dist`目录下的文件部署到Web服务器

3. 配置Web服务器（如Nginx）：
   - 设置适当的缓存策略
   - 配置SPA路由重写规则
   - 设置CORS和安全头

## 浏览器支持

- Chrome >= 87
- Firefox >= 78
- Safari >= 14
- Edge >= 88

## 许可证

MIT
