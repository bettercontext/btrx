<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import InputSwitch from 'primevue/inputswitch'
import Menu from 'primevue/menu'

import { guidelinesState } from '@/app/composables/guidelines/useGuidelines'
import { guidelinesDiffState } from '@/app/composables/guidelines/useGuidelinesDiff'
import type { Guideline } from '@/services/guidelines'

interface Props {
  guidelines: Guideline[]
  selectedGuidelines: Guideline[]
  isLoading: boolean
  updatingId: number | null
  contexts: { id: number; name: string; prompt: string }[]
}

interface Emits {
  (e: 'update:selectedGuidelines', value: Guideline[]): void
  (e: 'stateChange', id: number, newState: boolean): void
  (e: 'menuOpen', guideline: Guideline, event: Event): void
  (e: 'edit' | 'delete'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { selectedContext } = guidelinesState
const {
  contextsWithPending,
  fetchDiffData,
  getDiffRows,
  validatePending,
  cancelPending,
  isLoadingDiff,
} = guidelinesDiffState

const menuRef = ref()

const selectedContextData = computed(() => {
  return props.contexts.find((ctx) => ctx.name === selectedContext.value)
})

const contextHasPending = computed(() => {
  const contextData = selectedContextData.value
  if (!contextData) return false
  return contextsWithPending.value.some((ctx) => ctx.id === contextData.id)
})

const diffRows = computed(() => {
  if (!selectedContextData.value || !contextHasPending.value) {
    return []
  }
  return getDiffRows(selectedContextData.value.id)
})

const showDiff = computed(() => {
  return contextHasPending.value && diffRows.value.length > 0
})

const toggleMenu = (event: Event, guideline: Guideline) => {
  emit('menuOpen', guideline, event)
  menuRef.value?.toggle(event)
}

const handleValidateDiff = async () => {
  if (!selectedContextData.value) return
  try {
    await validatePending(selectedContextData.value.id)
  } catch (error) {
    console.error('Error validating diff:', error)
  }
}

const handleCancelDiff = async () => {
  if (!selectedContextData.value) return
  try {
    await cancelPending(selectedContextData.value.id)
  } catch (error) {
    console.error('Error cancelling diff:', error)
  }
}

const getDiffRowClass = (data: any) => {
  if (data.type === 'added') return 'diff-row-added'
  if (data.type === 'removed') return 'diff-row-removed'
  return 'diff-row-unchanged'
}

const menuItems = [
  {
    label: 'Edit',
    icon: 'pi pi-pencil',
    command: () => emit('edit'),
  },
  {
    label: 'Delete',
    icon: 'pi pi-trash',
    command: () => emit('delete'),
  },
]

watch(selectedContextData, async (newContext) => {
  if (newContext && contextHasPending.value) {
    await fetchDiffData(newContext.id)
  }
})

onMounted(async () => {
  if (selectedContextData.value && contextHasPending.value) {
    await fetchDiffData(selectedContextData.value.id)
  }
})
</script>

<template>
  <div
    class="guidelines-table-with-diff"
    :class="{ 'has-selected': selectedGuidelines.length > 0 }"
  >
    <Menu ref="menuRef" :model="menuItems" :popup="true" />

    <!-- Diff Actions when diff mode is active -->
    <div v-if="showDiff" class="diff-actions">
      <div class="diff-header">
        <h4>Pending changes</h4>
        <div class="actions">
          <Button
            label="Validate"
            icon="pi pi-check"
            severity="success"
            :loading="isLoadingDiff"
            @click="handleValidateDiff"
          />
          <Button
            label="Cancel"
            icon="pi pi-times"
            severity="danger"
            :loading="isLoadingDiff"
            @click="handleCancelDiff"
          />
        </div>
      </div>
    </div>

    <!-- Diff View -->
    <div v-if="showDiff" class="diff-view">
      <DataTable
        :value="diffRows"
        data-key="id"
        :loading="isLoadingDiff"
        responsive-layout="scroll"
        striped-rows
        class="diff-table"
        :row-class="getDiffRowClass"
      >
        <Column field="content" header="Changes" style="width: 100%">
          <template #body="{ data }">
            <div
              class="diff-line"
              :class="{
                'diff-added': data.type === 'added',
                'diff-removed': data.type === 'removed',
                'diff-unchanged': data.type === 'unchanged',
              }"
            >
              <span class="diff-indicator">{{
                data.type === 'added'
                  ? '+'
                  : data.type === 'removed'
                    ? '-'
                    : ' '
              }}</span
              >{{ data.content }}
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Regular Guidelines Table -->
    <div v-if="!showDiff">
      <p v-if="!guidelines.length">No guidelines found for this context.</p>
      <DataTable
        v-else
        :selection="selectedGuidelines"
        :value="guidelines"
        data-key="id"
        :loading="isLoading"
        responsive-layout="scroll"
        striped-rows
        @update:selection="$emit('update:selectedGuidelines', $event)"
      >
        <Column selection-mode="multiple" header-style="width: 3rem" />
        <Column field="content" header="Guideline" style="width: 100%">
          <template #body="{ data }">
            <div class="guideline-content">{{ data.content }}</div>
          </template>
        </Column>
        <Column field="active" header="Active">
          <template #body="{ data }">
            <InputSwitch
              :model-value="data.active"
              :disabled="updatingId === data.id"
              @update:model-value="emit('stateChange', data.id, $event)"
            />
          </template>
        </Column>
        <Column>
          <template #body="{ data }">
            <Button
              icon="pi pi-ellipsis-v"
              rounded
              text
              severity="secondary"
              @click="toggleMenu($event, data)"
            />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.guidelines-table-with-diff {
  margin-top: 1rem;
}

.has-selected {
  padding-bottom: 55px;
}

.diff-actions {
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: var(--p-surface-50, #f8fafc);
  border: 1px solid var(--p-surface-200, #e2e8f0);
  border-radius: 6px;
}

.diff-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.diff-header h4 {
  margin: 0;
  color: var(--p-text-color);
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.diff-view {
  margin-bottom: 1rem;
}

.diff-table :deep(.p-datatable) {
  border: 1px solid var(--p-surface-300, #cbd5e1);
}

/* Row-level background colors for diff */
.diff-table :deep(.diff-row-added) {
  background-color: var(--p-green-50, #f0fdf4) !important;
}

.diff-table :deep(.diff-row-removed) {
  background-color: var(--p-red-50, #fef2f2) !important;
}

.diff-table :deep(.diff-row-unchanged) {
  background-color: transparent !important;
}

.diff-line {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  padding: 0.25rem 0;
  display: flex;
  align-items: flex-start;
  white-space: pre-wrap;
}

.diff-indicator {
  width: 20px;
  font-weight: bold;
  margin-right: 0.5rem;
}

/* Text colors for diff content */
.diff-added {
  color: var(--p-green-800, #166534);
}

.diff-added .diff-indicator {
  color: var(--p-green-600, #16a34a);
}

.diff-removed {
  color: var(--p-red-800, #991b1b);
}

.diff-removed .diff-indicator {
  color: var(--p-red-600, #dc2626);
}

.diff-unchanged {
  color: var(--p-text-color);
}

.diff-unchanged .diff-indicator {
  color: var(--p-text-color-secondary);
}

.guideline-content {
  white-space: pre-wrap;
}
</style>
