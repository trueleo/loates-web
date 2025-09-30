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
import { Dictionary } from 'dictionaryjs'

import { Executor, ExecutorState, defaultMetric } from '@/app'
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
  console.log('Selected scenario info:', scenarioForView.value)

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
          console.log('Scenarios are up to date')
          return
        }

        data.scenarios.forEach((scenario) => {
          scenarios.value[scenario.name] = scenario.executors.map((exec) => Executor.create(exec))
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

      const data: (CommonMessage & (ErrorMessage | ExecutorStateFields | Metric))[] =
        await response.json()
      for (const item of data) {
        if (item.type === 'Error' || item.type === 'TerminationError') {
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
  let map = new Dictionary<number, TimeseriesRow<Metric>>()
  data.forEach((item) => {
    item.values.forEach((value) => {
      let time = value.time.toMillis()
      // @ts-ignore
      const row = map.getDefault(time, { time: time })
      row[item.name] = value
    })
  })

  let times: TimeseriesRow<Metric>[] = Array.from(map.values())
  times.sort((a, b) => a.time - b.time)

  const keys = data.map((item) => item.name)
  if (times.length === 0) return []

  for (const key of keys) {
    if (!Object.keys(times[0]).includes(key)) {
      times[0][key] = defaultMetric()
    }
  }

  for (let i = 1; i < times.length; i++) {
    for (const key of keys) {
      if (!Object.keys(times[i]).includes(key)) {
        times[i][key] = times[i - 1][key]
      }
    }
  }

  return times
}

function mapMetric<T>(data: TimeseriesRow<Metric>[], getter: (m: Metric) => T): TimeseriesRow<T>[] {
  if (data.length === 0) {
    return []
  }
  let keys = Object.keys(data[0]).filter((key) => key !== 'time')
  return data.map((row) => {
    // @ts-ignore
    let res: TimeseriesRow<T> = { time: row.time }
    keys.forEach((key) => {
      if (!Object.keys(row).includes(key)) {
        res[key] = getter(row[key])
      }
    })
    return res
  })
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
  const mappedData = mapMetric(data, (m) =>
    m.type === 'throughput' ? m.value : { upload: 0, download: 0 }
  )

  mappedData.map((row) =>
    Object.entries(row)
      .filter(([key]) => key == 'time')
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

const overviewPlot = {
  title: 'Performance',
  data: [
    { time: 0, vus: 1000, errorRate: 0, responseTime: 100 },
    { time: 1, vus: 1000, errorRate: 0, responseTime: 100 },
    { time: 2, vus: 99, errorRate: 1, responseTime: 140 },
    { time: 3, vus: 98, errorRate: 2, responseTime: 150 },
    { time: 4, vus: 97, errorRate: 3, responseTime: 160 },
    { time: 5, vus: 95, errorRate: 5, responseTime: 100 },
    { time: 6, vus: 96, errorRate: 4, responseTime: 100 },
    { time: 7, vus: 96, errorRate: 4, responseTime: 100 },
    { time: 8, vus: 95, errorRate: 5, responseTime: 100 },
    { time: 9, vus: 94, errorRate: 6, responseTime: 100 }
  ]
}

const counters = [
  { tags: ['PUT', 'example.com'], value: 10 },
  { tags: ['GET', 'example.com'], value: 10 },
  { tags: ['POST', 'example.com'], value: 20 }
]

const metrics = [
  {
    tags: ['PUT', 'example.com'],
    type: 'histogram',
    value: [
      {
        name: 'p99',
        value: 90
      },
      {
        name: 'p90',
        value: 80
      },
      {
        name: 'p75',
        value: 70
      },
      {
        name: 'p50',
        value: 60
      }
    ]
  },
  {
    tags: ['GET', 'example.com'],
    type: 'histogram',
    value: [
      {
        name: 'p99',
        value: 90
      },
      {
        name: 'p90',
        value: 80
      },
      {
        name: 'p75',
        value: 70
      },
      {
        name: 'p50',
        value: 60
      }
    ]
  },
  {
    tags: ['GET', 'example.com'],
    type: 'gauge',
    value: [
      {
        time: 1,
        value: 100
      },
      {
        time: 2,
        value: 99
      },
      {
        time: 3,
        value: 98
      },
      {
        time: 4,
        value: 97
      },
      {
        time: 5,
        value: 95
      },
      {
        time: 6,
        value: 96
      },
      {
        time: 7,
        value: 96
      },
      {
        time: 8,
        value: 95
      },
      {
        time: 9,
        value: 94
      }
    ]
  }
]
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
          :category="item.data[0] ? Object.keys(item.data[0]).filter((key) => key !== 'time') : []"
          :area="item.data[0] ? Object.keys(item.data[0]).filter((key) => key !== 'time') : []"
          class="flex-grow"
        />
      </div>

      <div class="flex items-center justify-center gap-4 w-full">
        <LineChartInfoComponent
          :overlay="overviewPlot.title"
          :data="overviewPlot.data"
          :index="'time'"
          :category="['vus', 'errorRate', 'responseTime']"
          :area="['vus']"
          showGridLine
          showLegend
          class="flex-grow h-52 p-4"
        />
      </div>
      <div class="flex-grow flex flex-col justify-start items-start border-1 rounded gap-2 p-2">
        <div class="inline-flex flex-wrap gap-2">
          <CounterComponent
            v-for="(item, index) in counters"
            :key="index"
            :tags="item.tags"
            :count="item.value"
          />
        </div>
        <div class="flex flex-wrap gap-x-2 gap-y-4 w-full">
          <template v-for="(item, index) in metrics" :key="index">
            <MetricHistogram
              v-if="item.type === 'histogram'"
              :tags="item.tags"
              :data="item.value"
              :category="['value']"
              :index="'value'"
              showAxisX
              showAxisY
              class="h-44 w-xl"
            />
            <MetricGauge
              v-else-if="item.type === 'gauge'"
              :tags="item.tags"
              :data="item.value"
              :index="'time'"
              :category="['value']"
              :area="['value']"
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
