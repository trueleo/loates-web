<script setup lang="ts" generic="T extends Record<string, any>">
import type { BulletLegendItemInterface } from '@unovis/ts'
import type { Component } from 'vue'
import type { BaseChartProps } from '.'
import { Axis, CurveType, Line, Area } from '@unovis/ts'

import { VisArea, VisAxis, VisLine, VisXYContainer } from '@unovis/vue'
import { useMounted } from '@vueuse/core'
import { computed, ref } from 'vue'
import { cn } from '@/lib/utils'
import { ChartCrosshair, ChartLegend, defaultColors } from '@/components/ui/chart'

const props = withDefaults(
  defineProps<
    BaseChartProps<T> & {
      /**
       * Render custom tooltip component.
       */
      customTooltip?: Component
      /**
       * Render custom area component.
       */
      area?: any[]
      /**
       * Type of curve
       */
      curveType?: CurveType
    }
  >(),
  {
    curveType: CurveType.MonotoneX,
    filterOpacity: 0.2,
    margin: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    showXAxis: true,
    showYAxis: true,
    showTooltip: true,
    showLegend: true,
    showGridLine: true
  }
)

const emits = defineEmits<{
  legendItemClick: [d: BulletLegendItemInterface, i: number]
}>()

type KeyOfT = Extract<keyof T, string>
type Data = (typeof props.data)[number]

const index = computed(() => props.index as KeyOfT)
const colors = computed(() =>
  props.colors?.length ? props.colors : defaultColors(props.categories.length)
)

const legendItems = ref<BulletLegendItemInterface[]>(
  props.categories.map((category, i) => ({
    name: category,
    color: colors.value[i],
    inactive: false
  }))
)

const isMounted = useMounted()

function handleLegendItemClick(d: BulletLegendItemInterface, i: number) {
  emits('legendItemClick', d, i)
}
</script>

<template>
  <div :class="cn('w-full flex flex-col items-end', $attrs.class ?? '')">
    <ChartLegend
      class="absolute top-2 right-0 z-10"
      v-if="showLegend"
      v-model:items="legendItems"
      @legend-item-click="handleLegendItemClick"
    />

    <VisXYContainer :margin="margin" :data="data" :style="{ height: isMounted ? '100%' : 'auto' }">
      <ChartCrosshair
        v-if="showTooltip"
        :colors="colors"
        :items="legendItems"
        :index="index"
        :custom-tooltip="customTooltip"
      />

      <template v-for="(category, i) in categories" :key="category">
        <VisArea
          v-if="area?.find((item) => item === category) !== undefined"
          :x="(d: Data, i: number) => i"
          :y="(d: Data) => d[category]"
          :curve-type="curveType"
          :color="colors[i]"
          :opacity="0.3"
          :attributes="{
            [Area.selectors.area]: {
              opacity: legendItems.find((item) => item.name === category)?.inactive
                ? filterOpacity
                : 0
            }
          }"
          class="-z-10"
        />

        <VisLine
          v-else
          :x="(d: Data, i: number) => i"
          :y="(d: Data) => d[category]"
          :curve-type="curveType"
          :color="colors[i]"
          :attributes="{
            [Line.selectors.line]: {
              opacity: legendItems.find((item) => item.name === category)?.inactive
                ? filterOpacity
                : 1
            }
          }"
        />
      </template>

      <VisAxis
        v-if="showXAxis"
        type="x"
        :tick-format="xFormatter ?? ((v: number) => data[v]?.[index])"
        :grid-line="false"
        :tick-line="false"
        tick-text-color="hsl(var(--vis-text-color))"
      />
      <VisAxis
        v-if="showYAxis"
        type="y"
        :tick-line="false"
        :tick-format="yFormatter"
        :domain-line="false"
        :grid-line="showGridLine"
        :attributes="{
          [Axis.selectors.grid]: {
            class: 'text-muted'
          }
        }"
        tick-text-color="hsl(var(--vis-text-color))"
      />

      <slot />
    </VisXYContainer>
  </div>
</template>
