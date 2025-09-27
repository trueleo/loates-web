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

import { ref, computed, onMounted, type Ref } from 'vue'
import { DateTime } from 'luxon'

import { Executor } from '@/app'
import { scenarioInfo } from '@/lib/utils'
import type { RunState } from '@/app'
import { Skeleton } from '@/components/ui/skeleton'

const status = ref('startable' as RunState)
const scenarios: Ref<
  {
    name: string
    startTime: DateTime | null
    executors: Executor[]
  }[]
> = ref([])

const scenarioNames = computed(() => scenarios.value.map((s) => s.name))
const currentScenario: Ref<number | null> = ref(null)
const currentScenarioInfo = computed(() =>
  currentScenario.value != null ? scenarioInfo(scenarios.value[currentScenario.value]) : null
)

onMounted(() => {
  try {
    fetch('/api/test_information')
      .then((response) => response.json())
      .then((data) => {
        status.value = data.status
        scenarios.value = data.scenarios.map((scenario: any) => ({
          name: scenario.name,
          startTime: DateTime.fromISO(scenario.startTime),
          executors: scenario.executors.map((executor: Executor) => Executor.create(executor))
        }))
        currentScenario.value = data.currentScenario
      })
  } catch (error) {
    console.error('Error initializing scenarios:', error)
  }
})

const infoRow1 = [
  {
    title: 'VUs',
    data: [
      { x: 0, y: 0 },
      { x: 1, y: 10 },
      { x: 2, y: 30 },
      { x: 3, y: 50 },
      { x: 4, y: 70 },
      { x: 5, y: 80 },
      { x: 6, y: 78 },
      { x: 7, y: 75 },
      { x: 8, y: 72 },
      { x: 9, y: 70 } // Test is still running, VUs are active
    ]
  },
  {
    title: 'RPS',
    data: [
      { x: 0, y: 0 },
      { x: 1, y: 5 },
      { x: 2, y: 20 },
      { x: 3, y: 35 },
      { x: 4, y: 45 },
      { x: 5, y: 50 },
      { x: 6, y: 49 },
      { x: 7, y: 47 },
      { x: 8, y: 46 },
      { x: 9, y: 45 } // Test is still running, RPS are active
    ]
  },
  {
    title: 'Throughput',
    data: [
      { x: 0, y: 0 },
      { x: 1, y: 50 },
      { x: 2, y: 200 },
      { x: 3, y: 350 },
      { x: 4, y: 450 },
      { x: 5, y: 500 },
      { x: 6, y: 490 },
      { x: 7, y: 470 },
      { x: 8, y: 460 },
      { x: 9, y: 450 } // Test is still running, throughput is active
    ]
  },
  {
    title: 'Success Rate',
    data: [
      { x: 0, y: 100 },
      { x: 1, y: 100 },
      { x: 2, y: 99 },
      { x: 3, y: 98 },
      { x: 4, y: 97 },
      { x: 5, y: 95 },
      { x: 6, y: 96 },
      { x: 7, y: 96 },
      { x: 8, y: 95 },
      { x: 9, y: 94 } // Still running, might have some fluctuations
    ]
  },
  {
    title: 'Error Rate',
    data: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 1 },
      { x: 3, y: 2 },
      { x: 4, y: 3 },
      { x: 5, y: 5 },
      { x: 6, y: 4 },
      { x: 7, y: 4 },
      { x: 8, y: 5 },
      { x: 9, y: 6 } // Still running, might have some errors
    ]
  }
]

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
        {{ currentScenario != null && scenarios.length > 0 ? scenarios[currentScenario].name : '' }}
      </div>
      <Select
        v-if="currentScenario != null && scenarios.length > 0"
        :default-value="scenarioNames[currentScenario]"
        v-model:model-value="currentScenario"
      >
        <SelectTrigger class="w-[280px]">
          <SelectValue placeholder="Scenario" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="(item, index) in scenarioNames" :key="index" :value="index">{{
            item
          }}</SelectItem>
        </SelectContent>
      </Select>

      <!-- Run and Configure Buttons -->
      <div class="flex flex-shrink-0 gap-2">
        <Button variant="outline">Configure</Button>
        <Button>Run</Button>
      </div>
    </header>

    <template v-if="currentScenarioInfo != null">
      <div class="flex items-center gap-6 text-sm mb-2">
        <TestStatusComponent :status="status" />
        <TestInfoComponent
          v-for="({ icon, title, value }, index) in currentScenarioInfo"
          :key="index"
          :icon="icon"
          :text="title"
          :value="value"
        />
      </div>
    </template>

    <template v-if="currentScenario">
      <div class="flex items-center justify-center gap-4 w-full not-lg:flex-wrap">
        <LineChartInfoComponent
          v-for="(item, index) in infoRow1"
          :key="index"
          :overlay="item.title"
          :data="item.data"
          :index="'x'"
          :category="['y']"
          :area="['y']"
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
