<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'

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
  (
    e: 'save',
    data: {
      origin: string
    },
  ): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<Emits>()

const form = ref({
  origin: '',
})

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
})

const isFormValid = computed(() => {
  return form.value.origin.trim()
})

watch(
  () => props.repository,
  (repository) => {
    if (repository) {
      form.value = {
        origin: repository.origin,
      }
    }
  },
  { immediate: true },
)

const handleSave = () => {
  if (isFormValid.value) {
    emit('save', {
      origin: form.value.origin.trim(),
    })
  }
}

const handleCancel = () => {
  isVisible.value = false
}
</script>

<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    header="Edit repository"
    :style="{ width: '450px' }"
  >
    <div class="form-field">
      <label for="origin">Origin</label>
      <InputText
        id="origin"
        v-model="form.origin"
        :disabled="loading"
        placeholder="Repository origin (Git URL or path)"
      />
    </div>

    <template #footer>
      <Button
        label="Cancel"
        severity="secondary"
        :disabled="loading"
        @click="handleCancel"
      />
      <Button
        label="Save"
        :disabled="!isFormValid || loading"
        :loading="loading"
        @click="handleSave"
      />
    </template>
  </Dialog>
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

:deep(.p-inputtext) {
  width: 100%;
}
</style>
