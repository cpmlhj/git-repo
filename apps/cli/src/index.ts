import { Command } from 'commander';
import inquirer from 'inquirer';
import {  OctokitGitHubClient, SubscriptionManager,ConfigManager, SubscriptionConfig, Scheduler, NotificationSystem, GitHubEventType} from '@github-analytics/core';
const program = new Command();

interface SubscriptionAnswers {
  owner: string;
  repo: string;
  frequency: 'daily' | 'weekly';
  eventTypes: string[];
}

function generate_event_types() {
  const eventTypes: Array<GitHubEventType> = [
    'IssuesEvent',
    'PullRequestReviewEvent',
    'PullRequestEvent',
    'ForkEvent',
    'PushEvent',
    'ReleaseEvent',
    'DiscussionEvent',
  ]
  return eventTypes.map(item => {
    return {
      name: item,
      value: item
    }
  })
}


async function addSubscription() {
  const answers = await inquirer.prompt<SubscriptionAnswers>([
    {
      type: 'input',
      name: 'owner',
      message: '请输入GitHub仓库所有者名称：',
      validate: (input) => input.length > 0
    },
    {
      type: 'input',
      name: 'repo',
      message: '请输入GitHub仓库名称：',
      validate: (input) => input.length > 0
    },
    {
      type: 'list',
      name: 'frequency',
      message: '请选择更新频率：',
      choices: [
        { name: '每日', value: 'daily' },
        { name: '每周', value: 'weekly' }
      ]
    },
    {
      type: 'checkbox',
      name: 'eventTypes',
      message: '请选择要监控的事件类型：',
      choices: generate_event_types()
    }
  ]);

  const subscriptionManager =  await SubscriptionManager.getInstance();
  await subscriptionManager.addSubscription({
    owner: answers.owner,
    repo: answers.repo,
    frequency: answers.frequency,
    eventTypes: answers.eventTypes as SubscriptionConfig['eventTypes']
  });

  console.log('订阅成功！');
}

async function listSubscriptions() {
  const subscriptionManager = await SubscriptionManager.getInstance();
  const subscriptions = await subscriptionManager.getSubscriptions();

  if (subscriptions.length === 0) {
    console.log('当前没有任何订阅。');
    return;
  }

  console.log('当前订阅列表：');
  subscriptions.forEach((sub, index) => {
    console.log(`${index + 1}. ${sub.owner}/${sub.repo}`);
    console.log(`   频率: ${sub.frequency}`);
    console.log(`   事件: ${sub.eventTypes?.join(', ')}`);
    console.log('---');
  });
}

async function removeSubscription() {
  const subscriptionManager =  await SubscriptionManager.getInstance();
  const subscriptions = await subscriptionManager.getSubscriptions();

  if (subscriptions.length === 0) {
    console.log('当前没有任何订阅。');
    return;
  }

  const {subscription}:{subscription: SubscriptionConfig} = await inquirer.prompt([
    {
      type: 'list',
      name: 'subscription',
      message: '请选择要取消的订阅：',
      choices: subscriptions.map((sub) => ({
        name: `${sub.owner}/${sub.repo}`,
        value: sub
      }))
    }
  ]) ;

  await subscriptionManager.removeSubscription(subscription.owner, subscription.repo);
  console.log('订阅已取消！');
}

async function checkUpdates() {
  const config = ConfigManager.getInstance().getConfig();
  const octokit =  OctokitGitHubClient.getInstance(config.githubToken)
  const notification = new NotificationSystem()
  const subscriptionManager = await SubscriptionManager.getInstance();
  const subscriptions = await subscriptionManager.getSubscriptions();

  if (subscriptions.length === 0) {
    console.log('当前没有任何订阅。');
    return;
  }

  const { subscription }:{subscription: SubscriptionConfig} = await inquirer.prompt([
    {
      type: 'list',
      name: 'subscription',
      message: '请选择要检查的仓库：',
      choices: subscriptions.map((sub) => ({
        name: `${sub.owner}/${sub.repo}`,
        value: sub
      }))
    }
  ]);

  // 立即生成当前报告
  const sceduler = Scheduler.getInstance(subscriptionManager, notification, octokit)
  sceduler.checkNow(subscription)
}

program
  .name('github-sentinel')
  .description('GitHub仓库监控工具')
  .version('1.0.0');

program
  .command('add')
  .description('添加新的仓库订阅')
  .action(addSubscription);

program
  .command('list')
  .description('列出所有订阅')
  .action(listSubscriptions);

program
  .command('remove')
  .description('取消仓库订阅')
  .action(removeSubscription);

program
  .command('check')
  .description('立即检查仓库更新')
  .action(checkUpdates);

program.parse();