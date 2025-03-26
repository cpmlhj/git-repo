import { Command } from 'commander'
import { Subscriptions } from '../actions/subscriptions'
import cp from 'child_process'
import path from 'path'

const program = new Command()

const pm2Args = [
	'--name',
	'github-sentinel-scheduler',
	'--',
	'-i',
	'1',
	'fork',
	'--node-args',
	'node',
	'--max-memory-restart',
	'1G'
]

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
	.description('使用pm2 启动调度器在后台运行')
	.option('-d, --daemon', '以守护进程模式启动')
	.action((args) => {
		const { daemon } = args
		const scriptPath = path.resolve(__dirname, '../dist/scheduler.js')
		if (!daemon) {
			pm2Args.push('--no-daemon')
		}
		pm2Args.unshift(scriptPath)
		pm2Args.unshift('start')
		console.log(pm2Args, '==-')
		const win32 = process.platform === 'win32'
		const command = win32 ? 'cmd' : 'pm2'
		const commandArgs = win32
			? ['/c'].concat(`pm2 ${pm2Args.join(' ')} `)
			: pm2Args
		cp.spawn(command, commandArgs, {
			stdio: 'inherit'
		})
	})

export { program }
