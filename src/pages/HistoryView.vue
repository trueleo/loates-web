<script setup lang="ts">
import { ref, computed, type Ref } from 'vue'
import { computedAsync } from '@vueuse/core'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { RangeCalendar } from '@/components/ui/range-calendar'
import { Button } from '@/components/ui/button'
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable'
import TestInfoComponent from '@/components/TestInfoComponent.vue'

import {
  Calendar,
  Check,
  CheckCircle,
  Clock,
  IdCard,
  Repeat2,
  User,
  Users,
  XCircle
} from 'lucide-vue-next'
import type { DateRange } from 'reka-ui'
import { getLocalTimeZone, today } from '@internationalized/date'
import { DateTime } from 'luxon'

import { Executor, type TestRunInfo } from '@/app'
import { Scenario, Duration, toHuman } from '@/app'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel'
import { Badge } from '@/components/ui/badge'

const end = today(getLocalTimeZone()).add({ days: 1 })
const start = end.subtract({ days: 7 })

const range = ref({
  start,
  end
}) as Ref<DateRange>

const minDate = ref(new Date(2025, 0, 1))
const maxDate = ref(new Date())

const loadTests: Ref<TestRunInfo[]> = computedAsync(async (onCancel) => {
  const abortController = new AbortController()
  onCancel(() => abortController.abort())

  let url = '/api/history'
  if (range.value.start && range.value.end) {
    url += `?start=${range.value.start.toString()}&end=${range.value.end.toString()}&timezone=${getLocalTimeZone()}`
  }
  return await fetch(url, { signal: abortController.signal })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      return response.json()
    })
    .then((data) => {
      return data.map((item: any) => ({
        ...item,
        duration: Duration.fromObject(item.duration),
        startTime: DateTime.fromISO(item.startTime),
        endTime: DateTime.fromISO(item.endTime),
        scenario: item.scenario.map(Scenario.fromObject)
      }))
    })
    .catch((error) => {
      console.error('Error fetching data:', error)
      return []
    })
}, [])

const showCompleted = ref(true)
const showFailed = ref(true)

const selectedLoadTest = ref<TestRunInfo | null>(null)

const toggleStatusFilter = (statusType: 'Completed' | 'Failed') => {
  if (statusType === 'Completed') {
    showCompleted.value = !showCompleted.value
  } else if (statusType === 'Failed') {
    showFailed.value = !showFailed.value
  }
}

const filteredLoadTests = computed(() => {
  return loadTests.value.filter((test) => {
    if (showCompleted.value && test.status === 'completed') {
      return true
    }
    if (showFailed.value && test.status !== 'completed') {
      return true
    }
    return false
  })
})

const selectLoadTest = (test: any) => {
  selectedLoadTest.value = test
}

const loadTestInfo = computed(() => {
  if (!selectedLoadTest.value) return []
  const { duration, status, runId, startTime } = selectedLoadTest.value
  return [
    {
      icon: Calendar,
      title: 'Date:',
      value: startTime.toLocaleString({
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    { icon: Clock, title: 'Duration:', value: `${toHuman(duration)}` },
    { icon: Check, title: 'Status:', value: status },
    { icon: IdCard, title: 'Run ID:', value: runId }
  ]
})

const executorSummary = (executor: Executor) => {
  switch (executor.type) {
    case 'Once':
      return []
    case 'Constant':
      return [
        {
          icon: User,
          title: 'users:',
          value: `${executor.users}`
        },
        {
          icon: Clock,
          title: 'duration:',
          value: `${toHuman(executor.duration)}`
        }
      ]
    case 'ConstantArrivalRate':
      return [
        {
          icon: User,
          title: 'users:',
          value: `${executor.preAllocateUsers}`
        },
        {
          icon: Users,
          title: 'max users:',
          value: `${executor.maxUsers}`
        },
        {
          icon: Clock,
          title: 'duration:',
          value: `${toHuman(executor.duration)}`
        }
      ]
    case 'PerUser':
      return [
        {
          icon: User,
          title: 'users:',
          value: `${executor.users}`
        },
        {
          icon: Users,
          title: 'max users:',
          value: `${executor.iterations}`
        }
      ]
    case 'RampingArrivalRate':
      return [
        {
          icon: User,
          title: 'users:',
          value: `${executor.preAllocateUsers}`
        },
        {
          icon: Users,
          title: 'max users:',
          value: `${executor.maxUsers}`
        },
        ...executor.stages.map((stage, index) => ({
          icon: Clock,
          title: `stage ${index + 1}`,
          value: `${stage[0].perSeconds()} / ${toHuman(stage[1])}`
        }))
      ]
    case 'RampingUser':
      return [
        {
          icon: User,
          title: 'users:',
          value: `${executor.preAllocateUsers}`
        },
        ...executor.stages.map((stage, index) => ({
          icon: Clock,
          title: `stage ${index + 1}:`,
          value: `${stage[0]} / ${toHuman(stage[1])}`
        }))
      ]
    case 'Shared':
      return [
        {
          icon: User,
          title: 'users:',
          value: `${executor.users}`
        },
        {
          icon: Repeat2,
          title: 'iters:',
          value: `${executor.iterations}`
        },
        {
          icon: Clock,
          title: 'duration:',
          value: `${toHuman(executor.duration)}`
        }
      ]
    default:
      return []
  }
}
</script>

<template>
  <div class="w-full min-h-full flex flex-col p-4 g gap-2">
    <header class="flex justify-start items-center gap-2">
      <SidebarTrigger class="ml-1 bg-secondary" />
      <div class="flex-shrink-0 font-semibold text-md mx-auto">History</div>
    </header>

    <ResizablePanelGroup direction="horizontal" class="w-full flex-grow">
      <ResizablePanel class="flex flex-col p-4">
        <div class="flex items-center gap-6 text-sm mb-2">
          <TestInfoComponent
            v-for="({ icon, title, value }, index) in loadTestInfo"
            :key="index"
            :icon="icon"
            :text="title"
            :value="value"
          />
        </div>
        <h3 class="font-light text-xl my-4 font-jetbrains">Test Details</h3>
        <div v-if="selectedLoadTest" class="flex flex-col">
          <Carousel
            class="relative w-[calc(100%-5rem)] max-w-full justify-self-center self-center"
            :opts="{
              align: 'start'
            }"
          >
            <CarouselContent>
              <CarouselItem
                v-for="(scenario, index) in selectedLoadTest.scenario"
                :key="index"
                class="max-w-fit"
              >
                <div class="w-fit min-h-36">
                  <Card class="gap-2 p-2">
                    <CardHeader class="px-2">
                      <CardTitle class="text-lg font-light">{{ scenario.name }}</CardTitle>
                    </CardHeader>
                    <CardContent class="flex space-x-2 w-fit px-0">
                      <div
                        class="w-44 min-h-28 px-3 pt-1"
                        v-for="(executor, execIndex) in scenario.executors"
                        :key="execIndex"
                      >
                        <Badge class="text-xs mb-2 font-jetbrains" variant="secondary">{{
                          executor.type
                        }}</Badge>
                        <div class="space-y-1 ml-1">
                          <div
                            v-for="(info, index) in executorSummary(executor)"
                            :key="index"
                            class="flex justify-between items-center text-sm"
                          >
                            <div class="flex items-center gap-1">
                              <component :is="info.icon" class="w-4 h-4 text-muted-foreground" />
                              <span class="text-muted-foreground">{{ info.title }}</span>
                            </div>
                            <div class="text-right font-medium">
                              {{ info.value }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
        <div v-else class="text-muted-foreground">
          Select a test from the history to view its details.
        </div>
      </ResizablePanel>
      <ResizableHandle with-handle />
      <ResizablePanel class="flex flex-col px-4" :default-size="18">
        <div class="flex justify-center mb-4">
          <RangeCalendar v-model="range" :min-date="minDate" :max-date="maxDate" />
        </div>

        <div class="flex gap-2 mb-4 justify-center">
          <Button
            :variant="showCompleted ? 'default' : 'outline'"
            class="flex items-center gap-1"
            @click="toggleStatusFilter('Completed')"
          >
            <CheckCircle class="w-4 h-4" /> Completed
          </Button>
          <Button
            :variant="showFailed ? 'default' : 'outline'"
            class="flex items-center gap-1"
            @click="toggleStatusFilter('Failed')"
          >
            <XCircle class="w-4 h-4" /> Failed
          </Button>
        </div>

        <div class="flex-grow overflow-y-auto space-y-2">
          <h3 class="font-semibold text-lg mb-2 px-2">Past Load Tests</h3>
          <Button
            v-for="test in filteredLoadTests"
            :key="test.runId"
            :variant="selectedLoadTest?.runId === test.runId ? 'secondary' : 'ghost'"
            class="w-full justify-start h-auto py-2"
            @click="selectLoadTest(test)"
          >
            <div class="flex flex-col items-start">
              <span class="font-medium">{{ test.startTime.toLocaleString() }}</span>
              <span class="text-sm text-muted-foreground">{{
                test.scenario.map((s) => s.name).join(', ')
              }}</span>
              <span class="text-sm text-muted-foreground">({{ test.status }})</span>
            </div>
          </Button>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  </div>
</template>
