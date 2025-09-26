<script setup lang="ts">
import { SidebarTrigger } from '@/components/ui/sidebar'
</script>

<template>
  <div class="flex flex-col p-4">
    <header class="flex justify-start items-center gap-2">
      <SidebarTrigger class="ml-1 bg-secondary" />
      <div class="flex-shrink-0 font-semibold text-md mx-auto">Nodes</div>
    </header>
  </div>
</template>
