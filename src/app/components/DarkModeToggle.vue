<script setup lang="ts">
import { onMounted } from 'vue'

import ToggleSwitch from 'primevue/toggleswitch'

import { useDarkMode } from '../composables/useDarkMode'

const { isDarkMode, initDarkMode, toggleDarkMode } = useDarkMode()

onMounted(() => {
  initDarkMode()
})
</script>

<template>
  <div class="dark-mode-toggle">
    <div class="toggle-container">
      <i class="pi pi-sun icon-light" />
      <ToggleSwitch
        :model-value="isDarkMode"
        @update:model-value="toggleDarkMode"
      />
      <i class="pi pi-moon icon-dark" style="font-size: 1rem" />
    </div>
  </div>
</template>

<style scoped>
.dark-mode-toggle {
  display: flex;
  justify-content: center;
}

.toggle-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--surface-card);
  padding: 0.5rem;
  border-radius: 6px;
}

.icon-light,
.icon-dark {
  font-size: 1.2rem;
  color: var(--text-color-secondary);
}
</style>
