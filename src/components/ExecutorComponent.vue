<script setup lang="ts">
import { computed } from 'vue'
import { Duration, ExecutorState, toZeroMillisHuman } from '../app'

type HasStages = { stages: [any, Duration][] }

const props = defineProps<{
  state: ExecutorState
}>()

function isDuration(x: any): x is Duration {
  return x instanceof Duration
}

const progress = computed(() => {
  if (props.state.totalDuration) {
    var value =
      props.state.duration().as('milliseconds') /
      props.state.totalDuration.to_luxon().as('milliseconds')
    return {
      value: Math.min(value * 100, 100),
      type: 'duration' as const
    }
  }

  if (props.state.totalIteration) {
    let value = props.state.iterations / props.state.totalIteration
    return {
      value: Math.max(value, 100),
      type: 'iteration' as const
    }
  }

  return {
    value: 0,
    type: 'unknown' as const
  }
})

const labels = computed(() => {
  let labels: [string, any][] = []
  for (const [key, value] of Object.entries(props.state.config)) {
    if (key == 'type') {
      continue
    } else if (key == 'stages') {
      labels.push(['stages', value.length])
      let total_duration = props.state.totalDuration
        ? props.state.totalDuration
        : (props.state.config as any as HasStages).stages
            .map(([, x]) => x)
            .reduce((x, y) => x.add(y))
      labels.push(['duration', toZeroMillisHuman(total_duration)])
    } else {
      labels.push([key, isDuration(value) ? toZeroMillisHuman(value) : value])
    }
  }
  return labels
})
</script>

<template>
  <div class="shell overflow-hidden">
    <div class="progress bg-emerald-500/70"></div>
    <div class="grid grid-cols-[5fr_4fr] items-center relative py-2 px-4 content">
      <h1 class="font-bold leading-6 text-xl text" id="header">
        {{ state.config.type }}
      </h1>
      <div class="justify-self-end">
        <p v-for="([key, value], index) in labels" :key="index" class="text-sm">
          {{ key }}:
          {{ value }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shell {
  display: grid;
  grid-template-rows: 1fr;
  grid-template-columns: 1fr;
}

.shell .progress {
  z-index: 0;
  grid-area: 1 / 1;
  width: v-bind('progress.value + "%"');
  height: 3px;
  align-self: end;
  max-width: 100%;
}

.shell .content {
  z-index: 2;
  grid-area: 1 / 1;
}
</style>
