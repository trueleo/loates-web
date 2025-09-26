<script setup lang="ts">
import { ref, computed } from 'vue'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable'

// New imports for the content of Panel Two
import { RangeCalendar } from '@/components/ui/range-calendar'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Search } from 'lucide-vue-next' // Assuming lucide-vue-next for icons

// Reactive state for RangeCalendar
const range = ref({
  start: undefined as Date | undefined,
  end: undefined as Date | undefined
})

// Optional: Define min/max dates for the calendar if needed
const minDate = ref(new Date(2023, 0, 1))
const maxDate = ref(new Date()) // Current date

// Dummy data for past load tests
const loadTests = ref([
  {
    id: '1',
    name: 'Load Test A',
    date: '2024-03-10',
    status: 'Completed',
    details: 'Details for Load Test A: This test completed successfully with 99% uptime.'
  },
  {
    id: '2',
    name: 'Load Test B',
    date: '2024-03-05',
    status: 'Failed',
    details: 'Details for Load Test B: This test failed due to a database connection error.'
  },
  {
    id: '3',
    name: 'Load Test C',
    date: '2024-02-28',
    status: 'Completed',
    details: 'Details for Load Test C: Another successful test with minor warnings.'
  },
  {
    id: '4',
    name: 'Load Test D',
    date: '2024-02-15',
    status: 'Completed',
    details: 'Details for Load Test D: High performance test, all metrics within SLA.'
  },
  {
    id: '5',
    name: 'Load Test E',
    date: '2024-01-20',
    status: 'Failed',
    details: 'Details for Load Test E: Service unavailable during 30% of the test duration.'
  },
  {
    id: '6',
    name: 'Load Test F',
    date: '2024-01-10',
    status: 'Completed',
    details: 'Details for Load Test F: Standard load test, no issues reported.'
  },
  {
    id: '7',
    name: 'Load Test G',
    date: '2023-12-25',
    status: 'Completed',
    details: 'Details for Load Test G: End-of-year stress test, passed with optimal results.'
  },
  {
    id: '8',
    name: 'Load Test F',
    date: '2023-12-26',
    status: 'Completed',
    details: 'Details for Load Test G: End-of-year stress test, passed with optimal results.'
  }
])

// Reactive state for status filters
const showCompleted = ref(true)
const showFailed = ref(true)

// Reactive state for the currently selected load test
const selectedLoadTest = ref<any | null>(null) // Type any or define an interface for LoadTest

// Function to toggle status filter
const toggleStatusFilter = (statusType: 'Completed' | 'Failed') => {
  if (statusType === 'Completed') {
    showCompleted.value = !showCompleted.value
  } else if (statusType === 'Failed') {
    showFailed.value = !showFailed.value
  }
}

// Computed property to filter load tests based on selected statuses
const filteredLoadTests = computed(() => {
  return loadTests.value.filter((test) => {
    if (showCompleted.value && test.status === 'Completed') {
      return true
    }
    if (showFailed.value && test.status === 'Failed') {
      return true
    }
    return false
  })
})

// Function to handle clicking on a load test item
const selectLoadTest = (test: any) => {
  selectedLoadTest.value = test
  console.log('Selected load test:', test)
  // Implement navigation or display details for the selected test
}

// Function to handle search
const handleSearch = () => {
  console.log('Searching with range:', range.value)
  console.log('Filters - Completed:', showCompleted.value, 'Failed:', showFailed.value)
  // The `filteredLoadTests` computed property already handles the filtering for display.
  // If `handleSearch` is meant to *re-fetch* data from a backend, this is where you'd use these filters.
}
</script>

<template>
  <div class="w-full min-h-full flex flex-col p-4 g gap-2">
    <header class="flex justify-start items-center gap-2">
      <SidebarTrigger class="ml-1 bg-secondary" />
      <div class="flex-shrink-0 font-semibold text-md mx-auto">History</div>
    </header>

    <ResizablePanelGroup direction="horizontal" class="w-full flex-grow">
      <ResizablePanel class="flex flex-col p-4">
        <h3 class="font-semibold text-lg mb-4">Selected Test Details</h3>
        <div v-if="selectedLoadTest" class="space-y-2">
          <p><strong>Name:</strong> {{ selectedLoadTest.name }}</p>
          <p><strong>Date:</strong> {{ selectedLoadTest.date }}</p>
          <p><strong>Status:</strong> {{ selectedLoadTest.status }}</p>
          <p><strong>Details:</strong> {{ selectedLoadTest.details }}</p>
          <!-- Add more details here as needed -->
        </div>
        <div v-else class="text-muted-foreground">
          Select a test from the history to view its details.
        </div>
      </ResizablePanel>
      <ResizableHandle with-handle />
      <ResizablePanel class="flex flex-col px-4" :default-size="18">
        <div class="flex justify-center mb-4">
          <RangeCalendar v-model:range="range" :min-date="minDate" :max-date="maxDate" />
        </div>

        <div class="flex gap-2 mb-4 justify-center">
          <Button
            :variant="showCompleted ? 'default' : 'outline'"
            class="flex items-center gap-1"
            @click="toggleStatusFilter('Completed')"
          >
            <CheckCircle class="w-4 h-4" /> Completed
          </Button>
          <Button
            :variant="showFailed ? 'default' : 'outline'"
            class="flex items-center gap-1"
            @click="toggleStatusFilter('Failed')"
          >
            <XCircle class="w-4 h-4" /> Failed
          </Button>
        </div>
        <div class="flex justify-center mb-4">
          <Button @click="handleSearch" class="flex items-center gap-1">
            <Search class="w-4 h-4" /> Search
          </Button>
        </div>

        <div class="flex-grow overflow-y-auto space-y-2">
          <h3 class="font-semibold text-lg mb-2 px-2">Past Load Tests</h3>
          <Button
            v-for="test in filteredLoadTests"
            :key="test.id"
            :variant="selectedLoadTest?.id === test.id ? 'secondary' : 'ghost'"
            class="w-full justify-start h-auto py-2"
            @click="selectLoadTest(test)"
          >
            <div class="flex flex-col items-start">
              <span class="font-medium">{{ test.name }}</span>
              <span class="text-sm text-muted-foreground">{{ test.date }} ({{ test.status }})</span>
            </div>
          </Button>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  </div>
</template>
