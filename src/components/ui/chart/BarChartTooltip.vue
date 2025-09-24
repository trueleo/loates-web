<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

defineProps<{
  title?: string | number
  data: {
    name: string
    color: string
    value: any
  }[]
}>()
</script>

<template>
  <Card class="text-sm gap-2 py-2 flex-row">
    <div v-if="title" class="ml-2 px-2">
      {{ title }}
    </div>
    <CardContent class="pr-4">
      <div v-for="(item, key) in data" :key="key" class="flex justify-between">
        <span class="font-semibold">{{ item.value }}</span>
      </div>
    </CardContent>
  </Card>
</template>
