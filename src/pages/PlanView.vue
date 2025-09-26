<script setup lang="ts">
import { ref, computed } from 'vue' // 'computed' added for reactivity of extensions
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Codemirror } from 'vue-codemirror'
import { dracula } from '@ddietr/codemirror-themes/dracula'
import { Hurl } from '@/lib/codemirror_hurl'

// Define an interface for file objects
interface UserFile {
  id: number
  name: string
  content: string
  language: string // e.g., 'javascript', 'css', 'json', 'vue' for editor highlighting
}

// Dummy data for user files, as the logic for loading files is out of scope
const files = ref<UserFile[]>([
  {
    id: 1,
    name: 'example.hurl',
    content: `GET https://api.example.com/users
Accept: application/json
User-Agent: hurl-editor/1.0

HTTP/1.1 200
[
  { "id": 1, "name": "Alice" },
  { "id": 2, "name": "Bob" }
]
`,
    language: 'hurl'
  },
  {
    id: 2,
    name: 'config.json',
    content: `{\n  "projectName": "My Hurl Project",\n  "environment": "development",\n  "apiBaseUrl": "https://api.example.com",\n  "settings": {\n    "timeout": 5000,\n    "followRedirects": true\n  }\n}`,
    language: 'json'
  }
])

// Reactive state for the selected file's name, content, and language
const selectedFileName = ref<string | null>(null)
const selectedFileContent = ref<string>('')
const selectedFileLanguage = ref<string>('plaintext') // Default language for the editor

// Function to handle file selection from the list
const selectFile = (file: UserFile) => {
  selectedFileName.value = file.name
  selectedFileContent.value = file.content
  selectedFileLanguage.value = file.language // Update language hint for editor
}

// Optionally, pre-select the first file when the component loads
if (files.value.length > 0) {
  selectFile(files.value[0])
}

const codemirrorExtensions = computed(() => {
  return [dracula, Hurl()]
})
</script>

<template>
  <div class="flex flex-col p-4 h-screen bg-background text-foreground">
    <header class="flex justify-start items-center gap-2 mb-4">
      <!-- Assuming SidebarTrigger is already styled according to shadcn-vue or will be -->
      <SidebarTrigger class="ml-1" />
      <div class="flex-shrink-0 font-semibold text-lg mx-auto">Nodes</div>
    </header>

    <!-- Main content area: Editor on the left, File List on the right -->
    <div class="flex flex-1 gap-4">
      <div class="flex-1 border rounded-lg relative bg-card text-card-foreground shadow-sm">
        <Codemirror
          v-model="selectedFileContent"
          :lang="selectedFileLanguage"
          :extensions="codemirrorExtensions"
          class="h-full w-full"
        />
      </div>

      <!-- File List Section (Right) -->
      <div
        class="w-1/4 min-w-[220px] max-w-[300px] border rounded-lg p-3 flex flex-col bg-card text-card-foreground shadow-sm"
      >
        <h3 class="font-semibold text-lg mb-3 pl-1 text-card-foreground">My Files</h3>
        <ul class="flex-1 overflow-y-auto">
          <li
            v-for="file in files"
            :key="file.id"
            @click="selectFile(file)"
            :class="[
              'p-2 cursor-pointer rounded-md mb-1 transition-colors duration-200 text-sm flex items-center gap-2',
              selectedFileName === file.name
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'hover:bg-accent hover:text-accent-foreground'
            ]"
          >
            <!-- A simple file icon (could be replaced with an icon library for more variety) -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              :class="{
                'text-muted-foreground': selectedFileName !== file.name,
                'text-accent-foreground': selectedFileName === file.name
              }"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-2.414-2.414A1 1 0 0015.586 6H7a2 2 0 00-2 2v11a2 2 0 002 2z"
              />
            </svg>
            <span>{{ file.name }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
