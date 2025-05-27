<script setup lang="ts">
import { onMounted, ref } from 'vue'

import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Menu from 'primevue/menu'

import { fetchApi } from '@/app/helpers/api'

interface Repository {
  id: number
  origin: string
}

interface Emits {
  (e: 'edit' | 'delete', repository: Repository): void
}

const emit = defineEmits<Emits>()

const repositories = ref<Repository[]>([])
const loading = ref(false)
const menuRef = ref()
const selectedRepository = ref<Repository | null>(null)

const loadRepositories = async () => {
  loading.value = true
  try {
    const data = await fetchApi<Repository[]>('/api/repositories/all')
    repositories.value = data
  } catch (error) {
    console.error('Error fetching repositories:', error)
  } finally {
    loading.value = false
  }
}

const toggleMenu = (event: Event, repository: Repository) => {
  selectedRepository.value = repository
  menuRef.value?.toggle(event)
}

const menuItems = [
  {
    label: 'Edit',
    icon: 'pi pi-pencil',
    command: () => {
      if (selectedRepository.value) {
        emit('edit', selectedRepository.value)
      }
    },
  },
  {
    label: 'Delete',
    icon: 'pi pi-trash',
    command: () => {
      if (selectedRepository.value) {
        emit('delete', selectedRepository.value)
      }
    },
  },
]

onMounted(async () => {
  await loadRepositories()
})

defineExpose({
  loadRepositories,
})
</script>

<template>
  <div>
    <Menu ref="menuRef" :model="menuItems" :popup="true" />

    <div v-if="!loading && repositories.length === 0" class="empty-state">
      <div class="empty-content">
        <i class="pi pi-folder-open empty-icon" />
        <h3>No repositories found</h3>
        <p>
          No repositories configured yet. A repository will be set automatically
          when a context (guidelines) is added.
        </p>
      </div>
    </div>

    <DataTable
      v-else
      :value="repositories"
      :loading="loading"
      striped-rows
      responsive-layout="scroll"
    >
      <Column field="origin" header="Origin" style="width: 100%" />
      <Column style="width: 50px; min-width: 50px">
        <template #body="{ data }">
          <Button
            icon="pi pi-ellipsis-v"
            rounded
            text
            severity="secondary"
            @click="toggleMenu($event, data)"
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<style scoped>
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-color-secondary);
}

.empty-content {
  max-width: 400px;
  margin: 0 auto;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.6;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  color: var(--text-color);
}

.empty-state p {
  margin: 0;
  line-height: 1.5;
}
</style>
