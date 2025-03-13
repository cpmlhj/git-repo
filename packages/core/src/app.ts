import { ConfigManager } from './config-manager';
import { SubscriptionManager } from './subscription-manager';
import { NotificationSystem } from './notification-system';
import { OctokitGitHubClient } from './octokit-github-client';
import { Scheduler } from './scheduler';
import { resolve } from 'path';
import { mkdir } from 'fs/promises';

/**
 * 应用程序类
 */
export class App {
  private static instance: App;
  private subscriptionManager: SubscriptionManager;
  private notificationSystem: NotificationSystem;
  private githubClient: OctokitGitHubClient;
  private scheduler: Scheduler;

  private constructor() {
    // 初始化各个组件
    const config = ConfigManager.getInstance().getConfig();
    this.githubClient = new OctokitGitHubClient(config.githubToken);
    this.notificationSystem = new NotificationSystem();
    this.subscriptionManager = new SubscriptionManager(resolve(process.cwd(), 'data'));
    this.scheduler = Scheduler.getInstance(
      this.subscriptionManager,
      this.notificationSystem,
      this.githubClient
    );
  }

  /**
   * 获取应用程序实例
   */
  public static getInstance(): App {
    if (!App.instance) {
      App.instance = new App();
    }
    return App.instance;
  }

  /**
   * 启动应用程序
   */
  public async start(): Promise<void> {
    try {
      // 创建数据目录
      await mkdir(resolve(process.cwd(), 'data'), { recursive: true });

      // 初始化订阅管理器
      await this.subscriptionManager.init();

      // 添加通知配置
      const config = ConfigManager.getInstance().getConfig();
      if (config.notifications.email) {
        await this.notificationSystem.addNotificationConfig({
          type: 'email',
          target: config.notifications.email.from
        });
      }
      if (config.notifications.webhook) {
        await this.notificationSystem.addNotificationConfig({
          type: 'webhook',
          target: config.notifications.webhook.url
        });
      }

      // 启动调度器
      await this.scheduler.start();

      console.log('应用程序已启动');

      // 处理进程退出信号
      process.on('SIGINT', () => this.stop());
      process.on('SIGTERM', () => this.stop());
    } catch (error) {
      console.error('启动应用程序失败:', error);
      process.exit(1);
    }
  }

  /**
   * 停止应用程序
   */
  public stop(): void {
    try {
      // 停止调度器
      this.scheduler.stop();
      console.log('应用程序已停止');
      process.exit(0);
    } catch (error) {
      console.error('停止应用程序失败:', error);
      process.exit(1);
    }
  }
}




