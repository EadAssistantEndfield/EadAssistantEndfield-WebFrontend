import type { BlueprintPathKind, BlueprintRotation } from '@/types'
import {
  getTemplateConnectionRule as getTemplateConnectionRuleFromRegistry,
  requiresTemplateCenterSlot as requiresTemplateCenterSlotFromRegistry,
  resolveTemplatePortRole as resolveTemplatePortRoleFromRegistry,
  supportsTemplateConnection as supportsTemplateConnectionFromRegistry,
  type EdgeSide,
  type TemplateConnectionRule,
  type TemplateConnectionTag,
  type TemplatePortRole,
} from '@/utils/templateRegistry'

export type { EdgeSide, TemplateConnectionRule, TemplateConnectionTag, TemplatePortRole }

export function supportsTemplateConnection(templateId: string, kind: BlueprintPathKind): boolean {
  return supportsTemplateConnectionFromRegistry(templateId, kind)
}

export function getTemplateConnectionRule(
  templateId: string,
  kind: BlueprintPathKind,
): TemplateConnectionRule | undefined {
  return getTemplateConnectionRuleFromRegistry(templateId, kind)
}

export function toLocalEdgeSide(side: EdgeSide, rotation: BlueprintRotation): EdgeSide {
  const sides: EdgeSide[] = ['north', 'east', 'south', 'west']
  const worldIndex = sides.indexOf(side)
  const steps = rotation / 90
  return sides[(worldIndex - steps + 4) % 4]
}

export function getPreferredLocalSides(templateId: string, kind: BlueprintPathKind): EdgeSide[] {
  const rule = getTemplateConnectionRule(templateId, kind)
  return [...new Set([...(rule?.start ?? []), ...(rule?.end ?? [])])]
}

export function resolveTemplatePortRole(
  templateId: string,
  kind: BlueprintPathKind,
  localSide: EdgeSide,
): TemplatePortRole {
  return resolveTemplatePortRoleFromRegistry(templateId, kind, localSide)
}

export function requiresTemplateCenterSlot(templateId: string, kind: BlueprintPathKind, localSide: EdgeSide): boolean {
  return requiresTemplateCenterSlotFromRegistry(templateId, kind, localSide)
}
