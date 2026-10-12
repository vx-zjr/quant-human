import { useMemo } from 'react'
import { bodySnapshot } from '../engine/body'
import { livedQuantities } from '../engine/lived'
import { profileSurvival } from '../engine/mortality'
import { layerScores, traitZ } from '../engine/scoring'
import type { Profile } from '../types'

/** 一个画像的全部派生计算（纯函数组合，按画像缓存） */
export function useAnalysis(p: Profile) {
  return useMemo(() => {
    const body = bodySnapshot(p)
    const cZ = traitZ('C', p.bigFive.C)
    const survival = profileSurvival(p, cZ)
    const lived = livedQuantities(p)
    const layers = layerScores(p, { bmi: body.bmi, hr: survival.hr })
    return { body, cZ, survival, lived, layers }
  }, [p])
}
