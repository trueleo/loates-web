<script setup lang="ts">
import type { NodeInformation } from '@/app'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

defineProps<{
  nodes: NodeInformation[]
}>()
</script>

<template>
  <div
    class="flex flex-wrap justify-start items-start place-content-start gap-4 p-4 text-text dark:text-text-dark overflow-y-scroll"
  >
    <Card v-for="node in nodes" :key="node.name" class="min-w-48">
      <CardHeader>
        <CardTitle>{{ node.name }}</CardTitle>
        <CardDescription>IP: {{ node.ip }}</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="flex items-center gap-2">
          <span
            class="w-3 h-3 rounded-full"
            :class="{
              'bg-green-500': node.status === 'running',
              'bg-yellow-500': node.status === 'idle'
            }"
          ></span>
          <p class="text-sm capitalize">{{ node.status }}</p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<style scoped></style>
