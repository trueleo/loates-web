<script setup lang="ts">
import { toZeroMillisHuman } from '@/app'
import { Duration } from 'luxon'
import { computed } from 'vue'

let props = defineProps<{
  name: string
  duration?: Duration
  execs: string[]
  selected: boolean
}>()

const fmt_duration = computed(() => {
  if (props.duration == undefined) {
    return null
  } else {
    let duration = props.duration.rescale()
    if (duration > Duration.fromMillis(1000)) {
      duration.set({ milliseconds: undefined })
    }
    return toZeroMillisHuman(duration)
  }
})
</script>

<template>
  <div
    class="min-w-[200px] rounded-md pt-2.5 pb-2 px-4 h-full jetbrains"
    :class="
      selected
        ? 'bg-emerald-500/70 text-gray-50 shadow'
        : 'text-gray-50 bg-emerald-600/20 hover:bg-white/[0.12] hover:text-white '
    "
  >
    <h1 class="!text-xl w-max text-white mb-1">
      {{ name }}
    </h1>

    <p v-if="fmt_duration" class="w-max">
      <i class="pi pi-clock mr-2 text-[0.9rem]"></i><span>{{ fmt_duration }}</span>
    </p>
    <p
      class="!text-[0.7rem] mt-1 grid gap-x-2 grid-cols-[min-content_min-content_auto] justify-items-start"
    >
      <span class="exec-name" v-for="(item, index) in execs" :key="index">
        {{ item }}
      </span>
    </p>
  </div>
</template>

<style scoped></style>
