<script setup lang="ts">
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'

import GuidelineDialog from './GuidelineDialog.vue'

interface Props {
  visible: boolean
  contexts: { id: number; name: string; prompt: string }[]
  selectedContext: string
  content: string
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'update:selectedContext' | 'update:content', value: string): void
  (e: 'create'): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<template>
  <GuidelineDialog
    :visible="visible"
    title="New Guideline"
    @update:visible="$emit('update:visible', $event)"
    @confirm="$emit('create')"
  >
    <div class="form-field">
      <label for="context">Context</label>
      <Dropdown
        id="context"
        :model-value="selectedContext"
        :options="contexts.map((c) => c.name)"
        placeholder="Select a context"
        @update:model-value="$emit('update:selectedContext', $event)"
      />
    </div>
    <div class="form-field">
      <label for="guideline-content">Guideline</label>
      <Textarea
        id="guideline-content"
        :model-value="content"
        rows="5"
        auto-resize
        placeholder="Enter your guideline here..."
        @update:model-value="$emit('update:content', $event)"
      />
    </div>
  </GuidelineDialog>
</template>

<style scoped>
.form-field {
  margin-bottom: 1rem;
}

.form-field label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

:deep(.p-dropdown),
:deep(.p-textarea) {
  width: 100%;
}
</style>
