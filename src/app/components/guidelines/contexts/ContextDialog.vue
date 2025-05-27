<script setup lang="ts">
import { computed, ref } from 'vue'

import Button from 'primevue/button'
import Dialog from 'primevue/dialog'

import type { GuidelinesContext } from '@/app/composables/guidelines/contexts/useGuidelinesContexts'

import ContextForm from './ContextForm.vue'

const props = defineProps<{
  show: boolean
  context?: GuidelinesContext | null
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'save', formData: { name: string; prompt: string }): void
}>()

const formRef = ref()
const localData = ref({
  name: '',
  prompt: '',
})

const formData = computed({
  get: () => ({
    name: props.context?.name || localData.value.name,
    prompt: props.context?.prompt || localData.value.prompt,
  }),
  set: (value) => {
    localData.value = value
  },
})

const dialogVisible = computed({
  get: () => props.show,
  set: (value) => {
    if (!value) {
      // Reset form when closing
      localData.value = { name: '', prompt: '' }
    }
    emit('update:show', value)
  },
})

const isFormValid = computed(() => {
  return formRef.value?.isValid || false
})

const handleSave = () => {
  if (isFormValid.value) {
    emit('save', formData.value)
    dialogVisible.value = false
  }
}
</script>

<template>
  <Dialog
    v-model:visible="dialogVisible"
    :modal="true"
    :header="context ? 'Edit Context' : 'New Context'"
    class="context-dialog"
    :style="{ width: '700px' }"
  >
    <ContextForm ref="formRef" v-model="formData" :is-editing="!!context" />

    <template #footer>
      <Button
        label="Cancel"
        icon="pi pi-times"
        class="p-button-text"
        @click="dialogVisible = false"
      />
      <Button
        label="Save"
        icon="pi pi-check"
        :disabled="!isFormValid"
        @click="handleSave"
      />
    </template>
  </Dialog>
</template>

<style scoped>
.context-dialog :deep(.p-dialog-content) {
  padding: 0;
}
</style>
