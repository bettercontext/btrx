<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRouter } from 'vue-router'

import { OverlayScrollbarsComponent } from 'overlayscrollbars-vue'
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import Toast from 'primevue/toast'

import appLogoDm from '@/app/assets/app-logo-dm.png'
import appLogo from '@/app/assets/app-logo.png'

import DarkModeToggle from './components/DarkModeToggle.vue'
import { useDarkMode } from './composables/useDarkMode'

const router = useRouter()
const { isDarkMode } = useDarkMode()

const currentLogo = computed(() => (isDarkMode.value ? appLogoDm : appLogo))
const version = __APP_VERSION__

const items = computed(() => [
  {
    items: [
      {
        label: 'Dashboard',
        icon: 'pi pi-th-large',
        command: () => router.push('/'),
        class:
          router.currentRoute.value.path === '/' ? 'router-link-active' : '',
      },
      {
        label: 'Guidelines',
        icon: 'pi pi-code',
        command: () => router.push('/guidelines'),
        class:
          router.currentRoute.value.path === '/guidelines'
            ? 'router-link-active'
            : '',
      },
    ],
  },
])
</script>

<template>
  <div class="app-layout">
    <div class="sidebar-container">
      <div class="logo-container">
        <img :src="currentLogo" alt="Better Context" class="app-logo" />
      </div>
      <Menu :model="items" class="w-full border-none" />
    </div>
    <div class="main-content">
      <OverlayScrollbarsComponent
        defer
        :options="{ scrollbars: { autoHide: 'scroll' } }"
      >
        <RouterView />
      </OverlayScrollbarsComponent>
    </div>
    <div class="bottom-controls">
      <div class="sidebar-bottom-content">
        <div class="settings-container">
          <Button
            icon="pi pi-cog"
            text
            :class="{
              'router-link-active':
                router.currentRoute.value.path === '/settings',
            }"
            @click="router.push('/settings')"
          />
          <span class="version-text">v{{ version }}</span>
        </div>
        <DarkModeToggle />
      </div>
    </div>
  </div>
  <Toast />
</template>

<style scoped lang="scss">
.app-layout {
  display: flex;
  width: 100%;
  align-items: flex-start;
}

.sidebar-container {
  width: 170px;
  flex-shrink: 0;
  box-sizing: border-box;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  padding-top: 5px;
  background-color: var(--p-surface-100);

  .logo-container {
    display: flex;
    justify-content: center;
    align-items: center;

    .app-logo {
      width: 64px;
      height: auto;
    }
  }
}

h2 {
  font-weight: 400;
}

html.dark-mode .sidebar-container {
  background-color: var(--p-surface-800);
}

.main-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  min-width: 0;
  padding: 0;
  height: 100vh;
  overflow: hidden;

  :deep(.os-viewport) {
    padding: 0 !important;
  }
}

.bottom-controls {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 170px;
  padding: 0.5rem;
  background-color: var(--p-surface-100);
  border-top: 1px solid var(--surface-border);

  .sidebar-bottom-content {
    display: flex;
    flex-direction: column;
  }

  .settings-container {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;

    :deep(.p-button) {
      padding: 0.5rem;
      margin: 0;
      height: auto;
      min-width: 0;
      margin-left: -0.5rem;

      span {
        font-size: 20px !important;
      }

      &.router-link-active {
        span {
          color: var(--color-text);
        }
      }
    }

    .version-text {
      font-size: 0.8rem;
      color: var(--text-color-secondary);
    }
  }
}

html.dark-mode .bottom-controls {
  background-color: var(--p-surface-800);
}

header,
nav,
.logo,
.wrapper {
  display: none;
}

:deep(.p-menu) {
  border: none;
  width: 100% !important;
  background: transparent;
}

:deep(.p-menu-submenu-label) {
  display: none;
}

:deep(.p-menuitem-content) {
  border-radius: 6px;
}

:deep(.p-menuitem-link:hover) {
  background-color: var(--sidebar-item-hover-bg);
}

:deep(.p-menuitem > .p-menuitem-content > a) {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: inherit;
  padding: 0.75rem 1.25rem;
  border-radius: 6px;
  cursor: pointer;
}

:deep(.p-menuitem > .p-menuitem-content > a:hover) {
  background-color: var(--sidebar-item-hover-bg);
}

:deep(.router-link-active) {
  .p-menu-item-label {
    font-weight: bold;
  }
}
</style>
