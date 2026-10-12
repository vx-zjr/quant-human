import type { Dimension, LayerId } from '../../types'
import { L0 } from './l0-matter'
import { L1 } from './l1-molecular'
import { L2 } from './l2-physiology'
import { L3 } from './l3-neural'
import { L4 } from './l4-psych'
import { L5 } from './l5-behavior'
import { L6 } from './l6-social'
import { L7 } from './l7-meaning'

/** 全部量化维度。新增维度：在对应层文件中追加即可，这里自动汇总。 */
export const DIMENSIONS: Dimension[] = [...L0, ...L1, ...L2, ...L3, ...L4, ...L5, ...L6, ...L7]

export const DIMENSION_MAP: Record<string, Dimension> = Object.fromEntries(DIMENSIONS.map((d) => [d.id, d]))

export function dimensionsByLayer(layer: LayerId): Dimension[] {
  return DIMENSIONS.filter((d) => d.layer === layer)
}

/** 层 → 子领域 → 维度，用于旭日图 */
export function dimensionTree(): { layer: LayerId; domains: { domain: string; dims: Dimension[] }[] }[] {
  const layers: LayerId[] = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7']
  return layers.map((layer) => {
    const dims = dimensionsByLayer(layer)
    const domains: string[] = []
    for (const d of dims) if (!domains.includes(d.domain)) domains.push(d.domain)
    return { layer, domains: domains.map((domain) => ({ domain, dims: dims.filter((d) => d.domain === domain) })) }
  })
}

export const MEASURABILITY_LABEL: Record<number, string> = {
  1: '仅能定性',
  2: '间接/理论',
  3: '量表/自评',
  4: '仪器估算',
  5: '精确测量',
}
