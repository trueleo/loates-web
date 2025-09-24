<script setup lang="ts">
import { LineChart } from '@/components/ui/chart-line'
import { CurveType } from '@unovis/ts'

const props = defineProps<{
  data: Record<string, any>[]
  category: string[]
  index: string
  overlay: string
  area?: string[]
  showAxisX?: boolean
  showAxisY?: boolean
  showLegend?: boolean
  showGridLine?: boolean
}>()
</script>

<template>
  <div
    class="relative min-h-32 min-w-32 inline-flex items-center justify-center bg-popover border-1 rounded-lg shadow-md"
  >
    <div class="relative z-1">
      <h2 class="text-2xl text-text uppercase font-bold whitespace-nowrap">{{ overlay }}</h2>
    </div>

    <div class="absolute bottom-1 left-0 right-0 h-full">
      <LineChart
        :data="props.data"
        :categories="category"
        :index="index"
        class="h-full w-full"
        :margin="{ top: 10 }"
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
