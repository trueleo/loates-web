<script setup lang="ts">
import { defineProps } from 'vue'

const props = defineProps<{
  tags: string[]
  count: number
}>()
</script>

<template>
  <div
    class="flex items-center justify-between rounded-md border bg-card shadow-sm text-card-foreground"
  >
    <span
      v-for="(tag, index) in tags"
      :key="index"
      class="ml-0.5 rounded-sm border bg-secondary px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-secondary-foreground hover:bg-secondary/80"
    >
      {{ tag }}
    </span>

    <div class="ml-auto px-2.5 py-0.5 text-sm font-medium text-muted-foreground">
      {{ count }}
    </div>
  </div>
</template>

<style scoped></style>
