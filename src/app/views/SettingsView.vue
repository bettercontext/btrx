<script setup lang="ts">
import { ref } from 'vue'

import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'

import RepositoriesTable from '@/app/components/settings/RepositoriesTable.vue'
import RepositoryDeleteDialog from '@/app/components/settings/RepositoryDeleteDialog.vue'
import RepositoryEditDialog from '@/app/components/settings/RepositoryEditDialog.vue'
import { fetchApi } from '@/app/helpers/api'

interface Repository {
  id: number
  origin: string
}

const toast = useToast()
const repositoriesTableRef = ref()

const editDialog = ref({
  visible: false,
  repository: null as Repository | null,
  loading: false,
})

const deleteDialog = ref({
  visible: false,
  repository: null as Repository | null,
  loading: false,
})

const handleEdit = (repository: Repository) => {
  editDialog.value.repository = repository
  editDialog.value.visible = true
}

const handleDelete = (repository: Repository) => {
  deleteDialog.value.repository = repository
  deleteDialog.value.visible = true
}

const handleEditSave = async (data: { origin: string }) => {
  if (!editDialog.value.repository) return

  editDialog.value.loading = true
  try {
    await fetchApi(`/api/repositories/${editDialog.value.repository.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Repository updated successfully',
      life: 3000,
    })

    editDialog.value.visible = false
    await repositoriesTableRef.value?.loadRepositories()
  } catch (error) {
    console.error('Error updating repository:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update repository',
      life: 5000,
    })
  } finally {
    editDialog.value.loading = false
  }
}

const handleDeleteConfirm = async () => {
  if (!deleteDialog.value.repository) return

  deleteDialog.value.loading = true
  try {
    await fetchApi(`/api/repositories/${deleteDialog.value.repository.id}`, {
      method: 'DELETE',
    })

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Repository deleted successfully',
      life: 3000,
    })

    deleteDialog.value.visible = false
    await repositoriesTableRef.value?.loadRepositories()
  } catch (error) {
    console.error('Error deleting repository:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete repository',
      life: 5000,
    })
  } finally {
    deleteDialog.value.loading = false
  }
}
</script>

<template>
  <div class="settings-view">
    <Toast />

    <div class="section">
      <h2>Repositories</h2>
      <RepositoriesTable
        ref="repositoriesTableRef"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>

    <RepositoryEditDialog
      v-model:visible="editDialog.visible"
      :repository="editDialog.repository"
      :loading="editDialog.loading"
      @save="handleEditSave"
    />

    <RepositoryDeleteDialog
      v-model:visible="deleteDialog.visible"
      :repository="deleteDialog.repository"
      :loading="deleteDialog.loading"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>

<style scoped>
.settings-view {
  padding: 1rem;
}

.section {
  margin-bottom: 1rem;
}
</style>
