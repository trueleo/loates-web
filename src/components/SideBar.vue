<script setup lang="ts">
import type { RunState } from '@/app'
import { defineProps, defineEmits, ref } from 'vue'

const props = defineProps<{
  pages: string[]
  currentPage: Number
  runState: RunState
}>()

// Define the event that this component can emit
const emit = defineEmits<{
  (e: 'update:runState', value: string): void // 'update:runState' is a convention for v-model support
  (e: 'update:currentPage', value: number): void // 'update:currentPage' is a convention for v-model support
}>()

// Function to change the run state
const changeRunState = () => {
  if (props.runState === 'running') {
    emit('update:runState', 'paused')
  } else if (props.runState === 'paused') {
    emit('update:runState', 'running')
  } else if (props.runState === 'startable') {
    emit('update:runState', 'running')
  }
}

const changeCurrentPage = (newPage: number) => {
  emit('update:currentPage', newPage)
}

function buttonDisplay(): string {
  switch (props.runState) {
    case 'running':
      return 'Running'
    case 'paused':
      return 'Start'
    case 'startable':
      return 'Start'
  }
}

function HoverButton(): string {
  switch (props.runState) {
    case 'running':
      return 'Pause'
    case 'paused':
      return 'Start'
    case 'startable':
      return 'Start'
  }
}

const isHovered = ref(false)
</script>

<template>
  <div
    class="bg-side dark:bg-side-dark p-4 pt-8 shadow-md text-text dark:text-text-dark flex flex-col justify-between"
  >
    <div class="flex flex-col justify-between space-y-4 font-roboto uppercase">
      <div
        v-for="(page, index) in props.pages"
        :key="page"
        @click="changeCurrentPage(index)"
        :class="[
          'text-md block p-3 pl-4 border-1 border-secondary dark:border-secondary-dark rounded-full hover:text-primary-dark cursor-pointer',
          {
            'bg-secondary dark:bg-secondary-dark text-primary-dark dark:text-primary':
              index === props.currentPage
          }
        ]"
      >
        {{ page }}
      </div>
    </div>

    <button
      @click="changeRunState()"
      @mouseover="isHovered = true"
      @mouseleave="isHovered = false"
      class="bg-primary-dark dark:bg-primary hover:bg-primary dark:hover:bg-primary-dark font-bold py-6 px-2 rounded text-sm mr-2 mb-2 uppercase text-accent-dark"
    >
      {{ isHovered ? HoverButton() : buttonDisplay() }}
    </button>
  </div>
</template>

<style scoped>
/* Add any desired styling here */
</style>
