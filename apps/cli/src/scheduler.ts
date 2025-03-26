#! /usr/bin/env node

import { Scheduler } from '@github-analytics/core/scheduler'

const scheduler = Scheduler.getInstance()

scheduler.start()
