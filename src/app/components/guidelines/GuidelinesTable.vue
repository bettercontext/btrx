<script setup lang="ts">
import { ref } from 'vue'

import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import InputSwitch from 'primevue/inputswitch'
import Menu from 'primevue/menu'

import type { Guideline } from '@/services/guidelines'

interface Props {
  guidelines: Guideline[]
  selectedGuidelines: Guideline[]
  isLoading: boolean
  updatingId: number | null
}

interface Emits {
  (e: 'update:selectedGuidelines', value: Guideline[]): void
  (e: 'stateChange', id: number, newState: boolean): void
  (e: 'menuOpen', guideline: Guideline, event: Event): void
  (e: 'edit' | 'delete'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
const menuRef = ref()

const toggleMenu = (event: Event, guideline: Guideline) => {
  emit('menuOpen', guideline, event)
  menuRef.value?.toggle(event)
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
</script>

<template>
  <div
    class="guidelines-table"
    :class="{ 'has-selected': selectedGuidelines.length > 0 }"
  >
    <Menu ref="menuRef" :model="menuItems" :popup="true" />

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
</template>

<style scoped>
:deep(.p-datatable) {
  margin-top: 1rem;
}

.has-selected {
  padding-bottom: 55px;
}

.guideline-content {
  white-space: pre-wrap;
}
</style>
