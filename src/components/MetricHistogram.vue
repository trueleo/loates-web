<script setup lang="ts">
import { BarChart } from '@/components/ui/chart-bar'
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
  <div class="bg-popover border-1 rounded-lg shadow-md">
    <span
      v-for="(tag, index) in tags"
      :key="index"
      class="ml-0.5 rounded-sm border bg-secondary px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-secondary-foreground hover:bg-secondary/80"
    >
      {{ tag }}
    </span>

    <div class="h-full w-full">
      <BarChart
        :data="props.data"
        :categories="category"
        :index="index"
        class="h-full w-full"
        :margin="{ top: 10, left: 10, bottom: 10, right: 10 }"
        :showXAxis="showAxisX"
        :showYAxis="showAxisY"
        :showLegend="showLegend"
        :showGridLine="showGridLine"
        :showTooltip="true"
        :area="area"
      />
    </div>
  </div>
</template>
