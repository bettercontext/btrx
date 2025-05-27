<script setup lang="ts">
import Textarea from 'primevue/textarea'

import GuidelineDialog from './GuidelineDialog.vue'

interface Props {
  visible: boolean
  content: string
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'update:content', value: string): void
  (e: 'update'): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<template>
  <GuidelineDialog
    :visible="visible"
    title="Edit Guideline"
    @update:visible="$emit('update:visible', $event)"
    @confirm="$emit('update')"
  >
    <div class="form-field">
      <label for="edit-guideline-content">Guideline</label>
      <Textarea
        id="edit-guideline-content"
        :model-value="content"
        rows="5"
        auto-resize
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

:deep(.p-textarea) {
  width: 100%;
}
</style>
