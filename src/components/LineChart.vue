<script setup lang="ts">
import 'chartist/dist/index.css'
import { onBeforeUpdate, onMounted, onUnmounted, ref } from 'vue'
import {
  AutoScaleAxis,
  LineChart,
  Svg,
  type LineChartData,
  type Multi,
  type Series
} from 'chartist'

const lineChart = ref<Element | null>(null)
let chart: LineChart

let props = defineProps<{
  dataset: LineChartData
}>()

onBeforeUpdate(() => {
  chart.update(props.dataset)
})

onMounted(() => {
  chart = new LineChart(lineChart.value, props.dataset, {
    lineSmooth: true,
    axisX: {
      type: AutoScaleAxis,
      showGrid: false,
      showLabel: false
    },
    axisY: {
      showGrid: false
    },
    fullWidth: true,
    showArea: true,
    showLine: true,
    showPoint: false
  })

  chart.on('draw', (data) => {
    if (data.type === 'area') {
      const svg = new Svg(
        'text',
        {
          x: data.chartRect.x2 - 30,
          y: data.chartRect.y2 - 5
        },
        'ct-custom-line-text'
      )
      let val = (props.dataset.series[0] as Series<Multi>)
        .map((x) => (x as { x: number; y: number }).y)
        .reduce((x, y) => {
          return x > y ? x : y
        })
      svg.text(val.toString())
      data.group.append(svg)
    }
  })
})

onUnmounted(() => {
  chart.detach()
})
</script>

<template>
  <div class="ct-chart ct-double-octave" ref="lineChart"></div>
</template>

<style></style>
