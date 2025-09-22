<script setup lang="ts">
import AppSidebar from './components/AppSidebar.vue'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from './components/ui/breadcrumb'
import { Separator } from './components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from './components/ui/sidebar'

import { onMounted, reactive, ref, computed, type Component } from 'vue'
import { AppState } from './app'
import type { NodeInformation, RunState } from './app'

import NodeInfo from './pages/NodeInfo.vue'
import NotFound from './pages/NotFound.vue'

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
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <header class="flex h-16 shrink-0 items-center gap-2">
        <div class="flex items-center gap-2 px-4">
          <SidebarTrigger class="-ml-1" />
          <Separator orientation="vertical" class="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem class="hidden md:block">
                <BreadcrumbLink href="#"> Building Your Application </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator class="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Data Fetching</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
        <component :is="currentView" :nodes="nodes" />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>

<style></style>
