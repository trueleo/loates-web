import { DateTime, Duration as LuxonDuration } from 'luxon'

export class Duration {
  secs: number
  nanos: number

  constructor(seconds: number = 0, nanoseconds: number = 0) {
    this.secs = seconds
    this.nanos = nanoseconds
  }

  static ZERO = new Duration(0, 0)

  add(other: Duration): Duration {
    const totalNanoseconds = this.nanos + other.nanos
    const additionalSeconds = Math.floor(totalNanoseconds / 1e9)
    return new Duration(this.secs + other.secs + additionalSeconds, totalNanoseconds % 1e9)
  }

  max(other: Duration): Duration {
    if (this.secs > other.secs || (this.secs === other.secs && this.nanos > other.nanos)) {
      return this
    }
    return other
  }

  min(other: Duration): Duration {
    if (this.secs < other.secs || (this.secs === this.secs && this.nanos < other.nanos)) {
      return this
    }
    return other
  }

  to_luxon(): LuxonDuration<true> {
    const additionalSeconds = this.nanos != 0 ? Math.floor(this.nanos / 1e9) : 0
    this.nanos = this.nanos % 1e9
    this.secs = this.secs + additionalSeconds
    if (this.nanos == 0 && this.secs == 0) {
      return LuxonDuration.fromMillis(0)
    }
    return LuxonDuration.fromObject({
      seconds: this.secs != 0 ? this.secs : undefined,
      milliseconds: this.nanos != 0 ? this.nanos / 1e6 : undefined
    }).rescale()
  }

  static fromObject(obj: {
    seconds?: number
    nanoseconds?: number
    secs?: number
    nanos?: number
  }): Duration {
    const secs = obj.seconds ?? obj.secs ?? 0
    const nanos = obj.nanoseconds ?? obj.nanos ?? 0
    return new Duration(secs, nanos)
  }
}

export function toHuman(duration: Duration | LuxonDuration<true>): string {
  let luxon
  if (duration instanceof Duration) {
    luxon = duration.to_luxon()
  } else {
    luxon = duration
  }
  if (luxon.as('millisecond') == 0) {
    return '0 ms'
  }
  return luxon.rescale().toHuman({
    notation: 'standard',
    unitDisplay: 'short'
  })
}

export function toZeroMillisHuman(duration: Duration | LuxonDuration<true>): string {
  let luxon
  if (duration instanceof Duration) {
    luxon = duration.to_luxon()
  } else {
    luxon = duration
  }
  return luxon.rescale().set({ milliseconds: 0 }).rescale().toHuman({
    notation: 'standard',
    unitDisplay: 'short'
  })
}

export class Rate {
  value: number
  duration: Duration

  constructor(value: number, duration: Duration) {
    this.value = value
    this.duration = new Duration(duration.secs, duration.nanos)
  }

  toTuple(): [number, Duration] {
    return [this.value, this.duration]
  }

  toString(): string {
    return `${this.value}/${this.duration}`
  }

  max(other: Rate): Rate {
    const this_millis = this.duration.to_luxon().toMillis()
    const other_millis = other.duration.to_luxon().toMillis()

    const this_rate = this.value != 0 ? this.value / this_millis : 0
    const other_rate = other.value != 0 ? other.value / other_millis : 0

    if (this_rate > other_rate) {
      return this
    } else {
      return other
    }
  }

  plus(other: Rate): Rate {
    const new_value = this.value + other.value
    const new_duration = this.duration.add(other.duration)
    return new Rate(new_value, new_duration)
  }

  perSeconds(): number {
    const seconds = this.duration.to_luxon().as('seconds')
    return this.value / seconds
  }
}

export type Executor =
  | { type: 'Once' }
  | { type: 'Constant'; users: number; duration: Duration }
  | { type: 'Shared'; users: number; iterations: number; duration: Duration }
  | { type: 'PerUser'; users: number; iterations: number }
  | {
      type: 'ConstantArrivalRate'
      preAllocateUsers: number
      rate: Rate
      maxUsers: number
      duration: Duration
    }
  | { type: 'RampingUser'; preAllocateUsers: number; stages: Array<[number, Duration]> }
  | {
      type: 'RampingArrivalRate'
      preAllocateUsers: number
      maxUsers: number
      stages: Array<[Rate, Duration]>
    }

export namespace Executor {
  export function vus(value: Executor): number {
    switch (value.type) {
      case 'Once':
        return 1
      case 'Constant':
        return value.users
      case 'Shared':
        return value.users
      case 'PerUser':
        return value.users
      case 'ConstantArrivalRate':
        return value.maxUsers
      case 'RampingUser':
        return value.stages.reduce((acc, stage) => Math.max(stage[0], acc), value.preAllocateUsers)
      case 'RampingArrivalRate':
        return value.maxUsers
    }
  }

  export function rate(value: Executor): Rate | null {
    switch (value.type) {
      case 'Once':
        return new Rate(1, new Duration(0, 1))
      case 'Constant':
        return null
      case 'Shared':
        return null
      case 'PerUser':
        return null
      case 'ConstantArrivalRate':
        return value.rate
      case 'RampingUser':
        return null
      case 'RampingArrivalRate':
        return value.stages.reduce(
          (acc, stage) => stage[0].max(acc),
          new Rate(0, new Duration(0, 0))
        )
    }
  }

  export function duration(value: Executor): Duration | null {
    switch (value.type) {
      case 'Once':
        return new Duration(0, 1)
      case 'Constant':
        return value.duration
      case 'Shared':
        return value.duration
      case 'PerUser':
        return null
      case 'ConstantArrivalRate':
        return value.duration
      case 'RampingUser':
        return value.stages
          .map((stage) => stage[1])
          .reduce((acc, duration) => acc.add(duration), new Duration(0, 0))
      case 'RampingArrivalRate':
        return value.stages
          .map((stage) => stage[1])
          .reduce((acc, duration) => acc.add(duration), new Duration(0, 0))
    }
  }

  export function fromObject(value: Executor): Executor {
    switch (value.type) {
      case 'Once':
        return value
      case 'Constant': {
        value.duration = new Duration(value.duration.secs, value.duration.nanos)
        return value
      }
      case 'Shared': {
        value.duration = new Duration(value.duration.secs, value.duration.nanos)
        return value
      }
      case 'PerUser':
        return value
      case 'ConstantArrivalRate': {
        value.duration = new Duration(value.duration.secs, value.duration.nanos)
        value.rate = new Rate(value.rate.value, value.rate.duration)
        return value
      }
      case 'RampingUser': {
        value.stages = value.stages.map((stage) => [
          stage[0],
          new Duration(stage[1].secs, stage[1].nanos)
        ])
        return value
      }
      case 'RampingArrivalRate':
        value.stages = value.stages.map((stage) => [
          new Rate(stage[0].value, stage[0].duration),
          new Duration(stage[1].secs, stage[1].nanos)
        ])
        return value
    }
  }
}

type MainMetricValueMap = {
  vus: number
  rps: number
  throughput: { upload: number; download: number }
  success: number
  error: number
  responseTime: Duration
  counter: { tags: string[]; value: number }
  gauge: { tags: string[]; value: number | Duration }
  histogram: {
    tags: string[]
    value: [number, number, number, number] | [Duration, Duration, Duration, Duration]
  }
}

export type MetricKey = keyof MainMetricValueMap

export type Metric = {
  [K in MetricKey]: {
    type: K
    time: DateTime
    value: MainMetricValueMap[K]
  }
}[MetricKey]

export function patchMetric(m: any): Metric {
  m.time = DateTime.fromISO(m.time)
  switch (m.type) {
    case 'vus':
    case 'throughput':
    case 'rps':
    case 'success':
    case 'error':
    case 'counter':
      break
    case 'responseTime':
      m.value = new Duration(m.value.secs, m.value.nanos)
      break
    case 'gauge':
      if (
        typeof m.value.value === 'object' &&
        m.value.value !== null &&
        !(m.value.value instanceof Duration)
      ) {
        const rawDuration = m.value.value as unknown as { secs: number; nanos: number }
        m.value.value = new Duration(rawDuration.secs, rawDuration.nanos)
      }
      break
    case 'histogram':
      if (
        Array.isArray(m.value.value) &&
        m.value.value.length > 0 &&
        typeof m.value.value[0] === 'object' &&
        m.value.value[0] !== null &&
        !(m.value.value[0] instanceof Duration)
      ) {
        m.value.value = (m.value.value as unknown as Array<{ secs: number; nanos: number }>).map(
          (d) => new Duration(d.secs, d.nanos)
        ) as [Duration, Duration, Duration, Duration]
      }
      break
  }
  return m
}

export function defaultMetric(key: MetricKey): Metric {
  switch (key) {
    case 'vus':
      return { type: key, time: DateTime.now(), value: 0 }
    case 'rps':
      return { type: key, time: DateTime.now(), value: 0 }
    case 'throughput':
      return { type: key, time: DateTime.now(), value: { upload: 0, download: 0 } }
    case 'success':
      return { type: key, time: DateTime.now(), value: 0 }
    case 'error':
      return { type: key, time: DateTime.now(), value: 0 }
    case 'responseTime':
      return { type: key, time: DateTime.now(), value: new Duration() }
    case 'counter':
      return { type: key, time: DateTime.now(), value: { tags: [], value: 0 } }
    case 'gauge':
      return { type: key, time: DateTime.now(), value: { tags: [], value: 0 } }
    case 'histogram':
      return { type: key, time: DateTime.now(), value: { tags: [], value: [0, 0, 0, 0] } }
  }
}

export interface ErrorMessage {
  type: 'generalError' | 'terminatedError'
  err: string
}

export interface CommonMessage {
  type: string
  executorId: number
  timestamp: number
}

export interface ExecutorStateFields {
  ended: boolean
  startTime?: DateTime
  totalDuration?: Duration
  stage?: number
  stageDuration?: Duration
}

export function patchExecutorStateFields(m: any): ExecutorStateFields {
  return {
    ...m,
    startTime: m.startTime ? DateTime.fromISO(m.startTime) : undefined,
    totalDuration: m.totalDuration ? Duration.fromObject(m.totalDuration) : undefined,
    stageDuration: m.stageDuration ? Duration.fromObject(m.stageDuration) : undefined
  }
}

export class ExecutorState implements ExecutorStateFields {
  executor: Executor
  ended: boolean
  startTime?: DateTime
  totalDuration?: Duration
  stage?: number
  stageDuration?: Duration
  metrics: Map<string, Metric[]>

  constructor(executor: Executor) {
    this.executor = executor
    this.ended = false
    this.startTime = undefined
    this.totalDuration = undefined
    this.stage = undefined
    this.stageDuration = undefined
    this.metrics = new Map<string, Metric[]>()
  }

  private static makeKey(tags: (MetricKey | string)[]): string {
    return JSON.stringify(tags)
  }

  getMetrics(key: MetricKey | string[]): Metric[] {
    if (Array.isArray(key)) {
      return this.metrics.get(ExecutorState.makeKey(key)) || []
    }
    return this.metrics.get(ExecutorState.makeKey([key])) || []
  }

  getCounters(): { tags: string[]; value: number }[] {
    const res: { tags: string[]; value: number }[] = []

    for (const metrics of this.metrics.values()) {
      if (metrics.length > 0 && metrics[0].type === 'counter') {
        const metric = metrics[metrics.length - 1]
        if (metric.type === 'counter') {
          res.push(metric.value)
        }
      }
    }

    return res
  }

  getHistograms(): { tags: string[]; value: number[] | Duration[] }[] {
    const res: { tags: string[]; value: number[] | Duration[] }[] = []

    for (const metrics of this.metrics.values()) {
      if (metrics.length > 0 && metrics[0].type === 'histogram') {
        const metric = metrics[metrics.length - 1]
        if (metric.type === 'histogram') {
          res.push(metric.value)
        }
      }
    }

    return res
  }

  getGauges(): Metric[][] {
    const res: Metric[][] = []
    for (const metrics of this.metrics.values()) {
      if (metrics.length > 0 && metrics[0].type === 'gauge') {
        res.push(metrics)
      }
    }
    return res
  }

  handleUpdate(m: (ExecutorStateFields | Metric) & CommonMessage) {
    if (m.type === 'executor') {
      const message = m as ExecutorStateFields
      this.ended = message.ended
      this.startTime = message.startTime
      this.totalDuration = message.totalDuration
      this.stage = message.stage
      this.stageDuration = message.stageDuration
    } else {
      const metric = m as Metric
      const insertIntoMetrics = (tags: (MetricKey | string)[]) => {
        const key = ExecutorState.makeKey(tags)
        if (!this.metrics.has(key)) {
          this.metrics.set(key, [metric])
        } else {
          const entry = this.metrics.get(key) as Metric[]
          entry.push(metric)
          if (entry.length > 100) {
            entry.shift()
          }
        }
      }

      switch (metric.type) {
        case 'counter': {
          insertIntoMetrics(['counter', ...metric.value.tags])
          break
        }
        case 'histogram': {
          insertIntoMetrics(['histogram', ...metric.value.tags])
          break
        }
        case 'gauge': {
          insertIntoMetrics(['gauge', ...metric.value.tags])
          break
        }
        case 'vus': {
          insertIntoMetrics(['vus'])
          break
        }
        case 'error': {
          insertIntoMetrics(['error'])
          break
        }
        case 'success': {
          insertIntoMetrics(['success'])
          break
        }
        case 'responseTime': {
          insertIntoMetrics(['responseTime'])
          break
        }
        case 'rps': {
          insertIntoMetrics(['rps'])
          break
        }
        case 'throughput': {
          insertIntoMetrics(['throughput'])
          break
        }
      }
    }
  }
}

export interface NodeInformation {
  name: string
  role: 'master' | 'worker'
  status: 'running' | 'idle'
  ip: string
}

export type RunState = 'running' | 'startable' | 'paused'

export type Scenario = {
  name: string
  executors: Executor[]
}

export namespace Scenario {
  export function fromObject(obj: any): Scenario {
    return {
      name: obj.name,
      executors: obj.executors.map(Executor.fromObject)
    }
  }
}

export type TestRunInfo = {
  runId: string
  startTime: DateTime
  endTime: DateTime
  duration: Duration
  status: 'completed' | 'failed' | 'stopped'
  scenario: Scenario[]
}
