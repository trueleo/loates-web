import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { ComponentIcon, Users, Clock2, Clock4, Timer, TrendingUp } from 'lucide-vue-next'
import { Duration, Executor, Rate } from '@/app'
import { DateTime } from 'luxon'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function scenarioInfo(scenario: {
  name: string
  startTime: DateTime | null
  executors: Executor[]
}): { icon: typeof ComponentIcon; title: string; value: any }[] {
  const vus = scenario.executors.reduce((acc, executor) => acc + Executor.vus(executor), 0)
  const duration = scenario.executors
    .map((executor) => Executor.duration(executor))
    .reduce(
      (acc, dur) => {
        if (acc != null) {
          return dur ? acc.max(dur) : acc
        } else {
          return null
        }
      },
      new Duration(0, 0)
    )

  const endTime = scenario.startTime
    ? duration
      ? scenario.startTime.plus({ seconds: duration.secs, milliseconds: duration.nanos / 1000000 })
      : null
    : null

  const rate = scenario.executors.map((executor) => Executor.rate(executor)).filter(notEmpty)
  const sumRate =
    rate.length > 0
      ? rate.reduce((acc, rate) => rate.plus(acc), new Rate(0, new Duration(0, 0)))
      : null

  const res = []
  res.push({ icon: Users, title: 'VUS', value: vus })
  if (scenario.startTime) {
    res.push({ icon: Clock2, title: 'StartTime:', value: scenario.startTime })
  }
  if (endTime) {
    res.push({ icon: Clock4, title: 'EndTime:', value: endTime })
  }
  if (duration) {
    res.push({ icon: Timer, title: 'Duration:', value: duration.to_luxon() })
  }
  if (sumRate) {
    res.push({
      icon: TrendingUp,
      title: 'Rate:',
      value: `${Math.round(sumRate.perSeconds())} per sec`
    })
  }
  return res
}

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined
}
