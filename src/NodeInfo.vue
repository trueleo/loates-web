<script setup lang="ts">
import type { NodeInformation } from './app'

defineProps<{
  nodes: NodeInformation[]
}>()
</script>

<template>
  <div
    class="flex flex-wrap justify-start items-start place-content-start gap-4 p-4 text-text dark:text-text-dark overflow-y-scroll"
  >
    <div
      v-for="node in nodes"
      :key="node.name"
      class="bg-secondary dark:bg-secondary-dark rounded-lg shadow-md px-4 py-4 min-w-48 flex flex-col gap-2"
    >
      <h1 class="text-xl font-bold capitalize font-roboto tracking-wider">{{ node.name }}</h1>
      <p class="text-sm">IP: {{ node.ip }}</p>
      <div class="flex items-center gap-2">
        <span
          class="w-3 h-3 rounded-full"
          :class="{
            'bg-green-500': node.status === 'running',
            'bg-yellow-500': node.status === 'idle'
          }"
        ></span>
        <p class="text-sm capitalize">Status: {{ node.status }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
