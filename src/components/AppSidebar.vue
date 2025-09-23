<script setup lang="ts">
import {
  ChartArea,
  History,
  Computer,
  SquareChartGantt,
  BookOpen,
  Command,
  LifeBuoy,
  Send
} from 'lucide-vue-next'
import NavMain from '@/components/NavMain.vue'
import NavSecondary from '@/components/NavSecondary.vue'
import NavUser from '@/components/NavUser.vue'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'
import { computed } from 'vue'

const props = defineProps<{
  activePage: number
}>()

const data = computed(() => ({
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg'
  },
  navMain: [
    {
      title: 'Summary',
      url: '#summary',
      icon: ChartArea,
      isActive: props.activePage === 0
    },
    {
      title: 'History',
      url: '#history',
      icon: History,
      isActive: props.activePage === 1
    },
    {
      title: 'Nodes',
      url: '#nodes',
      icon: Computer,
      isActive: props.activePage === 2
    },
    {
      title: 'Plan',
      url: '#plan',
      icon: SquareChartGantt,
      isActive: props.activePage === 3
    }
  ],
  navSecondary: [
    {
      title: 'Docs.rs',
      url: 'https://docs.rs/loates',
      icon: BookOpen
    },
    {
      title: 'Support',
      url: '#',
      icon: LifeBuoy
    },
    {
      title: 'Feedback',
      url: '#',
      icon: Send
    }
  ]
}))
</script>

<template>
  <Sidebar collapsible="icon" variant="inset">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" as-child>
            <a href="#">
              <div
                class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
              >
                <Command class="size-4" />
              </div>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-medium">Loates</span>
                <span class="truncate text-xs">@stonebucklabs</span>
              </div>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
    <SidebarContent>
      <NavMain :items="data.navMain" />
      <!-- <NavProjects :projects="data.projects" /> -->
      <NavSecondary :items="data.navSecondary" class="mt-auto" />
    </SidebarContent>
    <SidebarFooter>
      <NavUser :user="data.user" />
    </SidebarFooter>
  </Sidebar>
</template>
