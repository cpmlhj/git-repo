import { GitHubEvent , GitHubEventType} from './types';
import colors from 'colors'
/**
 * 报告生成器类
 */
export class ReportGenerator {
  /**
   * 生成报告
   */
  public async generateReport(params: {
    owner: string;
    repo: string;
    events: GitHubEvent[];
    period: 'daily' | 'weekly';
  }): Promise<string> {
    const { owner, repo, events, period } = params;
    const periodText = period === 'daily' ? '日报' : '周报';

    // 按事件类型分组
    const eventsByType = this.groupEventsByType(events);

    // 生成 Markdown 格式的报告
    let report = `# GitHub 仓库 ${owner}/${repo} ${periodText}\n\n`;

    // 添加统计信息
    report += this.generateStatistics(eventsByType);

    // 添加详细事件信息
    report += this.generateEventDetails(eventsByType);

    return report;
  }

  /**
   * 按事件类型分组
   */
  private groupEventsByType(events: GitHubEvent[]): Record<string, GitHubEvent[]> {
    return events.reduce((acc, event) => {
      const type = event.type?.toLowerCase();
      if(type) {
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(event);
      }
      return acc;
    }, {} as Record<string, GitHubEvent[]>);
  }

  /**
   * 生成统计信息
   */
  private generateStatistics(eventsByType: Record<string, GitHubEvent[]>): string {
    let stats = '## 统计信息\n\n';

    // 统计各类型事件数量
    for (const [type, events] of Object.entries(eventsByType)) {
      stats += `- ${this.formatEventType(type)}: ${events.length} 个\n`;
    }

    return stats + '\n';
  }

  /**
   * 生成事件详细信息
   */
  private generateEventDetails(eventsByType: Record<string, GitHubEvent[]>): string {
    let details = '';

    for (const [type, events] of Object.entries(eventsByType)) {
      details += `## ${this.formatEventType(type)}\n\n`;

      for (const event of events) {
        details += this.formatEvent(event);
      }

      details += '\n';
    }

    return details;
  }

  /**
   * 格式化事件类型
   */
  private formatEventType(type: string): string {
    const typeMap: Partial<Record<GitHubEventType, string>> = {
      'IssuesEvent': 'Issue 更新',
      'PullRequestEvent': 'Pull Request 更新',
      'ReleaseEvent': '新版本发布',
      'DiscussionEvent': '讨论更新'
    };

    return typeMap[type as GitHubEventType] || type;
  }

  /**
   * 格式化单个事件
   */
  private formatEvent(event: GitHubEvent): string {
    const actor = event.actor.login;
    const time = new Date(event.created_at || '').toLocaleString('zh-CN');
    let content = '';
    const color = this.eventTypeColorMap[event.type as GitHubEventType || this.eventTypeColorMap.DiscussionEvent]
    switch (event.type) {
      case 'IssuesEvent':
        content = this.formatIssueEvent(event)
        break;
      case 'PullRequestEvent':
        content = this.formatPullRequestEvent(event);
        break;
      case 'ReleaseEvent':
        content = this.formatReleaseEvent(event);
        break;
      case 'DiscussionEvent':
        content = this.formatDiscussionEvent(event);
        break;
      case 'IssueCommentEvent':
        content = this.formatIssueCommentEvent(event);
        break;
      case 'PullRequestReviewEvent':
        content = this.formatPullRequestReviewEvent(event);
        break;
      case 'PullRequestReviewCommentEvent':
        content = this.formatPullRequestReviewCommentEvent(event);
        break;
      case 'PushEvent':
        content = this.formatPushEvent(event);
        break;
      case 'DiscussionCommentEvent':
        content = this.formatDiscussionCommentEvent(event);
        break;
      case 'ForkEvent':
        content = this.formatForkEvent(event);
        break;
      default:
        content = `未知事件类型: ${event.type}`;
    }

    // @ts-ignore
    return colors[color](`### ${content}\n- 操作者: ${actor}\n- 时间: ${time}\n\n`);
  }

  /**
   * 格式化 Issue 事件
   */
  private formatIssueEvent(event: GitHubEvent): string {
    const { action, issue } = event.payload;
    const title = issue?.title;
    const number = issue?.number;
    const url = issue?.html_url;

    return `Issue #${number}: ${title}\n- 动作: ${this.formatAction(action || '')}\n- 链接: ${url}`;
  }

  /**
   * 格式化 Pull Request 事件
   */
  private formatPullRequestEvent(event: any): string {
    const title = event.payload?.pull_request?.title
    const number =  event.payload?.number
    const url = event.payload?.pull_request?.html_url
    const action =  event.payload?.action
    return `PR #${number}: ${title}\n- 动作: ${this.formatAction(action|| '')}\n- 链接: ${url}`;
  }

  /**
   * 格式化 Release 事件
   */
  private formatReleaseEvent(event: any): string {
    const { action, release } = event.payload;
    const tag = release.tag_name;
    const name = release.name || tag;
    const url = release.html_url;

    return `Release ${tag}: ${name}\n- 动作: ${this.formatAction(action)}\n- 链接: ${url}`;
  }

  private formatIssueCommentEvent(event :any): string {
    const { action, issue, comment } = event.payload;
    const title = issue.title;
    const number = issue.number;
    const url = comment.html_url;

    return `Issue #${number} 评论: ${title}\n- 动作: ${this.formatAction(action)}\n- 链接: ${url}`;
  }

  private formatPullRequestReviewEvent(event: any): string {
    const { action, pull_request, review } = event.payload;
    const title = pull_request.title;
    const number = pull_request.number;
    const url = review.html_url;
    const state = review.state;

    return `PR #${number} 审查: ${title}\n- 动作: ${this.formatAction(action)}\n- 状态: ${state}\n- 链接: ${url}`;
  }

  private formatPullRequestReviewCommentEvent(event: any): string {
    const { action, pull_request, comment } = event.payload;
    const title = pull_request.title;
    const number = pull_request.number;
    const url = comment.html_url;

    return `PR #${number} 评论: ${title}\n- 动作: ${this.formatAction(action)}\n- 链接: ${url}`;
  }

  private formatPushEvent(event: any): string {
    const { ref, commits } = event.payload;
    const branch = ref.replace('refs/heads/', '');
    const count = commits.length;

    return `推送到 ${branch}\n- 提交数: ${count}\n- 提交信息:\n${commits.map((commit: any) => `  - ${commit.message}`).join('\n')}`;
  }

  private formatDiscussionCommentEvent(event: any): string {
    const { action, discussion, comment } = event.payload;
    const title = discussion.title;
    const number = discussion.number;
    const url = comment.html_url;

    return `讨论 #${number} 评论: ${title}\n- 动作: ${this.formatAction(action)}\n- 链接: ${url}`;
  }

  private formatForkEvent(event: any): string {
    const { forkee } = event.payload;
    const url = forkee.html_url;
    const fullName = forkee.full_name;

    return `Fork 到 ${fullName}\n- 链接: ${url}`;
  }

  /**
   * 格式化 Discussion 事件
   */
  private formatDiscussionEvent(event: any): string {
    const { action, discussion } = event.payload;
    const title = discussion.title;
    const number = discussion.number;
    const url = discussion.html_url;

    return `Discussion #${number}: ${title}\n- 动作: ${this.formatAction(action)}\n- 链接: ${url}`;
  }

  /**
   * 格式化动作描述
   */
  private formatAction(action: string): string {
    const actionMap: Record<string, string> = {
      'opened': '创建',
      'closed': '关闭',
      'reopened': '重新打开',
      'edited': '编辑',
      'merged': '合并',
      'published': '发布',
      'created': '创建',
      'deleted': '删除',
      'commented': '评论'
    };
    return actionMap[action] || action;
  }

  /**
   * 事件类型对应的颜色映射
   */
  private readonly eventTypeColorMap: Record<GitHubEventType, string> = {
    'IssuesEvent': 'blue',
    'PullRequestEvent': 'magenta',
    'ReleaseEvent': 'green',
    'DiscussionEvent': 'cyan',
    'IssueCommentEvent': 'lightblue',
    'PullRequestReviewEvent': 'bgMagenta',
    'PullRequestReviewCommentEvent': 'bgMagenta',
    'PushEvent': 'yellow',
    'DiscussionCommentEvent': 'cyanBright',
    'ForkEvent': 'red'
  };
}