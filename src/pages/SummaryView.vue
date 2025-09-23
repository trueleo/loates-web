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

import { computed, ref } from 'vue'
import { Check, Users, Clock2, Clock4, Timer } from 'lucide-vue-next'

const numScenarios = computed(() => {
  return 5
})

const status = ref('running')
const current_scenario_info = computed(() => {
  let vus = 50
  let startTime = Date.now()
  let endTime = Date.now()
  let duration = endTime - startTime

  // Helper function to format duration
  const formatDuration = (ms: number): string => {
    if (ms < 1000) {
      return `${ms} ms`
    }
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    } else {
      return `${seconds}s`
    }
  }

  // Helper function to format date/time
  const formatDateTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString()
  }

  return [
    [Users, 'Vus', vus],
    [Clock2, 'start time:', formatDateTime(startTime)],
    [Clock4, 'end time:', formatDateTime(endTime)],
    [Timer, 'Duration', formatDuration(duration)]
  ]
})
</script>

<template>
  <div class="h-full w-full flex flex-col">
    <header class="flex justify-start items-center gap-2 p-2">
      <SidebarTrigger class="ml-1 bg-secondary" />
      <div class="flex-shrink-0 font-semibold text-md mx-auto">Scenario 1</div>
      <Select>
        <SelectTrigger class="w-[280px]">
          <SelectValue placeholder="Scenario" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="scenario1">Scenario 1</SelectItem>
          <SelectItem value="scenario2">Scenario 2</SelectItem>
        </SelectContent>
      </Select>

      <!-- Run and Configure Buttons -->
      <div class="flex flex-shrink-0 gap-2">
        <Button variant="outline">Configure</Button>
        <Button>Run</Button>
      </div>
    </header>

    <!-- Load Test Information Row -->
    <div class="flex items-center gap-6 px-4 py-2 text-sm">
      <div
        :class="[
          'px-2 py-0.5 rounded-sm font-semibold text-sm text-green-400 capitalize  ring-2 ring-green-400',
          status === 'running' ? 'bg-green-700' : 'bg-yellow-600'
        ]"
      >
        <Check class="inline mr-2" fill="green" /> {{ status }}
      </div>
      <div v-for="([icon, text, value], index) in current_scenario_info" :key="index">
        <component :is="icon" class="inline" /> {{ text }}: {{ value }}
      </div>
    </div>

    <!-- Empty space below -->
    <div class="flex-grow flex justify-around items-center bg-background">
      <p>This space is intentionally left empty for future content.</p>
    </div>
  </div>
</template>

<style scoped></style>
