<script setup lang="ts">
import { onMounted, ref } from 'vue'

import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'

import { useGuidelinesContexts } from '@/app/composables/guidelines/contexts/useGuidelinesContexts'
import { useRepositoryContext } from '@/app/composables/useRepositoryContext'

import ContextDeleteDialog from './ContextDeleteDialog.vue'
import ContextDialog from './ContextDialog.vue'
import ContextsTable from './ContextsTable.vue'

const emit = defineEmits<{
  updated: []
}>()

const {
  contexts,
  isLoadingContexts,
  fetchContexts,
  createContext,
  updateContext,
  deleteContext,
} = useGuidelinesContexts()
const toast = useToast()
const { contextCwd: currentRepositoryPath, validateRepositoryPath } =
  useRepositoryContext()

const showDialog = ref(false)
const showDeleteDialog = ref(false)
const editingContext = ref<{ id: number; name: string; prompt: string } | null>(
  null,
)

const openCreateDialog = () => {
  const error = validateRepositoryPath()
  if (error) {
    toast.add({
      severity: 'warn',
      summary: 'Repository Path Missing',
      detail:
        'Cannot create a new context without the repository path. Please ensure the server is providing it.',
      life: 4000,
    })
    return
  }

  editingContext.value = null
  showDialog.value = true
}

defineExpose({
  openCreateDialog,
})

const openEditDialog = (context: {
  id: number
  name: string
  prompt: string
}) => {
  editingContext.value = context
  showDialog.value = true
}

const handleSave = async (formData: { name: string; prompt: string }) => {
  let success = false

  if (editingContext.value) {
    success = await updateContext(editingContext.value.id, formData)
  } else if (currentRepositoryPath.value) {
    const error = validateRepositoryPath()
    if (!error) {
      success = await createContext({
        ...formData,
        repositoryPath: currentRepositoryPath.value,
      })
    }
  }

  if (success) {
    await fetchContexts(currentRepositoryPath.value, true)
    emit('updated')
  }
}

const openDeleteDialog = (context: {
  id: number
  name: string
  prompt: string
}) => {
  editingContext.value = context
  showDeleteDialog.value = true
}

const handleDelete = async () => {
  if (editingContext.value) {
    const success = await deleteContext(editingContext.value.id)
    if (success) {
      showDeleteDialog.value = false
      await fetchContexts(currentRepositoryPath.value, true)
      emit('updated')
    }
  }
}

onMounted(async () => {
  await fetchContexts(currentRepositoryPath.value)
})
</script>

<template>
  <div class="guidelines-contexts-manager">
    <div class="header">
      <span />
      <Button icon="pi pi-plus" label="New Context" @click="openCreateDialog" />
    </div>

    <ContextsTable
      :contexts="contexts"
      :loading="isLoadingContexts"
      @edit="openEditDialog"
      @delete="openDeleteDialog"
    />

    <ContextDialog
      v-model:show="showDialog"
      :context="editingContext"
      @save="handleSave"
    />

    <ContextDeleteDialog
      v-model:show="showDeleteDialog"
      :context="editingContext"
      @confirm="handleDelete"
    />
  </div>
</template>

<style scoped>
.guidelines-contexts-manager {
  padding: 1rem;
  padding-top: 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
</style>
