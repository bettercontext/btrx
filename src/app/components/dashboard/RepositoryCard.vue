<script setup lang="ts">
import { useRepositoryContext } from '@/app/composables/useRepositoryContext'

const { contextCwd, gitOriginUrl, error, isLoading, isLoadingGit } =
  useRepositoryContext()
</script>

<template>
  <div v-if="isLoading" class="loading-state">
    <p>Loading context directory...</p>
  </div>
  <div v-else-if="error" class="error-state">
    <p>{{ error }}</p>
  </div>
  <div v-else class="card repo-card">
    <h2>Repository information</h2>
    <div v-if="contextCwd" class="card-content">
      <div class="info-row">
        <span class="label">Directory:</span>
        <code class="value">{{ contextCwd }}</code>
      </div>

      <div v-if="isLoadingGit" class="info-row loading">
        <span>Checking Git status...</span>
      </div>
      <template v-else>
        <div v-if="gitOriginUrl" class="info-row">
          <span class="label">Origin URL:</span>
          <code class="value">{{ gitOriginUrl }}</code>
        </div>
      </template>
    </div>
    <div v-else class="card-content">
      <p>Could not determine context directory.</p>
    </div>
  </div>
</template>

<style scoped>
.loading-state,
.error-state {
  text-align: center;
  padding: 2rem;
}

.error-state {
  color: #dc3545;
}

.card {
  background: var(--sidebar-bg);
  border-radius: 8px;
  padding: 1.5rem;
  transition: transform 0.2s ease;
  width: 100%;
  border: 1px solid var(--p-surface-border);
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

.loading {
  color: var(--color-text-light);
  font-style: italic;
}

.text-success {
  color: #198754;
}

@media (max-width: 750px) {
  .card {
    padding: 1rem;
  }
}
</style>
