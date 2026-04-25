import { cacheData, getCachedItem, clearCache, getAppVersion, setAppVersion } from '../cache'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  multiSet: jest.fn(),
  multiGet: jest.fn(),
}))

describe('Cache Library', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('cacheData', () => {
    it('should cache data with key', async () => {
      const data = { buildings: [{ id: 1, name: 'Test' }] }
      await cacheData('buildings', data)

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'cached_buildings',
        JSON.stringify(data)
      )
    })
  })

  describe('getCachedItem', () => {
    it('should return cached data', async () => {
      const data = { buildings: [{ id: 1, name: 'Test' }] }
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(data))

      const result = await getCachedItem('buildings')

      expect(result).toEqual(data)
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('cached_buildings')
    })

    it('should return null when no cached data', async () => {
      AsyncStorage.getItem.mockResolvedValue(null)

      const result = await getCachedItem('buildings')

      expect(result).toBeNull()
    })
  })

  describe('clearCache', () => {
    it('should clear all cached data', async () => {
      await clearCache()

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('cached_buildings')
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('cached_offices')
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('cached_nodes')
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('cached_edges')
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('cached_map_url')
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('cached_app_version')
    })
  })

  describe('getAppVersion', () => {
    it('should return cached version', async () => {
      AsyncStorage.getItem.mockResolvedValue('5')

      const version = await getAppVersion()

      expect(version).toBe(5)
    })

    it('should return null when no version cached', async () => {
      AsyncStorage.getItem.mockResolvedValue(null)

      const version = await getAppVersion()

      expect(version).toBeNull()
    })
  })

  describe('setAppVersion', () => {
    it('should cache version', async () => {
      await setAppVersion(5)

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('cached_app_version', '5')
    })
  })
})
