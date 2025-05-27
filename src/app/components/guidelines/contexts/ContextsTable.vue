<script setup lang="ts">
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'

import type { GuidelinesContext } from '@/app/composables/guidelines/contexts/useGuidelinesContexts'

defineProps<{
  contexts: GuidelinesContext[]
  loading: boolean
}>()

defineEmits<{
  (e: 'edit' | 'delete', context: GuidelinesContext): void
}>()
</script>

<template>
  <DataTable
    :value="contexts"
    :loading="loading"
    striped-rows
    responsive-layout="scroll"
  >
    <Column field="name" header="Name" />
    <Column field="prompt" header="Prompt">
      <template #body="{ data }">
        <div class="prompt-cell">{{ data.prompt }}</div>
      </template>
    </Column>
    <Column header="Actions">
      <template #body="{ data }">
        <div class="actions">
          <Button
            icon="pi pi-pencil"
            class="p-button-sm p-button-text"
            @click="$emit('edit', data)"
          />
          <Button
            icon="pi pi-trash"
            class="p-button-sm p-button-text p-button-danger"
            @click="$emit('delete', data)"
          />
        </div>
      </template>
    </Column>
  </DataTable>
</template>

<style scoped>
.prompt-cell {
  white-space: pre-wrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.actions {
  display: flex;
  gap: 0.5rem;
}
</style>
