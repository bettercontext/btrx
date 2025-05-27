<script setup lang="ts">
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'

import type { GuidelinesContext } from '@/app/composables/guidelines/contexts/useGuidelinesContexts'

defineProps<{
  show: boolean
  context: GuidelinesContext | null
}>()

defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'confirm'): void
}>()
</script>

<template>
  <Dialog
    :visible="show"
    :modal="true"
    header="Delete Context"
    :style="{ width: '450px' }"
    @update:visible="$emit('update:show', $event)"
  >
    <div class="p-4">
      <p>Are you sure you want to delete this context?</p>
    </div>
    <template #footer>
      <Button
        label="Cancel"
        icon="pi pi-times"
        class="p-button-text"
        @click="$emit('update:show', false)"
      />
      <Button
        label="Delete"
        icon="pi pi-trash"
        class="p-button-danger"
        @click="$emit('confirm')"
      />
    </template>
  </Dialog>
</template>
