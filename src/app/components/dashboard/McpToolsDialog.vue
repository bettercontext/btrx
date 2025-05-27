<script setup lang="ts">
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'

interface Props {
  visible: boolean
  loading?: boolean
  error?: string | null
  tools: Array<{
    name: string
    description: string
  }>
}

defineProps<Props>()
const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    header="Available MCP tools"
    :style="{ width: '50vw' }"
    @update:visible="(val) => emit('update:visible', val)"
  >
    <div class="dialog-content">
      <div v-if="loading">Loading tools...</div>
      <div v-else-if="error" class="error-message">{{ error }}</div>
      <div v-else>
        <DataTable
          :value="tools"
          :loading="loading"
          responsive-layout="scroll"
          striped-rows
        >
          <Column field="name">
            <template #body="{ data }">
              <div class="tool-cell">
                <span class="tool-name">{{ data.name }}</span>
                <span class="tool-description">{{ data.description }}</span>
              </div>
            </template>
          </Column>
        </DataTable>

        <p v-if="!tools.length">No MCP tools found.</p>
      </div>
    </div>
  </Dialog>
</template>

<style scoped lang="scss">
.dialog-content {
  padding: 1rem;
  padding-top: 0;
}

:deep(.p-datatable) {
  max-height: calc(80vh - 200px);
  overflow-y: auto;

  .p-datatable-header,
  .p-datatable-thead {
    display: none;
  }
}

.tool-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.tool-name {
  font-weight: bold;
}

.tool-description {
  color: var(--text-color-secondary);
  font-size: 0.9em;
}

.error-message {
  color: var(--red-500);
}
</style>
