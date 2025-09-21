/home/trueleo/git/loates-web/src/App.vue
<script setup lang="ts">
import { onMounted, reactive, ref, computed, type Component } from 'vue'
import { AppState } from './app'
import type { NodeInformation, RunState } from './app'

import Sidebar from './components/SideBar.vue'
import NodeInfo from './NodeInfo.vue'
import NotFound from './NotFound.vue'

// assigned on mount
const nodeInfo = ref<NodeInformation>({ name: '', role: 'master', ip: '', status: 'running' })
const nodes = ref<NodeInformation[]>([])
const isMaster = ref<boolean>(false)

const app = reactive<{
  state: AppState
  runState: RunState
}>({
  state: new AppState({
    currentScenario: 0,
    scenarios: []
  }),
  runState: 'startable'
})

const currentPage = ref(0)
const routes: [string, Component][] = [
  ['Summary', NotFound],
  ['History', NotFound],
  ['Nodes', NodeInfo],
  ['Plan', NotFound]
]
const pages = routes.map((route) => route[0])

window.addEventListener('hashchange', () => {
  let index = pages.findIndex(
    (page) => page.toLowerCase() == window.location.hash.slice(1).toLowerCase()
  )
  if (currentPage.value == index) {
    return
  }
  currentPage.value = index
})

const currentView = computed(() => {
  if (currentPage.value < 0) {
    window.location.hash = '#NotFound'
    return NotFound
  } else {
    window.location.hash = `#${pages[currentPage.value]}`
    return routes[currentPage.value][1] || NotFound
  }
})

onMounted(async () => {
  nodeInfo.value = (await fetch('/api/node_information').then((res) =>
    res.json()
  )) as NodeInformation
  isMaster.value = nodeInfo.value.role == 'master'
  nodes.value = (await fetch('/api/nodes').then((res) => res.json())) as NodeInformation[]
})
</script>

<template>
  <div class="flex flex-col h-full w-full bg-side dark:bg-side-dark text-text font-jetbrains">
    <!-- Header stays fixed -->
    <header class="bg-side dark:bg-side-dark text-text dark:text-text-dark px-6 py-2 w-full">
      <h1
        class="mt-2 ml-4 text-xl font-bold uppercase relative max-w-fit text-accent-dark dark:text-accent"
      >
        Loates
      </h1>
    </header>

    <!-- Sidebar + Main split -->
    <div class="flex-grow flex w-full overflow-hidden">
      <Sidebar
        class="min-h-full min-w-48"
        :pages="pages"
        v-model:currentPage="currentPage"
        v-model:runState="app.runState"
      />

      <!-- Only this section should scroll -->
      <main
        class="flex-grow bg-background dark:bg-background-dark rounded-l-2xl overflow-auto my-2"
      >
        <component :is="currentView" :nodes="nodes" />
      </main>
    </div>
  </div>
</template>

<style></style>
