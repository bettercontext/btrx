import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDarkMode } from './useDarkMode'

describe('useDarkMode', () => {
  let mockStorage: Record<string, string>
  let mockClassList: Set<string>

  beforeAll(() => {
    mockClassList = new Set()
    vi.stubGlobal('document', {
      documentElement: {
        classList: {
          add: vi.fn((className: string) => mockClassList.add(className)),
          remove: vi.fn((className: string) => mockClassList.delete(className)),
          contains: vi.fn((className: string) => mockClassList.has(className)),
        },
      },
    })

    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value
      }),
      clear: vi.fn(() => {
        mockStorage = {}
      }),
    })
  })

  beforeEach(() => {
    mockStorage = {}
    mockClassList.clear()
    vi.clearAllMocks()
    // Reset isDarkMode state
    const { toggleDarkMode } = useDarkMode()
    toggleDarkMode(false)
  })

  describe('Initial State', () => {
    it('should initialize with default state', () => {
      const { isDarkMode } = useDarkMode()
      expect(isDarkMode.value).toBe(false)
    })

    it('should load dark mode preference from localStorage on init', () => {
      localStorage.setItem('darkMode', 'true')
      const { isDarkMode, initDarkMode } = useDarkMode()

      initDarkMode()

      expect(isDarkMode.value).toBe(true)
      expect(document.documentElement.classList.contains('dark-mode')).toBe(
        true,
      )
    })

    it('should handle missing localStorage preference', () => {
      const { isDarkMode, initDarkMode } = useDarkMode()

      initDarkMode()

      expect(isDarkMode.value).toBe(false)
      expect(document.documentElement.classList.contains('dark-mode')).toBe(
        false,
      )
    })
  })

  describe('Toggle Functionality', () => {
    it('should toggle dark mode state', () => {
      const { isDarkMode, toggleDarkMode } = useDarkMode()

      toggleDarkMode(true)
      expect(isDarkMode.value).toBe(true)

      toggleDarkMode(false)
      expect(isDarkMode.value).toBe(false)
    })

    it('should persist preference to localStorage when toggled', () => {
      const { toggleDarkMode } = useDarkMode()

      toggleDarkMode(true)
      expect(localStorage.getItem('darkMode')).toBe('true')

      toggleDarkMode(false)
      expect(localStorage.getItem('darkMode')).toBe('false')
    })
  })

  describe('DOM Manipulation', () => {
    it('should add dark-mode class when enabled', () => {
      const { toggleDarkMode } = useDarkMode()

      toggleDarkMode(true)

      expect(document.documentElement.classList.contains('dark-mode')).toBe(
        true,
      )
    })

    it('should remove dark-mode class when disabled', () => {
      const { toggleDarkMode } = useDarkMode()

      // First enable dark mode
      toggleDarkMode(true)
      expect(document.documentElement.classList.contains('dark-mode')).toBe(
        true,
      )

      // Then disable it
      toggleDarkMode(false)
      expect(document.documentElement.classList.contains('dark-mode')).toBe(
        false,
      )
    })
  })
})
