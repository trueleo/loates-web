<script setup lang="ts">
import { defineProps, type Component, computed } from 'vue'
import { DateTime, Duration as LuxonDuration } from 'luxon'

const props = defineProps<{
  icon: Component
  text: string
  value: DateTime | number | LuxonDuration | string | null
}>()

const formattedValue = computed(() => {
  const val = props.value

  if (val === null) {
    return ''
  }

  if (DateTime.isDateTime(val)) {
    return val.toFormat('dd/MM HH:mm')
  }

  if (LuxonDuration.isDuration(val)) {
    const totalSeconds = val.as('seconds')
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = Math.floor(totalSeconds % 60) // Remaining whole seconds

    let parts: string[] = []
    if (minutes > 0) {
      parts.push(`${minutes}min`)
    }

    if (seconds > 0) {
      parts.push(`${seconds}s`)
    }

    return parts.join(' ')
  }

  // For number or string types, return as is.
  return String(val)
})
</script>

<template>
  <div class="flex flex-col items-center md:flex-row">
    <div class="flex items-center justify-start gap-2">
      <component :is="props.icon" />
      <span class="font-semibold font-roboto"> {{ props.text }} </span>
    </div>
    <div class="md:ml-2 font-jetbrains">{{ formattedValue }}</div>
  </div>
</template>
