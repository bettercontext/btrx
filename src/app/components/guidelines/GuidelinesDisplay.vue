<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'

import { guidelinesState } from '@/app/composables/guidelines/useGuidelines'
import { guidelinesDiffState } from '@/app/composables/guidelines/useGuidelinesDiff'
import type { Guideline } from '@/services/guidelines'

import GuidelineCreateDialog from './GuidelineCreateDialog.vue'
import GuidelineDeleteDialog from './GuidelineDeleteDialog.vue'
import GuidelineEditDialog from './GuidelineEditDialog.vue'
import GuidelinesActions from './GuidelinesActions.vue'
import GuidelinesTable from './GuidelinesTable.vue'
import GuidelinesTableWithDiff from './GuidelinesTableWithDiff.vue'

interface Props {
  contexts: { id: number; name: string; prompt: string }[]
}

const props = defineProps<Props>()

const {
  showCreateDialog,
  showEditDialog,
  showDeleteDialog,
  repositoryId,
  selectedGuideline,
  selectedGuidelines,
  editedContent,
  newGuidelineContent,
  contextForNew,
  guidelines,
  isLoading,
  error,
  updatingId,
  selectedContext,
  createGuideline,
  updateState,
  updateGuideline,
  deleteGuideline,
  bulkUpdateState,
  bulkDelete,
} = guidelinesState

const { contextsWithPending, fetchContextsWithPending } = guidelinesDiffState

const hasSelection = computed(() => selectedGuidelines.value.length > 0)

// Auto diff mode based on pending contexts
const shouldShowDiff = computed(() => {
  const selectedContextData = props.contexts.find(
    (ctx) => ctx.name === selectedContext.value,
  )
  if (!selectedContextData) return false
  return contextsWithPending.value.some(
    (ctx) => ctx.id === selectedContextData.id,
  )
})

const handleMenuOpen = (guideline: Guideline, _event: Event) => {
  selectedGuideline.value = guideline
}

const handleBulkEnable = async () => {
  await bulkUpdateState(
    selectedGuidelines.value.map((g) => g.id),
    true,
  )
}

const handleBulkDisable = async () => {
  await bulkUpdateState(
    selectedGuidelines.value.map((g) => g.id),
    false,
  )
}

const handleBulkDelete = async () => {
  await bulkDelete(selectedGuidelines.value.map((g) => g.id))
}

const handleClose = () => {
  selectedGuidelines.value = []
}

// Load pending contexts on mount
onMounted(async () => {
  await fetchContextsWithPending()
})

// Refresh pending contexts when changing context
watch(selectedContext, async () => {
  await fetchContextsWithPending()
})
</script>

<template>
  <div class="guidelines-display">
    <div v-if="!repositoryId && !isLoading">
      <p>
        No repository selected or detected. Please ensure you are in a Git
        repository with an 'origin' remote.
      </p>
    </div>
    <div v-else-if="isLoading" class="loading-message">
      Loading guidelines...
    </div>
    <div v-else-if="error">
      <p class="error-message">{{ error }}</p>
    </div>
    <div v-else-if="repositoryId" class="guidelines-container">
      <!-- Diff mode enabled -->
      <GuidelinesTableWithDiff
        v-if="shouldShowDiff"
        v-model:selected-guidelines="selectedGuidelines"
        :guidelines="guidelines"
        :is-loading="isLoading"
        :updating-id="updatingId"
        :contexts="contexts"
        @state-change="updateState"
        @menu-open="handleMenuOpen"
        @edit="
          () => {
            if (selectedGuideline) {
              editedContent = selectedGuideline.content
              showEditDialog = true
            }
          }
        "
        @delete="
          () => {
            if (selectedGuideline) {
              showDeleteDialog = true
            }
          }
        "
      />

      <!-- Normal mode -->
      <GuidelinesTable
        v-else
        v-model:selected-guidelines="selectedGuidelines"
        :guidelines="guidelines"
        :is-loading="isLoading"
        :updating-id="updatingId"
        @state-change="updateState"
        @menu-open="handleMenuOpen"
        @edit="
          () => {
            if (selectedGuideline) {
              editedContent = selectedGuideline.content
              showEditDialog = true
            }
          }
        "
        @delete="
          () => {
            if (selectedGuideline) {
              showDeleteDialog = true
            }
          }
        "
      />

      <GuidelineCreateDialog
        v-model:visible="showCreateDialog"
        v-model:selected-context="contextForNew"
        v-model:content="newGuidelineContent"
        :contexts="contexts"
        @create="createGuideline"
      />

      <GuidelineEditDialog
        v-model:visible="showEditDialog"
        v-model:content="editedContent"
        @update="updateGuideline"
      />

      <GuidelineDeleteDialog
        v-model:visible="showDeleteDialog"
        :count="selectedGuidelines.length"
        @delete="deleteGuideline"
      />

      <GuidelinesActions
        :selected-count="selectedGuidelines.length"
        :visible="hasSelection"
        @enable="handleBulkEnable"
        @disable="handleBulkDisable"
        @delete="handleBulkDelete"
        @close="handleClose"
      />
    </div>
  </div>
</template>

<style scoped>
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
