<script setup lang="ts">
import { computed } from 'vue'
import { Check, Pause, Play } from 'lucide-vue-next'
import type { RunState } from '@/app'
import { Badge } from '@/components/ui/badge' // Assuming the path to Shadcn Vue Badge component

const props = defineProps<{ status: RunState }>()

const statusClassProps = computed(() => {
  if (props.status === 'running') {
    return {
      bg: 'bg-emerald-600',
      text: 'text-emerald-50',
      hover: 'hover:bg-emerald-600/80'
    }
  } else {
    return {
      bg: 'bg-amber-500',
      text: 'text-amber-950',
      hover: 'hover:bg-amber-500/80'
    }
  }
})

const badgeClasses = computed(() => [
  'capitalize',
  'font-jetbrains',
  'text-sm',
  'rounded-md',
  'py-2',
  'border-0',
  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  statusClassProps.value.bg,
  statusClassProps.value.text,
  statusClassProps.value.hover
])
</script>

<template>
  <Badge :class="badgeClasses">
    <Check v-if="props.status === 'running'" />
    <Pause v-if="props.status === 'paused'" />
    <Play v-else />
    {{ props.status }}
  </Badge>
</template>
