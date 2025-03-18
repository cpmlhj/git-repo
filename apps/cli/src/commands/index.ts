import { Command } from 'commander'
import { Subscriptions } from '../actions/subscriptions'

const program = new Command()

program
	.name('github-sentinel')
	.description('GitHub仓库监控工具')
	.version('1.0.0')

program.command('add').description('添加新的仓库订阅').action(Subscriptions.add)

program.command('list').description('列出所有订阅').action(Subscriptions.list)

program
	.command('remove')
	.description('取消仓库订阅')
	.action(Subscriptions.remove)

program
	.command('check')
	.option('-p, --proxy <VALUE>', '设置代理地址', undefined)
	.option('-f, --file-path <VALUE>', '导出文件路径', undefined)
	.option('-t, --range-time <VALUE>', '设置检查时间范围', undefined)
	.description('立即检查仓库更新')
	.action(Subscriptions.check)

program
	.command('start')
	.option('-p, --proxy <VALUE>', '设置代理地址', undefined)
	.option('-f, --file-path <VALUE>', '导出文件路径', undefined)
	.description('启动调度器在后台运行')
	.action(Subscriptions.startScheduler)

export { program }
