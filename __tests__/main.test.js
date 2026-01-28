/**
 * Unit tests for src/main.js
 */

const core = require('@actions/core')
const github = require('@actions/github')
const superagent = require('superagent')
const { run } = require('../src/main')

// Mock superagent
jest.mock('superagent')

// Mock @actions/core
jest.mock('@actions/core')

// Mock @actions/github
jest.mock('@actions/github', () => ({
  context: {
    repo: {
      repo: 'test-repo',
      owner: 'test-owner'
    },
    sha: 'abc123',
    ref: 'refs/heads/main',
    eventName: 'push',
    actor: 'test-user'
  }
}))

describe('run', () => {
  let mockSet
  let mockSend
  let mockPost
  let consoleErrorSpy

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()

    // Suppress console.error during tests to avoid cluttering output
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    // Setup superagent mock chain with proper chaining
    const mockResponse = {
      body: { status: 'success', message: 'Event processed' }
    }
    
    mockSet = jest.fn()
    mockSend = jest.fn()
    mockPost = jest.fn()
    
    // Create a chainable mock: post().send().set().set()
    const chainableMock = {
      set: mockSet
    }
    
    // First .set() returns the chainable mock
    // Second .set() resolves with the response
    mockSet
      .mockReturnValueOnce(chainableMock)
      .mockResolvedValueOnce(mockResponse)
    
    mockSend.mockReturnValue(chainableMock)
    mockPost.mockReturnValue({ send: mockSend })
    
    superagent.post = mockPost

    // Setup core mock defaults
    core.getInput = jest.fn()
    core.setOutput = jest.fn()
    core.setFailed = jest.fn()
    core.info = jest.fn()
    core.error = jest.fn()
  })

  afterEach(() => {
    // Restore console.error after each test
    consoleErrorSpy.mockRestore()
  })

  describe('successful event sending', () => {
    test('should send a trigger event successfully', async () => {
      // Arrange
      core.getInput.mockImplementation(name => {
        const inputs = {
          'integration-key': 'test-routing-key',
          'dedup-key': 'test-dedup-key',
          'event-action': 'trigger',
          summary: 'Test alert summary',
          source: 'GitHub Actions',
          severity: 'critical',
          client: 'GitHub',
          'client-url': 'https://github.com'
        }
        return inputs[name] || ''
      })

      // Act
      await run()

      // Assert
      expect(superagent.post).toHaveBeenCalledWith(
        'https://events.pagerduty.com/v2/enqueue'
      )
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          event_action: 'trigger',
          dedup_key: 'test-dedup-key',
          payload: expect.objectContaining({
            summary: 'Test alert summary',
            source: 'GitHub Actions',
            severity: 'critical',
            custom_details: expect.objectContaining({
              github: expect.objectContaining({
                repository: 'test-repo',
                repo_owner: 'test-owner',
                sha: 'abc123',
                ref: 'refs/heads/main',
                event: 'push',
                actor: 'test-user'
              })
            })
          }),
          client: 'GitHub',
          client_url: 'https://github.com'
        })
      )
      expect(mockSet).toHaveBeenCalledWith('Content-Type', 'application/json')
      expect(mockSet).toHaveBeenCalledWith('x-routing-key', 'test-routing-key')
      expect(core.setFailed).not.toHaveBeenCalled()
      expect(core.setOutput).toHaveBeenCalledWith(
        'time',
        expect.any(String)
      )
    })

    test('should send an acknowledge event successfully', async () => {
      // Arrange
      core.getInput.mockImplementation(name => {
        const inputs = {
          'integration-key': 'test-routing-key',
          'dedup-key': 'test-dedup-key',
          'event-action': 'acknowledge',
          summary: 'Acknowledging alert',
          source: 'GitHub Actions',
          severity: 'warning'
        }
        return inputs[name] || ''
      })

      // Act
      await run()

      // Assert
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          event_action: 'acknowledge'
        })
      )
      expect(core.setFailed).not.toHaveBeenCalled()
    })

    test('should send a resolve event successfully', async () => {
      // Arrange
      core.getInput.mockImplementation(name => {
        const inputs = {
          'integration-key': 'test-routing-key',
          'dedup-key': 'test-dedup-key',
          'event-action': 'resolve',
          summary: 'Resolving alert',
          source: 'GitHub Actions',
          severity: 'info'
        }
        return inputs[name] || ''
      })

      // Act
      await run()

      // Assert
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          event_action: 'resolve'
        })
      )
      expect(core.setFailed).not.toHaveBeenCalled()
    })
  })

  describe('payload structure verification', () => {
    test('should include all GitHub context fields in custom_details', async () => {
      // Arrange
      core.getInput.mockImplementation(name => {
        const inputs = {
          'integration-key': 'test-key',
          'event-action': 'trigger',
          summary: 'Test',
          source: 'Test',
          severity: 'critical'
        }
        return inputs[name] || ''
      })

      // Act
      await run()

      // Assert
      const sentPayload = mockSend.mock.calls[0][0]
      expect(sentPayload.payload.custom_details.github).toEqual({
        repository: 'test-repo',
        repo_owner: 'test-owner',
        sha: 'abc123',
        ref: 'refs/heads/main',
        event: 'push',
        actor: 'test-user'
      })
    })

    test('should construct correct payload with all optional fields', async () => {
      // Arrange
      core.getInput.mockImplementation(name => {
        const inputs = {
          'integration-key': 'test-key',
          'dedup-key': 'custom-dedup',
          'event-action': 'trigger',
          summary: 'Custom summary',
          source: 'Custom source',
          severity: 'error',
          client: 'Custom client',
          'client-url': 'https://custom.url'
        }
        return inputs[name] || ''
      })

      // Act
      await run()

      // Assert
      const sentPayload = mockSend.mock.calls[0][0]
      expect(sentPayload).toMatchObject({
        event_action: 'trigger',
        dedup_key: 'custom-dedup',
        payload: {
          summary: 'Custom summary',
          source: 'Custom source',
          severity: 'error',
          custom_details: {
            github: expect.any(Object)
          }
        },
        client: 'Custom client',
        client_url: 'https://custom.url'
      })
    })

    test('should handle missing optional fields', async () => {
      // Arrange
      core.getInput.mockImplementation(name => {
        const inputs = {
          'integration-key': 'test-key',
          'event-action': 'trigger',
          summary: 'Test',
          source: 'Test',
          severity: 'critical'
          // No dedup-key, client, or client-url
        }
        return inputs[name] || ''
      })

      // Act
      await run()

      // Assert
      const sentPayload = mockSend.mock.calls[0][0]
      expect(sentPayload.dedup_key).toBe('')
      expect(sentPayload.client).toBe('')
      expect(sentPayload.client_url).toBe('')
    })
  })

  describe('HTTP request verification', () => {
    test('should use correct URL', async () => {
      // Arrange
      core.getInput.mockImplementation(name => {
        const inputs = {
          'integration-key': 'test-key',
          'event-action': 'trigger',
          summary: 'Test',
          source: 'Test',
          severity: 'critical'
        }
        return inputs[name] || ''
      })

      // Act
      await run()

      // Assert
      expect(superagent.post).toHaveBeenCalledWith(
        'https://events.pagerduty.com/v2/enqueue'
      )
    })

    test('should set correct headers', async () => {
      // Arrange
      core.getInput.mockImplementation(name => {
        const inputs = {
          'integration-key': 'my-routing-key',
          'event-action': 'trigger',
          summary: 'Test',
          source: 'Test',
          severity: 'critical'
        }
        return inputs[name] || ''
      })

      // Act
      await run()

      // Assert
      expect(mockSet).toHaveBeenCalledWith('Content-Type', 'application/json')
      expect(mockSet).toHaveBeenCalledWith('x-routing-key', 'my-routing-key')
      expect(mockSet).toHaveBeenCalledTimes(2)
    })

    test('should send payload via POST method', async () => {
      // Arrange
      core.getInput.mockImplementation(name => {
        const inputs = {
          'integration-key': 'test-key',
          'event-action': 'trigger',
          summary: 'Test',
          source: 'Test',
          severity: 'critical'
        }
        return inputs[name] || ''
      })

      // Act
      await run()

      // Assert
      expect(superagent.post).toHaveBeenCalled()
      expect(mockSend).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    test('should handle API errors gracefully', async () => {
      // Arrange
      const apiError = new Error('API Error: Invalid routing key')
      
      // Reset the mock to reject on the second call
      mockSet.mockReset()
      const chainableMock = { set: mockSet }
      mockSet
        .mockReturnValueOnce(chainableMock)
        .mockRejectedValueOnce(apiError)

      core.getInput.mockImplementation(name => {
        const inputs = {
          'integration-key': 'invalid-key',
          'event-action': 'trigger',
          summary: 'Test',
          source: 'Test',
          severity: 'critical'
        }
        return inputs[name] || ''
      })

      // Act
      await run()

      // Assert
      expect(core.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send PagerDuty event')
      )
      expect(core.setFailed).toHaveBeenCalledWith(
        'API Error: Invalid routing key'
      )
    })

    test('should handle network errors gracefully', async () => {
      // Arrange
      const networkError = new Error('Network error: ECONNREFUSED')
      
      // Reset the mock to reject on the second call
      mockSet.mockReset()
      const chainableMock = { set: mockSet }
      mockSet
        .mockReturnValueOnce(chainableMock)
        .mockRejectedValueOnce(networkError)

      core.getInput.mockImplementation(name => {
        const inputs = {
          'integration-key': 'test-key',
          'event-action': 'trigger',
          summary: 'Test',
          source: 'Test',
          severity: 'critical'
        }
        return inputs[name] || ''
      })

      // Act
      await run()

      // Assert
      expect(core.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send PagerDuty event')
      )
      expect(core.setFailed).toHaveBeenCalledWith(
        'Network error: ECONNREFUSED'
      )
    })

    test('should handle superagent HTTP errors', async () => {
      // Arrange
      const httpError = new Error('Bad Request')
      httpError.status = 400
      httpError.response = { body: { errors: ['Invalid payload'] } }
      
      // Reset the mock to reject on the second call
      mockSet.mockReset()
      const chainableMock = { set: mockSet }
      mockSet
        .mockReturnValueOnce(chainableMock)
        .mockRejectedValueOnce(httpError)

      core.getInput.mockImplementation(name => {
        const inputs = {
          'integration-key': 'test-key',
          'event-action': 'trigger',
          summary: 'Test',
          source: 'Test',
          severity: 'critical'
        }
        return inputs[name] || ''
      })

      // Act
      await run()

      // Assert
      expect(core.error).toHaveBeenCalled()
      expect(core.setFailed).toHaveBeenCalledWith('Bad Request')
    })

    test('should throw error when integration-key is missing', async () => {
      // Arrange
      core.getInput.mockImplementation((name, options) => {
        if (name === 'integration-key' && options?.required) {
          throw new Error('Input required and not supplied: integration-key')
        }
        return ''
      })

      // Act
      await run()

      // Assert
      expect(core.setFailed).toHaveBeenCalledWith(
        'Input required and not supplied: integration-key'
      )
    })
  })

  describe('input handling', () => {
    test('should handle minimal required inputs', async () => {
      // Arrange
      core.getInput.mockImplementation(name => {
        const inputs = {
          'integration-key': 'test-key'
        }
        return inputs[name] || ''
      })

      // Act
      await run()

      // Assert
      expect(superagent.post).toHaveBeenCalled()
      expect(core.setFailed).not.toHaveBeenCalled()
    })

    test('should handle all inputs provided', async () => {
      // Arrange
      core.getInput.mockImplementation(name => {
        const inputs = {
          'integration-key': 'test-key',
          'dedup-key': 'dedup-123',
          'event-action': 'trigger',
          summary: 'Full test',
          source: 'Test source',
          severity: 'critical',
          client: 'Test client',
          'client-url': 'https://test.com'
        }
        return inputs[name] || ''
      })

      // Act
      await run()

      // Assert
      expect(superagent.post).toHaveBeenCalled()
      const sentPayload = mockSend.mock.calls[0][0]
      expect(sentPayload.dedup_key).toBe('dedup-123')
      expect(sentPayload.event_action).toBe('trigger')
      expect(sentPayload.payload.summary).toBe('Full test')
      expect(core.setFailed).not.toHaveBeenCalled()
    })

    test('should handle empty string inputs', async () => {
      // Arrange
      core.getInput.mockImplementation(name => {
        const inputs = {
          'integration-key': 'test-key',
          'dedup-key': '',
          'event-action': '',
          summary: '',
          source: '',
          severity: ''
        }
        return inputs[name] || ''
      })

      // Act
      await run()

      // Assert
      expect(superagent.post).toHaveBeenCalled()
      const sentPayload = mockSend.mock.calls[0][0]
      expect(sentPayload.event_action).toBe('')
      expect(sentPayload.payload.summary).toBe('')
      expect(core.setFailed).not.toHaveBeenCalled()
    })
  })

  describe('GitHub context integration', () => {
    test('should include repository information', async () => {
      // Arrange
      core.getInput.mockImplementation(name => {
        const inputs = {
          'integration-key': 'test-key',
          'event-action': 'trigger',
          summary: 'Test',
          source: 'Test',
          severity: 'critical'
        }
        return inputs[name] || ''
      })

      // Act
      await run()

      // Assert
      const sentPayload = mockSend.mock.calls[0][0]
      expect(sentPayload.payload.custom_details.github.repository).toBe(
        'test-repo'
      )
      expect(sentPayload.payload.custom_details.github.repo_owner).toBe(
        'test-owner'
      )
    })

    test('should include commit SHA', async () => {
      // Arrange
      core.getInput.mockImplementation(name => {
        const inputs = {
          'integration-key': 'test-key',
          'event-action': 'trigger',
          summary: 'Test',
          source: 'Test',
          severity: 'critical'
        }
        return inputs[name] || ''
      })

      // Act
      await run()

      // Assert
      const sentPayload = mockSend.mock.calls[0][0]
      expect(sentPayload.payload.custom_details.github.sha).toBe('abc123')
    })

    test('should include git reference', async () => {
      // Arrange
      core.getInput.mockImplementation(name => {
        const inputs = {
          'integration-key': 'test-key',
          'event-action': 'trigger',
          summary: 'Test',
          source: 'Test',
          severity: 'critical'
        }
        return inputs[name] || ''
      })

      // Act
      await run()

      // Assert
      const sentPayload = mockSend.mock.calls[0][0]
      expect(sentPayload.payload.custom_details.github.ref).toBe(
        'refs/heads/main'
      )
    })

    test('should include event name and actor', async () => {
      // Arrange
      core.getInput.mockImplementation(name => {
        const inputs = {
          'integration-key': 'test-key',
          'event-action': 'trigger',
          summary: 'Test',
          source: 'Test',
          severity: 'critical'
        }
        return inputs[name] || ''
      })

      // Act
      await run()

      // Assert
      const sentPayload = mockSend.mock.calls[0][0]
      expect(sentPayload.payload.custom_details.github.event).toBe('push')
      expect(sentPayload.payload.custom_details.github.actor).toBe('test-user')
    })
  })

  describe('output handling', () => {
    test('should set time output on success', async () => {
      // Arrange
      core.getInput.mockImplementation(name => {
        const inputs = {
          'integration-key': 'test-key',
          'event-action': 'trigger',
          summary: 'Test',
          source: 'Test',
          severity: 'critical'
        }
        return inputs[name] || ''
      })

      // Act
      await run()

      // Assert
      expect(core.setOutput).toHaveBeenCalledWith('time', expect.any(String))
      const timeOutput = core.setOutput.mock.calls[0][1]
      expect(timeOutput).toMatch(/\d{2}:\d{2}:\d{2}/)
    })

    test('should not set output on failure', async () => {
      // Arrange
      const error = new Error('Test error')
      
      // Reset the mock to reject on the second call
      mockSet.mockReset()
      const chainableMock = { set: mockSet }
      mockSet
        .mockReturnValueOnce(chainableMock)
        .mockRejectedValueOnce(error)

      core.getInput.mockImplementation(name => {
        const inputs = {
          'integration-key': 'test-key',
          'event-action': 'trigger',
          summary: 'Test',
          source: 'Test',
          severity: 'critical'
        }
        return inputs[name] || ''
      })

      // Act
      await run()

      // Assert
      expect(core.setOutput).not.toHaveBeenCalled()
      expect(core.setFailed).toHaveBeenCalledWith('Test error')
    })
  })

  describe('logging', () => {
    test('should log success information', async () => {
      // Arrange
      core.getInput.mockImplementation(name => {
        const inputs = {
          'integration-key': 'test-key',
          'event-action': 'trigger',
          summary: 'Test',
          source: 'Test',
          severity: 'critical'
        }
        return inputs[name] || ''
      })

      // Act
      await run()

      // Assert
      expect(core.info).toHaveBeenCalledWith(
        'PagerDuty event sent successfully'
      )
      expect(core.info).toHaveBeenCalledWith(expect.stringContaining('status'))
    })

    test('should log error information on failure', async () => {
      // Arrange
      const error = new Error('Connection timeout')
      
      // Reset the mock to reject on the second call
      mockSet.mockReset()
      const chainableMock = { set: mockSet }
      mockSet
        .mockReturnValueOnce(chainableMock)
        .mockRejectedValueOnce(error)

      core.getInput.mockImplementation(name => {
        const inputs = {
          'integration-key': 'test-key',
          'event-action': 'trigger',
          summary: 'Test',
          source: 'Test',
          severity: 'critical'
        }
        return inputs[name] || ''
      })

      // Act
      await run()

      // Assert
      expect(core.error).toHaveBeenCalledWith(
        'Failed to send PagerDuty event: Connection timeout'
      )
    })
  })
})
