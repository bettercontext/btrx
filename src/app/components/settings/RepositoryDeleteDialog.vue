<script setup lang="ts">
import { computed } from 'vue'

import Button from 'primevue/button'
import Dialog from 'primevue/dialog'

interface Repository {
  id: number
  origin: string
}

interface Props {
  visible: boolean
  repository: Repository | null
  loading?: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm'): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<Emits>()

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
})

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  isVisible.value = false
}
</script>

<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    header="Delete Repository"
    :style="{ width: '450px' }"
  >
    <div class="flex align-items-center gap-3 mb-3">
      <div>
        <p class="m-0 mb-2">
          Are you sure you want to delete
          <strong> {{ repository?.origin }} </strong>?
        </p>
        <p class="m-0 text-xs text-color-secondary mt-2">
          This will also delete all associated contexts and guidelines. This
          action cannot be undone.
        </p>
      </div>
    </div>

    <template #footer>
      <Button
        label="Cancel"
        severity="secondary"
        :disabled="loading"
        @click="handleCancel"
      />
      <Button
        label="Delete"
        severity="danger"
        :disabled="loading"
        :loading="loading"
        @click="handleConfirm"
      />
    </template>
  </Dialog>
</template>
