import { describe, expect, it } from 'vitest'
import {
  getTemplateAliases,
  getTemplateConnectionRule,
  getTemplateMetadataOverride,
  requiresTemplateCenterSlot,
  resolveTemplatePortRole,
  supportsTemplateConnection,
  usesDirectScreenRotation,
} from '@/features/blueprint/domain/templateRegistry'

describe('templateRegistry', () => {
  it('exposes template aliases and metadata overrides from a single registry', () => {
    expect(getTemplateAliases('power_station_1')).toContain('热能池')
    expect(getTemplateMetadataOverride('log_hongs_bus')).toMatchObject({
      catalogName: '仓库存取线基段',
      footprint: {
        width: 4,
        height: 8,
      },
    })
  })

  it('resolves template connection capabilities and rules', () => {
    expect(supportsTemplateConnection('log_conditioner', 'belt')).toBe(true)
    expect(supportsTemplateConnection('log_conditioner', 'pipe')).toBe(false)
    expect(getTemplateConnectionRule('log_conditioner', 'belt')).toMatchObject({
      priority: 112,
      start: ['east', 'west'],
      end: ['east', 'west'],
    })
  })

  it('keeps role and center-slot rules close to template definitions', () => {
    expect(resolveTemplatePortRole('log_splitter', 'belt', 'west')).toBe('input')
    expect(resolveTemplatePortRole('log_splitter', 'belt', 'east')).toBe('output')
    expect(requiresTemplateCenterSlot('unloader_1', 'belt', 'north')).toBe(true)
    expect(requiresTemplateCenterSlot('unloader_1', 'belt', 'east')).toBe(false)
  })

  it('exposes rendering-specific template flags without leaking them into components', () => {
    expect(usesDirectScreenRotation('power_diffuser_1')).toBe(true)
    expect(usesDirectScreenRotation('power_station_1')).toBe(false)
  })
})
