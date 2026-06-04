import { describe, expect, it } from 'vitest'
import { INVALID_SHARE_CODE_ERROR, normalizeShareCode } from '@/features/blueprint/services/cache/shareCode'

describe('normalizeShareCode', () => {
  it('trims whitespace without changing case', () => {
    expect(normalizeShareCode('  EF013Eo554IUoa950i79 \n')).toBe('EF013Eo554IUoa950i79')
  })

  it('extracts share codes from query params', () => {
    expect(normalizeShareCode('https://example.com/blueprint?share_code=EF01U9e3105u9Oei7Oa8')).toBe(
      'EF01U9e3105u9Oei7Oa8',
    )
  })

  it('extracts share codes from URL paths', () => {
    expect(normalizeShareCode('https://example.com/share/EF01ao6548U2UAEoe5e')).toBe('EF01ao6548U2UAEoe5e')
  })

  it('extracts the longest candidate from wrapped text', () => {
    expect(normalizeShareCode('蓝图分享码：EF013Eo554IUoa950i79，请查询')).toBe('EF013Eo554IUoa950i79')
  })

  it('rejects invalid input', () => {
    expect(() => normalizeShareCode('!!')).toThrow(INVALID_SHARE_CODE_ERROR)
  })
})
