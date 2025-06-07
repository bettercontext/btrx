<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'

import Button from 'primevue/button'

import { useMcpTools } from '@/app/composables/dashboard/useMcpTools'
import { fetchApi } from '@/app/helpers/api'

import McpToolsDialog from './McpToolsDialog.vue'

const serverAvailable = ref(false)
const mcpUrl = ref('')
const showModal = ref(false)
let statusInterval: number | null = null

const { tools, loading, error, fetchMcpTools } = useMcpTools()

watch(showModal, (newVal) => {
  if (newVal) {
    fetchMcpTools()
  }
})

interface McpStatus {
  available: boolean
  httpUrl: string
}

const updateMcpStatus = async () => {
  try {
    const statusData = await fetchApi<McpStatus>('/api/mcp-client-status')
    serverAvailable.value = statusData.available
    mcpUrl.value = statusData.httpUrl
  } catch (e) {
    console.error('Failed to fetch MCP status:', e)
    serverAvailable.value = false
  }
}

onMounted(async () => {
  await updateMcpStatus()
  statusInterval = window.setInterval(updateMcpStatus, 5000)
})

onUnmounted(() => {
  if (statusInterval) {
    clearInterval(statusInterval)
    statusInterval = null
  }
})
</script>

<template>
  <div class="card mcp-card">
    <h2>MCP server status</h2>
    <div class="card-content">
      <div class="info-row status">
        <span class="status-indicator" :class="{ active: serverAvailable }" />
        <span class="status-text">{{
          serverAvailable ? 'Server available' : 'Server unavailable'
        }}</span>
      </div>
      <div class="info-row">
        <span class="label">Connection URL:</span>
        <code class="value">{{ mcpUrl }}</code>
      </div>
    </div>
    <div class="tools-section">
      <Button
        type="button"
        text
        rounded
        size="small"
        class="p-button-sm"
        @click="showModal = true"
      >
        <i class="pi pi-list mr-2" />
        Available Tools
      </Button>
    </div>
  </div>

  <McpToolsDialog
    v-model:visible="showModal"
    :tools="tools"
    :loading="loading"
    :error="error"
  />
</template>

<style scoped>
.card {
  background: var(--sidebar-bg);
  border-radius: 8px;
  padding: 1.5rem;
  transition: transform 0.2s ease;
  border: 1px solid var(--p-surface-border);
  width: 100%;
}

.card h2 {
  margin: 0 0 1.5rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tools-section {
  margin-top: 1rem;
  text-align: center;
}

.label {
  font-size: 0.875rem;
  color: var(--color-text-light);
}

.value {
  font-size: 0.875rem;
  word-break: break-all;
}

code.value {
  background: var(--color-background);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: monospace;
}

.status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #dc3545;
}

.status-indicator.active {
  background: #198754;
}

@media (max-width: 750px) {
  .card {
    padding: 1rem;
  }
}
</style>
