<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'

import GuidelinesContextsManager from '@/app/components/guidelines/contexts/GuidelinesContextsManager.vue'
import GuidelinesDisplay from '@/app/components/guidelines/GuidelinesDisplay.vue'
import { useGuidelinesContexts } from '@/app/composables/guidelines/contexts/useGuidelinesContexts'
import { guidelinesState } from '@/app/composables/guidelines/useGuidelines'
import { useRepositoryContext } from '@/app/composables/useRepositoryContext'

const { selectedContext, showCreateDialog, repositoryId } = guidelinesState
const { contexts, isLoadingContexts, fetchContexts } = useGuidelinesContexts()
const {
  error: errorState,
  isLoadingRepoId,
  contextCwd,
  initialize,
} = useRepositoryContext()

const showContextManager = ref(false)

const showCreateGuideline = () => {
  showCreateDialog.value = true
}

const handleContextsUpdated = async () => {
  const fetchedContexts = await fetchContexts(contextCwd.value, true)
  if (fetchedContexts?.length > 0 && !selectedContext.value) {
    selectedContext.value = fetchedContexts[0].name
  }
}

onMounted(async () => {
  try {
    // Initialize repository context first
    await initialize()

    if (contextCwd.value) {
      // Load contexts and get repository ID with force reload
      const fetchedContexts = await fetchContexts(contextCwd.value, true)

      // Set context if contexts exist
      if (fetchedContexts?.length > 0 && !selectedContext.value) {
        selectedContext.value = fetchedContexts[0].name
      }
    }
  } catch (err) {
    console.error('Error fetching contexts:', err)
  }
})

onUnmounted(() => {
  // Reset state when leaving the view
  selectedContext.value = ''
  repositoryId.value = null
})
</script>

<template>
  <div class="guidelines-view">
    <div v-if="isLoadingRepoId" class="loading-message">
      Loading repository...
    </div>
    <div v-else-if="errorState">
      <p class="error-message">Error: {{ errorState }}</p>
      <p>Cannot display guidelines without repository context.</p>
    </div>
    <div v-else>
      <div class="header">
        <span />
        <div class="header-buttons">
          <Button
            v-if="contexts.length > 0"
            icon="pi pi-plus"
            label="New Guideline"
            @click="showCreateGuideline"
          />
          <Button
            icon="pi pi-cog"
            label="Manage Contexts"
            @click="showContextManager = true"
          />
        </div>
      </div>

      <div v-if="isLoadingContexts" class="loading-message">
        Loading contexts...
      </div>
      <div v-else-if="contexts.length === 0">
        <p>No contexts defined. Please create at least one context.</p>
      </div>
      <div v-else>
        <Tabs v-model:value="selectedContext">
          <TabList class="context-tabs">
            <Tab
              v-for="context in contexts"
              :key="context.id"
              :value="context.name"
              :pt="{
                root: { class: 'cursor-pointer' },
              }"
            >
              {{ context.name }}
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel
              v-for="context in contexts"
              :key="context.id"
              :value="context.name"
            >
              <GuidelinesDisplay :contexts="contexts" />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>

      <Dialog
        v-model:visible="showContextManager"
        modal
        header="Manage contexts"
        :style="{ width: '80vw' }"
      >
        <GuidelinesContextsManager
          ref="managersRef"
          @updated="handleContextsUpdated"
        />
      </Dialog>
    </div>
  </div>
</template>

<style scoped>
.guidelines-view {
  padding: 1rem;
}

.context-tabs {
  position: sticky;
  top: 0;
  z-index: 1;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header-buttons {
  display: flex;
  gap: 0.5rem;
}

h1 {
  margin: 0;
  font-size: 1.8rem;
}

.error-message {
  color: var(--p-red-500, #ef4444);
  background-color: var(--p-red-50, #fee2e2);
  border: 1px solid var(--p-red-200, #fecaca);
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.loading-message {
  padding: 1rem;
  text-align: center;
  color: var(--text-color-secondary);
}

.mb-2 {
  margin-bottom: 0.5rem;
}

.mb-4 {
  margin-bottom: 1rem;
}
</style>
