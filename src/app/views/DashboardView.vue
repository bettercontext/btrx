<script setup lang="ts">
import McpStatusCard from '@/app/components/dashboard/McpStatusCard.vue'
import RepositoryCard from '@/app/components/dashboard/RepositoryCard.vue'
</script>

<template>
  <div class="dashboard">
    <div class="dashboard-grid">
      <RepositoryCard />
      <McpStatusCard />
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 1.5rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(350px, 400px));
  gap: 1.5rem;
  justify-content: start;
}

@media (max-width: 750px) {
  .dashboard {
    padding: 1rem;
  }

  .dashboard-grid {
    grid-template-columns: minmax(0, 350px);
  }
}
</style>
