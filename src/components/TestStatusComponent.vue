<script setup lang="ts">
import { defineProps } from 'vue'
import { Check } from 'lucide-vue-next'

const props = defineProps<{ status: string }>()
</script>

<template>
  <div
    :class="[
      'px-2 py-0.5 rounded-sm font-semibold text-sm font-jetbrains text-green-400 capitalize ring-2 ring-green-400',
      props.status === 'running' ? 'bg-green-700' : 'bg-yellow-600'
    ]"
  >
    <Check class="inline mr-2" fill="green" /> {{ props.status }}
  </div>
</template>
