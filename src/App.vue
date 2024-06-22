<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { AppState, Duration, ExecutorState, MetricType } from './app'
import ExecutorComponent from './components/ExecutorComponent.vue'
import InfoComponent from './components/InfoComponent.vue'
import MetricComponent from './components/MetricComponent.vue'

import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue'

import ScenarioDisplay from './components/ScenarioDisplay.vue'

const app = reactive({
  state: new AppState({
    currentScenario: 0,
    scenarios: []
  })
})

let manually_selected = ref(0)

watch(
  () => app.state.currentScenario,
  (current, old) => {
    if (old != current) {
      manually_selected.value = current
    }
  }
)

onMounted(async () => {
  const eventSource = new EventSource('http://localhost:3000/updates')

  eventSource.onmessage = function (event) {
    app.state = new AppState(JSON.parse(event.data))
    console.log(JSON.parse(event.data))
    if (
      app.state.currentScenario == app.state.scenarios.length - 1 &&
      app.state.scenarios[app.state.currentScenario].execs.every((exec) => exec.ended)
    ) {
      eventSource.close()
    }
  }

  eventSource.onerror = function (event) {
    eventSource.close()
    console.error('EventSource failed:', event)
  }
})

const started = (exec: ExecutorState) => {
  return (
    exec.startTime != undefined && exec.priorDuration.nanos == 0 && exec.priorDuration.secs == 0
  )
}

const paused = (exec: ExecutorState) => {
  return exec.ended != true && exec.startTime == null && exec.startTime == undefined
}
</script>

<template>
  <TabGroup :selected-index="manually_selected" :default-index="0">
    <header
      class="flex w-full justify-between items-center p-4 pl-8 bg-gray-950 gap-2 text-gray-50"
    >
      <p>
        <span class="pi pi-chart-bar text-4xl font-light"></span>
        &nbsp;
        <span class="text-4xl font-light jetbrains">Rusher</span>
      </p>
      <TabList class="flex justify-center items-stretch gap-4 overflow-x-scroll w-fit">
        <Tab
          v-for="(scenario, index) in app.state.scenarios"
          :key="index"
          v-slot="{ selected }"
          @click="manually_selected = index"
        >
          <ScenarioDisplay
            :name="scenario.name"
            :execs="scenario.execNames()"
            :duration="
              scenario.execs
                .map((exec) => {
                  return exec.totalDuration ? exec.totalDuration : Duration.ZERO
                })
                .reduce((x, y) => x.add(y))
                .to_luxon()
            "
            :selected="selected"
          />

          <!-- <button
            :class="[
              '',
              'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
             
            ]"
          >
            {{ scenario.name }}
          </button> -->
        </Tab>
      </TabList>
    </header>

    <TabPanels class="pt-4 px-2 min-w-full text-gray-50">
      <TabPanel
        v-for="(scenario, index) in app.state.scenarios"
        :key="index"
        class="flex flex-row min-w-full justify-center gap-5"
      >
        <div
          class="rounded-lg border-1 bg-black/40 flex flex-col justify-start items-stretch flex-grow min-w-[35rem] max-w-[70rem]"
          v-for="(exec, index) in scenario.execs"
          :key="index"
        >
          <ExecutorComponent class="bg-black/20 rounded-t-2xl min-w-max" :state="exec" />
          <div
            v-if="started(exec) || !paused(exec)"
            class="py-2 px-4 flex justify-start items-start flex-wrap gap-y-6"
          >
            <InfoComponent :state="exec" class="min-w-max max-h-max flex-[2]" />
            <div class="flex flex-col gap-y-2 text-gray-300 min-w-[30rem] flex-[3]">
              <MetricComponent
                :metrics="
                  exec.metrics.filter((metric) => metric[0].metricType == MetricType.Counter)
                "
              />
              <MetricComponent
                :metrics="
                  exec.metrics.filter((metric) => metric[0].metricType == MetricType.Histogram)
                "
              />
              <MetricComponent
                :metrics="exec.metrics.filter((metric) => metric[0].metricType == MetricType.Gauge)"
              />
            </div>
          </div>
          <div v-else-if="paused(exec)" class="text-center my-8">has not started yet</div>
        </div>
      </TabPanel>
    </TabPanels>
  </TabGroup>
</template>

<style scoped></style>
