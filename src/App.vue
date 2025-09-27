<script setup lang="ts">
import AppSidebar from './components/AppSidebar.vue'
import { SidebarInset, SidebarProvider } from './components/ui/sidebar'

import { onMounted, reactive, ref, computed } from 'vue'
import type { NodeInformation, RunState, Scenario } from './app'

import NodeView from './pages/NodeView.vue'
import NotFound from './pages/NotFound.vue'
import SummaryView from './pages/SummaryView.vue'
import HistoryView from './pages/HistoryView.vue'
import PlanView from './pages/PlanView.vue'

// On first load, check system preference
if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.classList.add('dark')
} else {
  document.documentElement.classList.remove('dark')
}

// Optional: keep it synced if user changes OS theme while open
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (e.matches) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
})

const currentPage = ref(0)
const pages: string[] = ['summary', 'history', 'nodes', 'plan']

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
    window.location.hash = '#notfound'
    return 'notfound'
  } else {
    return pages[currentPage.value]
  }
})

const nodeInfo = ref<NodeInformation>({ name: '', role: 'master', ip: '', status: 'running' })
const nodes = ref<NodeInformation[]>([])
const isMaster = ref<boolean>(false)

const refreshNodes = async () => {
  nodes.value = (await fetch('/api/nodes').then((res) => res.json())) as NodeInformation[]
}

onMounted(async () => {
  currentPage.value = pages.findIndex(
    (page) => page.toLowerCase() == window.location.hash.slice(1).toLowerCase()
  )

  nodeInfo.value = (await fetch('/api/node_information').then((res) =>
    res.json()
  )) as NodeInformation
  isMaster.value = nodeInfo.value.role == 'master'
  nodes.value = (await fetch('/api/nodes').then((res) => res.json())) as NodeInformation[]
})
</script>

<template>
  <SidebarProvider>
    <AppSidebar :active-page="currentPage" />
    <SidebarInset>
      <SummaryView v-if="currentView == 'summary'" />
      <NodeView v-else-if="currentView == 'nodes'" :nodes="nodes" @node-added="refreshNodes" />
      <PlanView v-else-if="currentView == 'plan'" />
      <HistoryView v-else-if="currentView == 'history'" />
      <NotFound v-else />
    </SidebarInset>
  </SidebarProvider>
</template>

<style></style>
