<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'

import { useGuidelinesPresets } from '@/app/composables/guidelines/contexts/useGuidelinesPresets'

interface FormData {
  name: string
  prompt: string
}

const props = defineProps<{
  modelValue: FormData
  isEditing: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: FormData): void
}>()

const { presets, isLoading, fetchPresets, loadPresetContent } =
  useGuidelinesPresets()
const selectedPresetFilename = ref<string | null>(null)

const touched = ref({
  name: false,
  prompt: false,
})

const handleFieldBlur = (field: keyof typeof touched.value) => {
  touched.value[field] = true
}

const updateField = (field: keyof FormData, value: string | undefined) => {
  const newValue = value || ''
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: newValue,
  })

  // Mark field as touched on input
  touched.value[field] = true
}

const handlePresetChange = async (filename: string | null) => {
  if (!props.isEditing && filename) {
    const preset = await loadPresetContent(filename)
    if (preset) {
      emit('update:modelValue', {
        name: preset.name,
        prompt: preset.prompt,
      })
      // Reset touched state when loading preset
      touched.value = {
        name: false,
        prompt: false,
      }
    }
  }
}

// Reset touched state when modelValue changes externally
watch(
  () => props.modelValue,
  () => {
    touched.value = {
      name: false,
      prompt: false,
    }
  },
)

fetchPresets()

const isValid = computed(() => {
  const name = props.modelValue.name.trim()
  const prompt = props.modelValue.prompt.trim()
  return name.length > 0 && prompt.length > 0
})

defineExpose({
  isValid,
})
</script>

<template>
  <div class="context-form">
    <div v-if="!isEditing" class="form-field">
      <label for="preset">Preset</label>
      <Dropdown
        id="preset"
        v-model="selectedPresetFilename"
        :options="presets"
        :loading="isLoading"
        option-label="label"
        option-value="value"
        placeholder="Select a preset (optional)"
        class="w-full"
        @update:model-value="handlePresetChange"
      />
    </div>

    <div class="form-field">
      <label for="name">Name</label>
      <InputText
        id="name"
        :model-value="modelValue.name"
        :class="{ 'p-invalid': touched.name && !modelValue.name }"
        required
        @update:model-value="updateField('name', $event)"
        @blur="handleFieldBlur('name')"
      />
    </div>

    <div class="form-field">
      <label for="prompt">Prompt</label>
      <Textarea
        id="prompt"
        :model-value="modelValue.prompt"
        :class="{ 'p-invalid': touched.prompt && !modelValue.prompt }"
        rows="5"
        required
        auto-resize
        @update:model-value="updateField('prompt', $event)"
        @blur="handleFieldBlur('prompt')"
      />
    </div>
  </div>
</template>

<style scoped>
.context-form {
  padding: 1rem;
}

.form-field {
  margin-bottom: 1rem;
}

.form-field label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

:deep(.p-inputtext),
:deep(.p-textarea) {
  width: 100%;
}
</style>
