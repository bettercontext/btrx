<script setup lang="ts">
import GuidelineDialog from './GuidelineDialog.vue'

interface Props {
  visible: boolean
  count?: number
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'delete'): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<template>
  <GuidelineDialog
    :visible="visible"
    :title="count && count > 1 ? 'Delete Guidelines' : 'Delete Guideline'"
    @update:visible="$emit('update:visible', $event)"
    @confirm="$emit('delete')"
  >
    <p>
      <template v-if="count && count > 1">
        Are you sure you want to delete {{ count }} selected guidelines?
      </template>
      <template v-else>
        Are you sure you want to delete this guideline?
      </template>
    </p>
  </GuidelineDialog>
</template>

<style scoped>
p {
  margin-bottom: 0;
}
</style>
