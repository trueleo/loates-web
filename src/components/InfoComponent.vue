<script setup lang="ts">
import { computed } from 'vue'
import { ExecutorState, toZeroMillisHuman, toHuman, type Executor } from '../app'
import { Duration as LuxonDuration } from 'luxon'

let props = defineProps<{
  state: ExecutorState
}>()

const average_time = computed(() => {
  if (props.state.iterations == 0) {
    return props.state.taskTotalTime.to_luxon()
  }
  const avg_time = props.state.taskTotalTime.to_luxon().as('milliseconds') / props.state.iterations
  return !Number.isNaN(avg_time) ? LuxonDuration.fromMillis(avg_time) : LuxonDuration.fromMillis(0)
})

function labelStage(stageIndex: number, config: Executor) {
  switch (config.type) {
    case 'RampingUser': {
      let stage = config.stages[stageIndex]
      return `${stage[0]} users for ${toZeroMillisHuman(stage[1].to_luxon())}`
    }
    case 'RampingArrivalRate': {
      let stage = config.stages[stageIndex]
      return `${stage[0].value} per ${toZeroMillisHuman(stage[0].duration.to_luxon())} users for ${toZeroMillisHuman(
        stage[1].to_luxon()
      )}`
    }
    default:
      return ''
  }
}
</script>

<template>
  <div class="info">
    <span v-if="state.stages != undefined">stage</span>
    <p v-if="state.stages != undefined && state.stage != undefined">
      {{ `${state.stage} ( ${labelStage(state.stage - 1, state.config)} )` }}
    </p>
    <span> duration </span>
    <p>
      {{ toZeroMillisHuman(state.duration()) }}
    </p>
    <span>users</span>
    <p>{{ state.users }}</p>
    <span>max_users</span>
    <p>{{ state.maxUsers }}</p>
    <span>iterations</span>
    <p>{{ state.iterations }}</p>
    <span>iteration / sec</span>
    <p>
      {{ (state.iterations / state.duration().as('seconds')).toFixed(2) }}
    </p>
    <span>user average time</span>
    <p>
      {{ toHuman(average_time) }}
    </p>
    <span>user minimum time</span>
    <p>{{ toHuman(state.taskMinTime.to_luxon()) }}</p>
    <span>user maximum time</span>
    <p>{{ toHuman(state.taskMaxTime.to_luxon()) }}</p>
  </div>
</template>

<style scoped>
span {
  color: rgba(241, 241, 241, 0.774);
}

.info {
  padding: 0rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  row-gap: 2px;
}

.info span {
  font-size: 0.9em;
  grid-column-start: 1;
  grid-column-end: 2;
}

.info p {
  font-size: 0.9em;
  grid-column-start: 2;
  grid-column-end: 3;
}
</style>
