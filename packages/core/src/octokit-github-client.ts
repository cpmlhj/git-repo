import { Octokit } from '@octokit/rest';
import { GitHubEvent, IGitHubClient } from './types';

/**
 * 基于Octokit的GitHub API客户端实现
 */
export class OctokitGitHubClient implements IGitHubClient {
  private client: Octokit;

  private static instance: OctokitGitHubClient

  constructor(token: string) {
    this.client = new Octokit({
      auth: token
    });
  }

  static getInstance(token: string) {
    if (!this.instance) {
      this.instance = new OctokitGitHubClient(token);
    }
    return this.instance;
  }

  /**
   * 获取仓库事件
   */
  async getRepositoryEvents({owner, repo}: {owner: string, repo: string}, since?: Date) {
    try {
        const { data } = await this.client.activity.listRepoEvents({
            owner,
            repo,
            per_page: 100
          });
          if (since) {
            return data.filter(event => new Date(event.created_at || '') >= since);
          }
      
          return data;
    } catch(e) {
         console.warn(e)
    }
  }

  /**
   * 获取仓库信息
   */
  async getRepositoryInfo({owner, repo}: {owner: string, repo: string}): Promise<any> {
    try {
        const { data } = await this.client.repos.get({
            owner,
            repo
          });
          console.log(data, '.........666')
          return data;
    } catch(e) {
        console.warn(e)
    }
}

   // 获取最新release信息
  async getLatestRelease({owner, repo}: {owner: string, repo: string}): Promise<any> {
    try {
      const { data } = await this.client.repos.getLatestRelease({
        owner,
        repo
      });
      return data;
    } catch(e) {
      console.warn(e);
    }
  }

   // 获取最新release信息
   async listForRepo({owner, repo}: {owner: string, repo: string}): Promise<any> {
    try {
      const { data } = await this.client.issues.listForRepo({
        owner,
        repo
      });
      return data;
    } catch(e) {
      console.warn(e);
    }
  }
   // 获取最近的PR
   async list({owner, repo}: {owner: string, repo: string}): Promise<any> {
    try {
      const { data } = await this.client.pulls.list({
        owner,
        repo
      });

      return data;
    } catch(e) {
      console.warn(e);
    }
  }
    
}