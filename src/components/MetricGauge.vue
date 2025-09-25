<script setup lang="ts">
import { LineChart } from '@/components/ui/chart-line'
import { CurveType } from '@unovis/ts'

const props = defineProps<{
  data: Record<string, any>[]
  category: string[]
  index: string
  tags: string[]
  area?: string[]
  showAxisX?: boolean
  showAxisY?: boolean
  showLegend?: boolean
  showGridLine?: boolean
}>()
</script>

<template>
  <div class="flex-col bg-popover border-1 rounded-lg shadow-md p-1">
    <span
      v-for="(tag, index) in tags"
      :key="index"
      class="ml-0.5 rounded-sm border bg-secondary px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-secondary-foreground hover:bg-secondary/80"
    >
      {{ tag }}
    </span>

    <div class="h-full w-full">
      <LineChart
        :data="props.data"
        :categories="category"
        :index="index"
        class="h-full w-full"
        :margin="{ top: 10, left: 10, bottom: 30, right: 10 }"
        :showXAxis="showAxisX"
        :showYAxis="showAxisY"
        :showLegend="showLegend"
        :showGridLine="showGridLine"
        :curveType="CurveType.MonotoneX"
        :area="area"
      />
    </div>
  </div>
</template>
