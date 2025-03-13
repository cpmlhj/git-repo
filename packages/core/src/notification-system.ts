import axios from 'axios';
import { INotificationSystem, NotificationConfig } from './types';

/**
 * 通知系统实现类
 */
export class NotificationSystem implements INotificationSystem {
  private configs: NotificationConfig[] = [];

  /**
   * 发送通知
   */
  async sendNotification(config: NotificationConfig, content: string): Promise<void> {
    switch (config.type) {
      case 'webhook':
        await this.sendWebhookNotification(config.target, content);
        break;
      case 'email':
        await this.sendEmailNotification(config.target, content);
        break;
      default:
        throw new Error(`不支持的通知类型: ${config.type}`);
    }
  }

  /**
   * 添加通知配置
   */
  async addNotificationConfig(config: NotificationConfig): Promise<void> {
    const existingIndex = this.configs.findIndex(
      (c) => c.type === config.type && c.target === config.target
    );

    if (existingIndex !== -1) {
      this.configs[existingIndex] = config;
    } else {
      this.configs.push(config);
    }
  }

  /**
   * 移除通知配置
   */
  async removeNotificationConfig(type: string, target: string): Promise<void> {
    this.configs = this.configs.filter(
      (config) => !(config.type === type && config.target === target)
    );
  }

  /**
   * 发送 Webhook 通知
   */
  private async sendWebhookNotification(url: string, content: string): Promise<void> {
    try {
      await axios.post(url, { content });
    } catch (error) {
      console.error('发送 Webhook 通知失败:', error);
      throw error;
    }
  }

  /**
   * 发送邮件通知
   * 注意：这里需要集成具体的邮件发送服务
   */
  private async sendEmailNotification(email: string, content: string): Promise<void> {
    // TODO: 实现邮件发送功能
    console.log(`[模拟] 发送邮件到 ${email}:\n${content}`);
  }
}