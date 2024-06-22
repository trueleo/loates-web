<script setup lang="ts">
import { MetricSetKey, MetricValue, Duration, MetricType } from '../app'
import LineChart from './LineChart.vue'
import BarChart from './BarChart.vue'
import { type LineChartData, type BarChartData } from 'chartist'

defineProps<{
  metrics: [MetricSetKey, MetricValue[]][]
}>()

function isDurationList(value: MetricValue[]): value is Duration[] {
  return value && value[0] instanceof Duration
}

function isNumberList(value: MetricValue[]): value is number[] {
  return value && typeof value[0] == 'number'
}

function isNumberHist(value: MetricValue[]): value is [[number, number, number, number], number][] {
  return value && value.length != 0 && value[0] instanceof Array && typeof value[0][1] == 'number'
}

function isDurationHist(
  value: MetricValue[]
): value is [[Duration, Duration, Duration, Duration], Duration][] {
  return value && value.length != 0 && value[0] instanceof Array && value[0][1] instanceof Duration
}

function gauge(value: MetricValue[]): LineChartData {
  var data: number[] = []
  if (isDurationList(value)) {
    data = value.map((x) => x.to_luxon().as('milliseconds'))
  }
  if (isNumberList(value)) {
    data = value
  }
  return {
    series: [
      data.map((x, index) => {
        return { x: index, y: x }
      })
    ]
  }
}

function histogram(value: MetricValue[]): BarChartData {
  var data: number[] = []
  if (isDurationHist(value)) {
    data = value[value.length - 1][0].map((x) => x.to_luxon().toMillis())
  } else if (isNumberHist(value)) {
    data = value[-1][0]
  }
  return {
    labels: ['p50', 'p90', 'p95', 'p99'],
    series: [data]
  }
}
</script>

<template>
  <template v-for="([key, value], index) in metrics" :key="index">
    <div v-if="key.metricType != MetricType.Counter" class="flex flex-col items-center">
      <p class="text-[0.8rem]">
        {{ key.attributes.map(([x, y]) => `${x}=${y}`).reduce((x, y) => x + ' ' + y) }}
      </p>
      <template v-if="key.metricType == MetricType.Gauge">
        <LineChart v-if="value.length > 1" :dataset="gauge(value)" />
        <div v-else>{{ key.name }} {{ value[value.length - 1] }}</div>
      </template>

      <template v-else-if="key.metricType == MetricType.Histogram">
        <BarChart :dataset="histogram(value)" />
      </template>
    </div>

    <div v-else class="flex flex-row items-center justify-center gap-6">
      <span class="text-[0.8em]">
        {{ key.attributes.map(([k, v]) => `${k}=${v}`).reduce((x, y) => x + ' ' + y) }}
      </span>
      <span class="font-semibold text-lg border px-2 rounded-md">
        {{ value[value.length - 1] }}
      </span>
    </div>
  </template>
</template>

<style>
/* This selector overrides the points style on line charts. Points on line charts are actually just very short strokes. This allows you to customize even the point size in CSS */
.ct-series-a .ct-bar {
  /* Colour of your points */
  stroke: rgb(16 185 129) !important;
  stroke-opacity: 100% !important;
  stroke-width: 15px !important;
}

.ct-label {
  color: rgba(256, 256, 256, 0.8) !important;
}

/* Use this selector to override the line style on a given series */
.ct-series-a .ct-line {
  /* Set the colour of this series line */
  stroke: rgb(16 185 129) !important ;
  /* Control the thikness of your lines */
  stroke-width: 1px !important ;
}

.ct-area {
  fill: black !important ;
  fill-opacity: 0.2 !important ;
}

.ct-custom-bar-text {
  font-size: 12px;
  line-height: 0.7 !important;
  text-align: center;
  vertical-align: top;
}

.ct-custom-line-text {
  font-size: 12px;
  fill: white;
  fill-opacity: 80%;
}
</style>
