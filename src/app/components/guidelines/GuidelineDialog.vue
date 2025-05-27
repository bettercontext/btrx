<script setup lang="ts">
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'

interface Props {
  visible: boolean
  title: string
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const handleClose = () => {
  emit('update:visible', false)
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    :header="title"
    :style="{ width: '50vw' }"
    @update:visible="(val) => emit('update:visible', val)"
  >
    <div class="dialog-content">
      <slot />
    </div>
    <template #footer>
      <Button label="Cancel" icon="pi pi-times" text @click="handleClose" />
      <Button label="Confirm" icon="pi pi-check" @click="$emit('confirm')" />
    </template>
  </Dialog>
</template>

<style scoped>
.dialog-content {
  padding: 1rem;
  padding-top: 0;
}
</style>
