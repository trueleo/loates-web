<script setup lang="ts">
import { onBeforeUpdate, onMounted, onUnmounted, ref } from 'vue'
import { AutoScaleAxis, BarChart, Svg, getMultiValue, type BarChartData } from 'chartist'

const barChart = ref<Element | null>(null)
let chart: BarChart

let props = defineProps<{
  dataset: BarChartData
}>()

onBeforeUpdate(() => {
  chart.update(props.dataset)
})

onMounted(() => {
  chart = new BarChart(barChart.value, props.dataset, {
    horizontalBars: true,
    axisX: {
      type: AutoScaleAxis,
      showGrid: true
    },
    axisY: {
      showGrid: false
    }
  })

  chart.on('draw', (data) => {
    if (data.type === 'bar') {
      const textX = data.x1 + 2 // Center the text horizontally
      const textY = data.y2 + data.element.height() / 2 - 4 // Adjust this value to position the text above the bar
      const svg = new Svg(
        'text',
        {
          x: textX,
          y: textY
        },
        'ct-custom-bar-text'
      )

      let val = getMultiValue(data.value, 'x')?.toFixed(2)
      svg.text(val ? val : '*')
      data.group.append(svg)
    }
  })
})

onUnmounted(() => {
  chart.detach()
})
</script>

<template>
  <div class="ct-chart ct-double-octave" ref="barChart"></div>
</template>

<style></style>
