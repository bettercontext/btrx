<script setup lang="ts">
import Button from 'primevue/button'

interface Props {
  selectedCount: number
  visible: boolean
}

interface Emits {
  (e: 'enable' | 'disable' | 'delete' | 'close'): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<template>
  <div class="actions-bar" :class="{ 'has-selection': visible }">
    <span v-if="visible" class="selection-count">
      {{ selectedCount }} selected
      <Button
        v-if="visible"
        icon="pi pi-times"
        text
        rounded
        size="small"
        class="close-button p-button-sm"
        @click="$emit('close')"
      />
    </span>
    <div class="actions-buttons">
      <Button
        v-if="visible"
        label="Enable"
        text
        rounded
        size="small"
        severity="success"
        class="p-button-sm"
        @click="$emit('enable')"
      />
      <Button
        v-if="visible"
        label="Disable"
        text
        rounded
        size="small"
        severity="secondary"
        class="p-button-sm"
        @click="$emit('disable')"
      />
      <Button
        v-if="visible"
        label="Delete"
        icon="pi pi-trash"
        text
        rounded
        size="small"
        severity="danger"
        class="p-button-sm"
        @click="$emit('delete')"
      />
    </div>
  </div>
</template>

<style scoped>
.close-button {
  width: 32px !important;
  height: 32px !important;
}

.actions-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(
    to top,
    var(--surface-ground),
    var(--surface-card)
  );
  border-top: 1px solid var(--surface-border);
  box-shadow: var(--card-shadow);
  backdrop-filter: blur(10px);
  z-index: 5;
  transition: transform 0.2s ease;
  transform: translateY(0);
}

.selection-count {
  font-size: 0.875rem;
  color: var(--text-color);
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}

.actions-buttons {
  display: flex;
  gap: 0.75rem;
}

:deep(.p-button.p-button-sm) {
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
  width: 6.5rem;
  justify-content: center;
}

:deep(.p-button.p-button-text:hover) {
  background: transparent;
}

:deep(.p-button.p-button-text.p-button-danger:hover) {
  color: var(--red-600);
}

:deep(.p-button.p-button-text.p-button-success:hover) {
  color: var(--green-600);
}

:deep(.p-button.p-button-text.p-button-secondary:hover) {
  color: var(--text-color);
}

.actions-bar:not(.has-selection) {
  transform: translateY(100%);
}
</style>
