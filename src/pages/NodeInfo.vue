<script setup lang="ts">
import { ref } from 'vue'
import type { NodeInformation } from '@/app'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ActivityIcon, PauseCircleIcon, PlusIcon, Loader2Icon } from 'lucide-vue-next'

defineProps<{
  nodes: NodeInformation[]
}>()

const isDialogOpen = ref(false)
const newNodeName = ref('')
const newNodeIp = ref('')
const isAddingNode = ref(false)

const openAddNodeDialog = () => {
  newNodeName.value = ''
  newNodeIp.value = ''
  isDialogOpen.value = true
}

const handleAddNode = async () => {
  if (!newNodeName.value || !newNodeIp.value) {
    alert('Please enter both node name and IP.') // Basic validation
    return
  }

  isAddingNode.value = true
  try {
    // Simulate API call to add the node
    console.log('Adding node:', { name: newNodeName.value, ip: newNodeIp.value })
    // Replace with actual API endpoint call, e.g.:
    // await fetch('/api/nodes', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ name: newNodeName.value, ip: newNodeIp.value })
    // })

    await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate network request

    // On success, close dialog and potentially trigger a refresh of the nodes list
    // (e.g., by emitting an event to the parent component, or refetching data)
    console.log('Node added successfully!')
    isDialogOpen.value = false
    newNodeName.value = ''
    newNodeIp.value = ''
    // If nodes are managed by the parent, you might emit an event:
    // emit('nodeAdded');
  } catch (error) {
    console.error('Failed to add node:', error)
    // Handle error, e.g., show an error message
  } finally {
    isAddingNode.value = false
  }
}
</script>

<template>
  <div class="flex flex-col p-4">
    <header class="flex justify-start items-center gap-2">
      <SidebarTrigger class="ml-1 bg-secondary" />
      <div class="flex-shrink-0 font-semibold text-md mx-auto">Nodes</div>
    </header>
    <div
      class="flex flex-wrap justify-center items-stretch place-content-start gap-4 p-4 text-text dark:text-text-dark"
    >
      <Card v-for="node in nodes" :key="node.name" class="min-w-48">
        <CardHeader>
          <CardTitle>{{ node.name }}</CardTitle>
          <CardDescription>IP: {{ node.ip }}</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="flex items-center gap-2">
            <template v-if="node.status === 'running'">
              <ActivityIcon class="h-4 w-4 text-green-500" />
            </template>
            <template v-else-if="node.status === 'idle'">
              <PauseCircleIcon class="h-4 w-4 text-yellow-500" />
            </template>
            <p class="text-sm capitalize">{{ node.status }}</p>
          </div>
        </CardContent>
      </Card>

      <!-- Add Node Card -->
      <Card
        class="min-w-48 flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary dark:hover:border-primary transition-colors cursor-pointer"
        @click="openAddNodeDialog"
      >
        <PlusIcon class="h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
        <CardContent class="text-gray-500 dark:text-gray-400 text-lg">Add Node</CardContent>
      </Card>

      <!-- Add Node Dialog -->
      <Dialog v-model:open="isDialogOpen">
        <DialogContent class="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Node</DialogTitle>
            <DialogDescription>
              Enter the details for the new node you want to add.
            </DialogDescription>
          </DialogHeader>
          <form @submit.prevent="handleAddNode" class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="node-name" class="text-right"> Name </Label>
              <Input id="node-name" v-model="newNodeName" class="col-span-3" required />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="node-ip" class="text-right"> IP Address </Label>
              <Input id="node-ip" v-model="newNodeIp" class="col-span-3" type="text" required />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                @click="isDialogOpen = false"
                :disabled="isAddingNode"
              >
                Cancel
              </Button>
              <Button type="submit" :disabled="isAddingNode">
                <Loader2Icon v-if="isAddingNode" class="mr-2 h-4 w-4 animate-spin" />
                {{ isAddingNode ? 'Adding...' : 'Add Node' }}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  </div>
</template>

<style scoped></style>
