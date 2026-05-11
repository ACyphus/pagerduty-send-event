/**
 * Unit tests for the action's entrypoint, src/index.js
 */

import { describe, it, expect, vi } from 'vitest'

// Mock the action's entrypoint — vi.mock is hoisted so this intercepts the
// dynamic import below (src/index.js imports './main.js' internally)
vi.mock('../src/main.js', () => ({
  run: vi.fn()
}))

const { run } = await import('../src/main.js')

describe('index', () => {
  it('calls run when imported', async () => {
    await import('../src/index.js')

    expect(run).toHaveBeenCalled()
  })
})
