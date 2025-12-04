<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { SidebarTrigger } from '@/components/ui/sidebar'

import LineChartInfoComponent from '@/components/LineChartInfoComponent.vue'
import CounterComponent from '@/components/CounterComponent.vue'
import MetricHistogram from '@/components/MetricHistogram.vue'
import MetricGauge from '@/components/MetricGauge.vue'
import TestStatusComponent from '@/components/TestStatusComponent.vue'
import TestInfoComponent from '@/components/TestInfoComponent.vue'

import { ref, computed, onMounted, type Ref, reactive, onUnmounted, type Reactive } from 'vue'
import { DateTime, Duration as LuxonDuration } from 'luxon'

import {
  Executor,
  ExecutorState,
  defaultMetric,
  patchExecutorStateFields,
  patchMetric
} from '@/app'
import { scenarioInfo } from '@/lib/utils'
import type { RunState, CommonMessage, ExecutorStateFields, ErrorMessage, Metric } from '@/app'
import { Skeleton } from '@/components/ui/skeleton'

const status = ref('startable' as RunState)
const scenarios = ref<{
  [key: string]: Executor[]
}>({})

const scenarioStates: Reactive<{
  [key: string]: {
    running: boolean
    startTime: DateTime
    nextUpdate: number
    executorStates: ExecutorState[]
  }
}> = reactive({})

const scenarioNames = computed(() => Object.keys(scenarios.value))
const currentScenario = computed(() => {
  if (!scenarioNames.value.length) return null
  const running = Object.entries(scenarioStates)
    .filter(([, state]) => state.running)
    .map(([name]) => name)
  return running.length > 0 ? running[running.length - 1] : scenarioNames.value[0]
})

const _selectedView: Ref<string | null> = ref(null)
let scenarioSelectMode = ref(false)
const scenarioForView: Ref<string | null> = computed({
  get: () => {
    if (scenarioSelectMode.value) {
      return _selectedView.value
    }
    return currentScenario.value
  },
  set: (value) => {
    _selectedView.value = value
    scenarioSelectMode.value = true
  }
})

const selectedScenarioInfo = computed(() => {
  return scenarioForView.value != null
    ? scenarioInfo({
        name: scenarioForView.value,
        startTime: scenarioStates[scenarioForView.value].startTime,
        executors: scenarios.value[scenarioForView.value]
      })
    : null
})

async function testInfo() {
  type Data = {
    status: RunState
    scenarios: { name: string; startTime: string; running: boolean; executors: Executor[] }[]
  }

  try {
    fetch('/api/test_information')
      .then((response) => response.json())
      .then((data: Data) => {
        status.value = data.status

        const this_scenarios = Object.keys(scenarios.value).sort((a, b) => a.localeCompare(b))
        const data_scenarios = data.scenarios
          .map((scenario) => scenario.name)
          .sort((a, b) => a.localeCompare(b))

        if (
          this_scenarios.length === data_scenarios.length &&
          this_scenarios.every((scenario, index) => scenario === data_scenarios[index])
        ) {
          return
        }

        data.scenarios.forEach((scenario) => {
          scenarios.value[scenario.name] = scenario.executors.map((exec) =>
            Executor.fromObject(exec)
          )
        })
        data.scenarios.forEach((scenario) => {
          scenarioStates[scenario.name] = {
            running: scenario.running,
            startTime: DateTime.fromISO(scenario.startTime),
            nextUpdate: 0,
            executorStates: scenarios.value[scenario.name].map(
              (executor) => new ExecutorState(executor)
            )
          }
        })
      })
  } catch (error) {
    console.error('Error initializing scenarios:', error)
  }
}

const lastAllUpdate = ref<DateTime | undefined>(undefined)
async function pollExecutorUpdates() {
  if (lastAllUpdate.value === undefined) {
    lastAllUpdate.value = DateTime.now()
  }

  // if no scenario is running then do not poll
  if (currentScenario.value == null) {
    return
  }

  const updateScenario = [currentScenario.value]

  if (DateTime.now().diff(lastAllUpdate.value) > LuxonDuration.fromObject({ seconds: 30 })) {
    updateScenario.push(
      ...scenarioNames.value.filter((scenario) => scenario !== currentScenario.value)
    )
    lastAllUpdate.value = DateTime.now()
  }

  for (const scenarioName of updateScenario) {
    try {
      let scenario = scenarios.value[scenarioName]
      let nextupdate = scenarioStates[scenarioName].nextUpdate

      if (!scenario) {
        console.error(`Scenario ${scenarioName} not found`)
        continue
      }

      const response = await fetch(`/api/updates/${scenarioName}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-timestamp': nextupdate.toString()
        }
      })

      const _data: (CommonMessage & (ErrorMessage | ExecutorStateFields | Metric))[] =
        await response.json()

      const data = _data.map((item) => {
        if (item.type == 'executor') {
          return patchExecutorStateFields(item) as ExecutorStateFields & CommonMessage
        } else if (
          [
            'vus',
            'throughput',
            'rps',
            'success',
            'error',
            'counter',
            'responseTime',
            'gauge',
            'histogram'
          ].some((type) => type === item.type)
        ) {
          return patchMetric(item) as Metric & CommonMessage
        }
        return item as ErrorMessage & CommonMessage
      })

      for (const item of data) {
        if (item.type === 'generalError' || item.type === 'terminatedError') {
          console.log(item)
        } else {
          const executorId: number = item.executorId
          scenarioStates[scenarioName].executorStates[executorId].handleUpdate(
            item as (ExecutorStateFields | Metric) & CommonMessage
          )
        }
        scenarioStates[scenarioName].nextUpdate = item.timestamp + 1
      }
    } catch (error) {
      console.error('Error updating executor states:', error)
    }
  }
}

async function runTest() {
  try {
    await fetch('/api/command/start', {
      method: 'POST'
    })
    status.value = 'running'
  } catch (error) {
    console.error('Error running test:', error)
  }
}

async function stopTest() {
  try {
    await fetch('/api/command/stop', {
      method: 'POST'
    })
    status.value = 'startable'
  } catch (error) {
    console.error('Error stopping test:', error)
  }
}

async function pauseTest() {
  try {
    await fetch('/api/command/pause', {
      method: 'POST'
    })
    status.value = 'paused'
  } catch (error) {
    console.error('Error pausing test:', error)
  }
}

const testInfoFetch = ref()
const pollExecutorFetch = ref()

onMounted(() => {
  testInfo()
  testInfoFetch.value = window.setInterval(testInfo, 2000)
  pollExecutorFetch.value = window.setInterval(pollExecutorUpdates, 2000)
})

onUnmounted(() => {
  window.clearInterval(testInfoFetch.value)
  window.clearInterval(pollExecutorFetch.value)
})

type TimeseriesRow<M> = {
  time: number
} & {
  [key: string]: M
}

function timeseries(
  data: { name: string; values: Metric[] }[],
  defaultMetric: () => Metric
): TimeseriesRow<Metric>[] {
  let map = new Map<number, TimeseriesRow<Metric>>()
  let doNumericSuffix = data.some((d) => {
    data.filter((x) => x.name === d.name).length > 1
  })

  // Populate the map with initial values from the input data
  data.forEach((item, index) => {
    item.values.forEach((value) => {
      const time = value.time.toMillis()
      let row = map.get(time)
      if (!row) {
        // If a row for this timestamp doesn't exist, create it.
        // Cast to TimeseriesRow<Metric> to ensure type compatibility for subsequent assignments.
        row = { time: time } as TimeseriesRow<Metric>
        map.set(time, row)
      }

      if (doNumericSuffix) {
        row[item.name + index.toString()] = value
      } else {
        row[item.name] = value
      }
    })
  })

  // Convert the map values to an array and sort them by time
  let times: TimeseriesRow<Metric>[] = Array.from(map.values())
  times.sort((a, b) => a.time - b.time)

  // Extract all unique scenario names (keys) from the input data
  const keys = data.map((item, index) => {
    if (doNumericSuffix) {
      return item.name + index.toString()
    } else {
      return item.name
    }
  })
  if (times.length === 0) {
    // If no timeseries data, return an empty array
    return []
  }

  // Ensure the first row has all keys, filling with a default metric if missing
  const firstRow = times[0]
  for (const key of keys) {
    if (!(key in firstRow)) {
      firstRow[key] = defaultMetric()
    }
  }

  // For subsequent rows, fill in any missing metric values with the value from the previous row
  for (let i = 1; i < times.length; i++) {
    const currentRow = times[i]
    const previousRow = times[i - 1]
    for (const key of keys) {
      if (!(key in currentRow)) {
        currentRow[key] = previousRow[key]
      }
    }
  }

  // @ts-ignore
  times.unshift({
    time: times[0].time - 1,
    ...keys.reduce((acc, key) => ({ ...acc, [key]: defaultMetric() }), {})
  })

  return times
}

function mapMetric<T>(data: TimeseriesRow<Metric>[], getter: (m: Metric) => T): TimeseriesRow<T>[] {
  return data.map((row) => {
    for (const key of Object.keys(row).filter((key) => key !== 'time')) {
      // @ts-ignore
      row[key] = getter(row[key])
    }
    return row
  }) as TimeseriesRow<T>[]
}

const infoVus = computed(() => {
  if (scenarioForView.value === null) return []
  let scenario = scenarioForView.value
  const data = timeseries(
    scenarioStates[scenario].executorStates.map((item) => ({
      name: item.executor.type,
      values: item.getMetrics('vus')
    })),
    () => defaultMetric('vus')
  )
  return mapMetric(data, (m) => (m.type === 'vus' ? m.value : 0))
})

const infoRps = computed(() => {
  if (scenarioForView.value === null) return []
  let scenario = scenarioForView.value
  const data = timeseries(
    scenarioStates[scenario].executorStates.map((item) => ({
      name: item.executor.type,
      values: item.getMetrics('rps')
    })),
    () => defaultMetric('rps')
  )
  return mapMetric(data, (m) => (m.type === 'rps' ? m.value : 0))
})

const infoThroughput = computed(() => {
  if (scenarioForView.value === null) return []
  let scenario = scenarioForView.value
  const data = timeseries(
    scenarioStates[scenario].executorStates.map((item) => ({
      name: item.executor.type,
      values: item.getMetrics('throughput')
    })),
    () => defaultMetric('throughput')
  )
  const _mappedData = mapMetric(data, (m) =>
    m.type === 'throughput' ? m.value : { upload: 0, download: 0 }
  )

  const mappedData = _mappedData.map((row) =>
    Object.entries(row)
      .filter(([key]) => key !== 'time')
      .reduce(
        (acc, [, value]: [string, any]) => {
          acc.upload += value.upload
          acc.download += value.download
          return acc
        },
        { time: row.time, upload: 0, download: 0 }
      )
  )

  return mappedData
})

const infoResponseTime = computed(() => {
  if (scenarioForView.value === null) return []
  let scenario = scenarioForView.value
  const data = timeseries(
    scenarioStates[scenario].executorStates.map((item) => ({
      name: item.executor.type,
      values: item.getMetrics('responseTime')
    })),
    () => defaultMetric('responseTime')
  )
  return mapMetric(data, (m) => (m.type === 'responseTime' ? m.value.to_luxon().toMillis() : 0))
})

const infoSuccess = computed(() => {
  if (scenarioForView.value === null) return []
  let scenario = scenarioForView.value
  const data = timeseries(
    scenarioStates[scenario].executorStates.map((item) => ({
      name: item.executor.type,
      values: item.getMetrics('success')
    })),
    () => defaultMetric('success')
  )

  return mapMetric(data, (m) => (m.type === 'success' ? m.value : 0))
})

const infoError = computed(() => {
  if (scenarioForView.value === null) return []
  let scenario = scenarioForView.value
  const data = timeseries(
    scenarioStates[scenario].executorStates.map((item) => ({
      name: item.executor.type,
      values: item.getMetrics('error')
    })),
    () => defaultMetric('error')
  )

  return mapMetric(data, (m) => (m.type === 'error' ? m.value : 0))
})

const info1 = ref([
  { title: 'Vus', data: infoVus },
  { title: 'RPS', data: infoRps },
  { title: 'Throughput', data: infoThroughput },
  { title: 'Success', data: infoSuccess },
  { title: 'Error', data: infoError }
])

function mergeMetrics(data: { metric: string; values: TimeseriesRow<any>[] }[]) {
  let map = new Map<number, TimeseriesRow<any>>()

  data.forEach((item) => {
    item.values.forEach((value) => {
      const time = value.time
      let row = map.get(time)
      if (!row) {
        row = { time: time } as TimeseriesRow<any>
        map.set(time, row)
      }
      Object.entries(value)
        .filter(([key]) => key !== 'time')
        .forEach(([key, value]) => {
          row[item.metric + '_' + key] = value
        })
    })
  })

  let times: TimeseriesRow<any>[] = Array.from(map.values())
  times.sort((a, b) => a.time - b.time)

  const keys: string[] = []
  times.forEach((row) => {
    Object.keys(row)
      .filter((key) => key !== 'time')
      .forEach((key) => {
        if (!keys.includes(key)) {
          keys.push(key)
        }
      })
  })

  if (times.length === 0) {
    return []
  }

  const firstRow = times[0]
  for (const key of keys) {
    if (!(key in firstRow)) {
      firstRow[key] = 0
    }
  }

  for (let i = 1; i < times.length; i++) {
    const currentRow = times[i]
    const previousRow = times[i - 1]
    for (const key of keys) {
      if (!(key in currentRow)) {
        currentRow[key] = previousRow[key]
      }
    }
  }

  return times
}

const overviewPlot = computed(() => {
  return {
    title: 'Performance',
    data: mergeMetrics([
      { metric: 'vus', values: infoVus.value },
      { metric: 'responseTime', values: infoResponseTime.value },
      { metric: 'error', values: infoError.value }
    ])
  }
})

const counters = computed(() => {
  if (scenarioForView.value === null) return []
  let scenario = scenarioForView.value
  const data = scenarioStates[scenario].executorStates.map((item) => ({
    name: item.executor.type,
    values: item.getCounters()
  }))

  const doNumericSuffix = data.some((d) => {
    data.filter((item) => item.name === d.name).length > 1
  })

  if (doNumericSuffix) {
    return data.map((item, index) => {
      item.name += '_' + index
      return item
    })
  } else {
    return data
  }
})

const histograms = computed(() => {
  if (scenarioForView.value === null) return []
  let scenario = scenarioForView.value
  const data = scenarioStates[scenario].executorStates.map((item) => ({
    name: item.executor.type,
    values: item.getHistograms().map((histogram) => ({
      tags: histogram.tags,
      value: [
        {
          name: 'p99',
          value: histogram.value[3]
        },
        {
          name: 'p90',
          value: histogram.value[2]
        },
        {
          name: 'p75',
          value: histogram.value[1]
        },
        {
          name: 'p50',
          value: histogram.value[0]
        }
      ]
    }))
  }))

  const doNumericSuffix = data.some((d) => {
    data.filter((item) => item.name === d.name).length > 1
  })

  if (doNumericSuffix) {
    return data.map((item, index) => {
      item.name += '_' + index
      return item
    })
  } else {
    return data
  }
})

const gauges = computed(() => {
  if (scenarioForView.value === null) return []
  let scenario = scenarioForView.value
  const data = scenarioStates[scenario].executorStates.map((item) => ({
    name: item.executor.type,
    values: item.getGauges()
  }))

  const doNumericSuffix = data.some((d) => {
    data.filter((item) => item.name === d.name).length > 1
  })

  const flattened = data.flatMap((item, index) => {
    let name = item.name
    if (doNumericSuffix) {
      name += '_' + index
    }

    function assertMetricIsGauge(
      metric: Metric[]
    ): asserts metric is Extract<Metric, { type: 'gauge' }>[] {
      if (metric.some((m) => m.type != 'gauge'))
        throw new Error(`Expected gauge metric, got ${metric}`)
    }

    return item.values.map((value: Metric[]) => {
      assertMetricIsGauge(value)
      return value.map((metric) => {
        const thisName = [name, ...metric.value.tags]
        return {
          tags: thisName,
          value: metric.value.value
        }
      })
    })
  })

  return flattened
})
</script>

<template>
  <div class="w-full min-h-full flex flex-col p-4 g gap-2">
    <header class="flex justify-start items-center gap-2">
      <SidebarTrigger class="ml-1 bg-secondary" />
      <div class="flex-shrink-0 font-semibold text-md mx-auto">
        {{ scenarioForView ? scenarioForView : '' }}
      </div>
      <Select
        v-if="scenarioForView"
        :default-value="scenarioForView"
        v-model:model-value="scenarioForView"
      >
        <SelectTrigger class="w-[280px]">
          <SelectValue placeholder="Scenario" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="item in scenarioNames" :key="item" :value="item">{{
            item
          }}</SelectItem>
        </SelectContent>
      </Select>

      <!-- Run and Configure Buttons -->
      <div class="flex flex-shrink-0 gap-2">
        <Button variant="outline">Configure</Button>
        <Button @click="runTest" v-if="status === 'startable'">Run</Button>
        <Button @click="pauseTest" v-if="status === 'running'">Pause</Button>
        <Button @click="runTest" v-if="status === 'paused'">Resume</Button>
        <Button @click="stopTest" v-if="status === 'running'" variant="destructive">Stop</Button>
      </div>
    </header>

    <template v-if="selectedScenarioInfo != null">
      <div class="flex items-center gap-6 text-sm mb-2">
        <TestStatusComponent :status="status" />
        <TestInfoComponent
          v-for="({ icon, title, value }, index) in selectedScenarioInfo"
          :key="index"
          :icon="icon"
          :text="title"
          :value="value"
        />
      </div>
    </template>

    <template v-if="scenarioForView">
      <div class="flex items-center justify-center gap-4 w-full not-lg:flex-wrap">
        <LineChartInfoComponent
          v-for="(item, index) in info1"
          :key="index"
          :overlay="item.title"
          :data="item.data"
          :index="'time'"
          :category="
            item.data.length ? Object.keys(item.data[0]).filter((key) => key !== 'time') : []
          "
          :area="item.data.length ? Object.keys(item.data[0]).filter((key) => key !== 'time') : []"
          :xFormatter="
            (tick: number | Date, i, ticks) => {
              if (tick instanceof Date) {
                return tick.toLocaleString()
              } else {
                return DateTime.fromMillis(tick).toLocaleString(DateTime.DATETIME_SHORT)
              }
            }
          "
          class="flex-grow"
        />
      </div>

      <div class="flex items-center justify-center gap-4 w-full">
        <LineChartInfoComponent
          :overlay="overviewPlot.title"
          :data="overviewPlot.data"
          :index="'time'"
          :category="
            overviewPlot.data.length
              ? Object.keys(overviewPlot.data[0]).filter((key) => key !== 'time')
              : []
          "
          :area="
            overviewPlot.data.length
              ? Object.keys(overviewPlot.data[0]).filter((key) => key !== 'time')
              : []
          "
          :xFormatter="
            (tick: number | Date, i, ticks) => {
              if (tick instanceof Date) {
                return tick.toLocaleString()
              } else {
                return DateTime.fromMillis(tick).toLocaleString(DateTime.DATETIME_SHORT)
              }
            }
          "
          showGridLine
          showLegend
          class="flex-grow h-52 p-4"
        />
      </div>
      <div class="flex-grow flex flex-col justify-start items-start border-1 rounded gap-2 p-2">
        <div class="inline-flex flex-wrap gap-2">
          <template v-for="executor in counters">
            <CounterComponent
              v-for="(item, index) in executor.values"
              :key="index"
              :tags="[executor.name, ...item.tags]"
              :count="item.value"
            />
          </template>
        </div>
        <div class="flex flex-wrap gap-x-2 gap-y-4 w-full">
          <template v-for="(item, index) in gauges" :key="index">
            <MetricGauge
              :tags="item.length ? item[0].tags : []"
              :data="item"
              :index="'time'"
              :category="['value']"
              :area="['value']"
              showAxisX
              showAxisY
              class="h-44 w-xl"
            />
          </template>

          <template v-for="(item, index) in histograms" :key="index">
            <MetricHistogram
              v-for="(histogram, index) in item.values"
              :key="index"
              :tags="[item.name, ...histogram.tags]"
              :data="histogram.value"
              :category="['value']"
              :index="'value'"
              showAxisX
              showAxisY
              class="h-44 w-xl"
            />
          </template>
        </div>
      </div>
    </template>

    <div
      v-else
      class="flex flex-grow mt-2 justify-start flex-col items-center border-1 rounded gap-2 p-2"
    >
      <div class="w-full flex justify-stretch items-center h-44 gap-2">
        <Skeleton class="flex-1 h-44" v-for="(_, index) in 4" :key="index" />
      </div>
      <Skeleton class="h-44 w-full" />
      <Skeleton class="h-52 w-full" />
    </div>
  </div>
</template>

<style scoped></style>
