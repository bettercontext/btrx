import { ref } from 'vue'

const isDarkMode = ref(false)

export function useDarkMode() {
  const updateHtmlClass = (value: boolean) => {
    if (value) {
      document.documentElement.classList.add('dark-mode')
    } else {
      document.documentElement.classList.remove('dark-mode')
    }
  }

  const initDarkMode = () => {
    const storedPreference = localStorage.getItem('darkMode')
    if (storedPreference) {
      isDarkMode.value = storedPreference === 'true'
    }
    updateHtmlClass(isDarkMode.value)
  }

  const toggleDarkMode = (value: boolean) => {
    isDarkMode.value = value
    localStorage.setItem('darkMode', String(value))
    updateHtmlClass(value)
  }

  return {
    isDarkMode,
    initDarkMode,
    toggleDarkMode,
  }
}
