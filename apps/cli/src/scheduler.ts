#! /usr/bin/env node

import { Scheduler } from '@github-sentinel/core/scheduler'

const scheduler = Scheduler.getInstance()

scheduler.start()
