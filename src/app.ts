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
    const additionalSeconds = Math.floor(this.nanos / 1e9)
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

type Attribute = [string, any]

class Rate {
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

namespace Executor {
  export function create(value: Executor): Executor {
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

export const enum MetricType {
  Counter = 'Counter',
  Gauge = 'Gauge',
  Histogram = 'Histogram'
}

export type MetricValue =
  | number
  | Duration
  | [[number, number, number, number], number]
  | [[Duration, Duration, Duration, Duration], Duration]

export namespace MetricValue {
  export function create(type: MetricType, value: MetricValue): MetricValue {
    function isDuration(x: any): x is Duration {
      return (
        typeof x == 'object' &&
        Object.prototype.hasOwnProperty.call(x, 'secs') &&
        Object.prototype.hasOwnProperty.call(x, 'nanos')
      )
    }

    switch (type) {
      case MetricType.Counter: {
        return value
      }
      case MetricType.Gauge: {
        if (isDuration(value)) {
          return new Duration(value.secs, value.nanos)
        }
        return value
      }
      case MetricType.Histogram: {
        const histogram_value = <
          | [[number, number, number, number], number]
          | [[Duration, Duration, Duration, Duration], Duration]
        >value
        if (isDuration(histogram_value[1])) {
          const percentiles = <[Duration, Duration, Duration, Duration]>histogram_value[0]
          const x = <[Duration, Duration, Duration, Duration]>(
            percentiles.map((x) => new Duration(x.secs, x.nanos))
          )
          return [x, new Duration(histogram_value[1].secs, histogram_value[1].nanos)]
        } else {
          return value
        }
      }
    }
  }
}

export class MetricSetKey {
  name: string
  metricType: MetricType
  attributes: Attribute[]

  constructor(name: string, metricType: MetricType, attributes: Attribute[]) {
    this.name = name
    this.metricType = metricType
    this.attributes = attributes
  }
}

interface TaskTimeMessage {
  type: 'TaskTime'
  executionId: number
  scenarioId: number
  duration: Duration
}

interface ExecutorStartMessage {
  type: 'ExecutorStart'
  id: number
  startTime: DateTime
  priorExecutorDuration: Duration
}

interface ExecutorUpdateMessage {
  type: 'ExecutorUpdate'
  id: number
  users: number
  maxUsers: number
  totalIteration?: number
  totalDuration?: Duration
  stage?: number
  stageDuration?: Duration
  stages?: number
  metrics: Array<[MetricSetKey, MetricValue]>
}

interface ExecutorEndMessage {
  type: 'ExecutorEnd'
  id: number
}

interface ErrorMessage {
  type: 'Error'
  err: string
}

interface TerminatedErrorMessage {
  type: 'TerminatedError'
  err: string
}

interface ScenarioChangedMessage {
  type: 'ScenarioChanged'
  scenarioId: number
}

interface EndMessage {
  type: 'End'
}

type Message =
  | TaskTimeMessage
  | ExecutorStartMessage
  | ExecutorUpdateMessage
  | ExecutorEndMessage
  | ErrorMessage
  | TerminatedErrorMessage
  | ScenarioChangedMessage
  | EndMessage

export class ExecutorState {
  ended: boolean
  config: Executor
  users: number
  maxUsers: number
  iterations: number
  totalIteration?: number
  priorDuration: Duration
  startTime?: DateTime
  totalDuration?: Duration
  stage?: number
  stageDuration?: Duration
  stages?: number
  taskMinTime: Duration
  taskMaxTime: Duration
  taskTotalTime: Duration
  metrics: [MetricSetKey, MetricValue[]][]

  constructor(json: {
    ended: boolean
    config: Executor
    users: number
    maxUsers: number
    iterations: number
    totalIteration?: number
    priorDuration: Duration
    startTime?: string
    totalDuration?: Duration
    stage?: number
    stageDuration?: Duration
    stages?: number
    taskMinTime: Duration
    taskMaxTime: Duration
    taskTotalTime: Duration
    metrics: [MetricSetKey, MetricValue[]][]
  }) {
    this.ended = json.ended
    this.config = Executor.create(json.config)
    this.users = json.users
    this.maxUsers = json.maxUsers
    this.iterations = json.iterations
    this.totalIteration = json.totalIteration
    this.priorDuration = new Duration(json.priorDuration.secs, json.priorDuration.nanos)
    this.startTime = json.startTime != undefined ? DateTime.fromISO(json.startTime) : undefined
    this.totalDuration =
      json.totalDuration != undefined
        ? new Duration(json.totalDuration.secs, json.totalDuration.nanos)
        : undefined
    this.stage = json.stage
    this.stageDuration =
      json.stageDuration != undefined
        ? new Duration(json.stageDuration.secs, json.stageDuration.nanos)
        : undefined
    this.stages = json.stages
    this.taskMinTime = new Duration(json.taskMinTime.secs, json.taskMinTime.nanos)
    this.taskMaxTime = new Duration(json.taskMaxTime.secs, json.taskMaxTime.nanos)
    this.taskTotalTime = new Duration(json.taskTotalTime.secs, json.taskTotalTime.nanos)
    this.metrics = json.metrics.map(([k, v]) => {
      const r = new MetricSetKey(k.name, k.metricType, k.attributes)
      return [r, v.map((value) => MetricValue.create(k.metricType, value))]
    })
  }

  duration(): LuxonDuration<true> {
    if (!this.startTime) {
      return this.priorDuration.to_luxon()
    }
    const durationSinceStart = DateTime.now().diff(this.startTime)
    return this.priorDuration.to_luxon().plus(durationSinceStart)
  }
}

class Scenario {
  name: string
  execs: ExecutorState[]

  constructor(name: string, execs: any[]) {
    this.name = name
    this.execs = execs.map((x) => new ExecutorState(x))
  }

  execNames(): string[] {
    return this.execs.map((exec) => exec.config.type)
  }
}

export class AppState {
  currentScenario: number
  scenarios: Scenario[]

  constructor(json: { currentScenario: number; scenarios: any[] }) {
    this.currentScenario = json.currentScenario
    this.scenarios = json.scenarios.map((x) => new Scenario(x.name, x.execs))
  }

  getCurrentScenario(): Scenario | undefined {
    return this.scenarios[this.currentScenario]
  }

  getCurrentExec(id: number): ExecutorState | undefined {
    return this.getCurrentScenario()?.execs[id]
  }

  handleMessage(message: Message) {
    switch (message.type) {
      case 'ScenarioChanged':
        this.currentScenario = message.scenarioId
        break
      case 'TaskTime': {
        const exec = this.getCurrentExec(message.executionId)
        if (exec == undefined) return
        exec.iterations += 1
        exec.taskMaxTime = exec.taskMaxTime.max(message.duration)
        if (exec.taskMinTime.secs === 0 && exec.taskMinTime.nanos === 0) {
          exec.taskMinTime = message.duration
        } else {
          exec.taskMinTime = exec.taskMinTime.min(message.duration)
        }
        exec.taskTotalTime = exec.taskTotalTime.add(message.duration)
        break
      }
      case 'ExecutorUpdate': {
        const exec = this.getCurrentExec(message.id)
        if (exec == undefined) return
        exec.users = message.users
        exec.maxUsers = message.maxUsers
        exec.totalIteration = message.totalIteration
        exec.totalDuration = message.totalDuration
        exec.stage = message.stage
        exec.stages = message.stages
        exec.stageDuration = message.stageDuration
        message.metrics.forEach(([key, value]) => {
          let entry = exec.metrics.findIndex(([k]) => k === key)
          if (entry == undefined) {
            exec.metrics.push([key, []])
            entry = exec.metrics.length
          }
          const metricList = exec.metrics[entry][1]
          if (metricList.length >= 20) {
            metricList.shift()
          }
          metricList.push(value)
        })
        break
      }
      case 'ExecutorStart': {
        const exec = this.getCurrentExec(message.id)
        if (exec == undefined) return
        exec.startTime = message.startTime
        exec.priorDuration = message.priorExecutorDuration
        break
      }
      case 'ExecutorEnd': {
        const exec = this.getCurrentExec(message.id)
        if (exec == undefined) return
        if (exec.startTime) {
          const now = DateTime.utc()
          const durationSinceStart = now.diff(exec.startTime)
          exec.priorDuration.secs += durationSinceStart.as('seconds')
          exec.priorDuration.nanos += durationSinceStart.as('millisecond') * 1e3
        }
        exec.startTime = undefined
        break
      }
      default:
        break
    }
  }
}
