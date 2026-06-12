import { describe, expect, it } from 'vitest'
import { buildBlueprintSummary } from '@/features/blueprint/domain/parser/blueprintSummaryBuilder'

function makeRawBlueprint() {
  return JSON.stringify({
    share_code: 'case-001',
    blueprint_data: {
      name: 'Rule Test Blueprint',
      desc: 'summary coverage',
      bp_size: { x_len: 6, z_len: 6 },
      review_status_name: 'Reviewed',
      bp_param: { source_type_name: 'Local' },
      nodes: [
        {
          node_id: 3,
          template_id: 'grid_belt_01',
          transform: {
            points: [
              { x: 1, y: 0, z: 1 },
              { x: 2, y: 0, z: 1 },
              { x: 2, y: 0, z: 2 },
            ],
            direction_in: { y: 180 },
            direction_out: { y: 90 },
          },
          components: [],
        },
        {
          node_id: 1,
          template_id: 'power_station_1',
          transform: {
            position: { x: 2, y: 0, z: 3 },
            direction: { y: 90 },
            has_interactive_param: true,
            interactive_param: {
              position: { x: 2, y: 0, z: 3 },
              rotation: { x: 0, y: 90, z: 0 },
              properties: {},
            },
          },
          components: [],
        },
        {
          node_id: 2,
          template_id: 'furnance_1',
          product_icon: 'item_carbon_enr',
          transform: {
            position: { x: 4, y: 0, z: 4 },
          },
          components: [{ payload_type: 'formula_man' }],
        },
      ],
    },
  })
}

describe('blueprintSummaryBuilder', () => {
  it('builds summary data with normalized layouts and counts', () => {
    const summary = buildBlueprintSummary(makeRawBlueprint(), 'rule-test.json')

    expect(summary.sourceName).toBe('rule-test.json')
    expect(summary.title).toBe('Rule Test Blueprint')
    expect(summary.shareCode).toBe('case-001')
    expect(summary.nodeCount).toBe(3)
    expect(summary.componentCount).toBe(1)
    expect(summary.interactiveCount).toBe(1)
    expect(summary.templateCounts).toEqual(
      expect.arrayContaining([
        { name: 'power_station_1', count: 1 },
        { name: 'furnance_1', count: 1 },
        { name: 'grid_belt_01', count: 1 },
      ]),
    )
    expect(summary.payloadCounts).toEqual([{ name: 'formula_man', count: 1 }])
    expect(summary.productCounts).toEqual([{ name: 'item_carbon_enr', count: 1 }])
  })

  it('normalizes building layouts and keeps path nodes distinct', () => {
    const summary = buildBlueprintSummary(makeRawBlueprint(), 'rule-test.json')
    const powerStation = summary.nodes.find((node) => node.templateId === 'power_station_1')
    const furnace = summary.nodes.find((node) => node.templateId === 'furnance_1')
    const belt = summary.nodes.find((node) => node.templateId === 'grid_belt_01')

    expect(powerStation).toMatchObject({
      layoutX: 2,
      layoutZ: 2,
      layoutWidth: 2,
      layoutHeight: 2,
    })
    expect(powerStation?.occupiedCells).toHaveLength(4)
    expect(decodeURI(summary.templatePreviewUrls.power_station_1)).toContain('热能池')

    expect(furnace).toMatchObject({
      layoutWidth: 3,
      layoutHeight: 3,
    })

    expect(belt?.path?.kind).toBe('belt')
    expect(belt?.occupiedCells).toEqual([])
    expect(belt?.pathPoints).toEqual([
      { x: 2, y: 0, z: 2 },
      { x: 2, y: 0, z: 1 },
      { x: 1, y: 0, z: 1 },
    ])
  })
})
