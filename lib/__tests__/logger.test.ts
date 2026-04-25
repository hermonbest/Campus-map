import { info, error, success, warn } from '../logger'

describe('Logger', () => {
  const originalConsole = global.console

  beforeEach(() => {
    global.console = {
      ...originalConsole,
      log: jest.fn(),
      error: jest.fn(),
    }
  })

  afterEach(() => {
    global.console = originalConsole
  })

  describe('info', () => {
    it('should log info message with timestamp', () => {
      info('TEST', 'Test message')

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining('[TEST]'),
        'Test message'
      )
    })
  })

  describe('error', () => {
    it('should log error message with timestamp', () => {
      error('TEST', 'Test error')

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining('[TEST]'),
        'Test error'
      )
    })

    it('should log error with stack trace', () => {
      const testError = new Error('Test error')
      error('TEST', testError)

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining('[TEST]'),
        testError
      )
    })
  })

  describe('success', () => {
    it('should log success message with checkmark', () => {
      success('TEST', 'Test success')

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[SUCCESS]'),
        expect.stringContaining('[TEST]'),
        expect.stringContaining('✓'),
        'Test success'
      )
    })
  })

  describe('warn', () => {
    it('should log warning message with warning symbol', () => {
      warn('TEST', 'Test warning')

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
        expect.stringContaining('[TEST]'),
        expect.stringContaining('⚠'),
        'Test warning'
      )
    })
  })
})
