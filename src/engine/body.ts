import type { Profile, Sex } from '../types'
import { clamp } from './stats'

/**
 * L0–L2：身体的物理与生理量化。
 * 所有公式均为经典经验公式，适用于成年人；对儿童、孕妇、运动员等人群误差较大。
 */

export const AVOGADRO = 6.02214076e23
export const C_LIGHT = 299_792_458
export const REF_MASS = 70

/** 参考人（70 kg）的元素质量分数，ICRP Publication 23 */
export const ELEMENTS: { sym: string; name: string; frac: number; amu: number }[] = [
  { sym: 'O', name: '氧', frac: 0.61, amu: 15.999 },
  { sym: 'C', name: '碳', frac: 0.23, amu: 12.011 },
  { sym: 'H', name: '氢', frac: 0.1, amu: 1.008 },
  { sym: 'N', name: '氮', frac: 0.026, amu: 14.007 },
  { sym: 'Ca', name: '钙', frac: 0.014, amu: 40.078 },
  { sym: 'P', name: '磷', frac: 0.011, amu: 30.974 },
  { sym: 'K', name: '钾', frac: 0.002, amu: 39.098 },
  { sym: 'S', name: '硫', frac: 0.002, amu: 32.06 },
  { sym: 'Na', name: '钠', frac: 0.0014, amu: 22.99 },
  { sym: 'Cl', name: '氯', frac: 0.0012, amu: 35.45 },
  { sym: 'Mg', name: '镁', frac: 0.00027, amu: 24.305 },
  { sym: 'Fe', name: '铁', frac: 0.00006, amu: 55.845 },
]

export function ageOf(p: Pick<Profile, 'birthYear'>, now = new Date()): number {
  // 只有出生年份时，按年中出生估算
  return Math.max(0, now.getFullYear() + now.getMonth() / 12 - (p.birthYear + 0.5))
}

export const bmi = (heightCm: number, weightKg: number) => weightKg / (heightCm / 100) ** 2

/** 中国成人 BMI 分级（WS/T 428） */
export function bmiCategory(b: number): { label: string; level: 'good' | 'warning' | 'serious' | 'critical' } {
  if (b < 18.5) return { label: '偏瘦', level: 'warning' }
  if (b < 24) return { label: '正常', level: 'good' }
  if (b < 28) return { label: '超重', level: 'warning' }
  return { label: '肥胖', level: 'serious' }
}

/** Mifflin–St Jeor 静息代谢（kcal/天） */
export function bmrMifflin(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'male' ? 5 : -161)
}

/** 由每周运动分钟数粗略估计活动系数 */
export function activityFactor(exerciseMinPerWeek: number): number {
  return clamp(1.2 + exerciseMinPerWeek / 1000, 1.2, 1.9)
}

/** Deurenberg 体脂率（%），由 BMI、年龄、性别估算 */
export function bodyFatDeurenberg(b: number, age: number, sex: Sex): number {
  return clamp(1.2 * b + 0.23 * age - 10.8 * (sex === 'male' ? 1 : 0) - 5.4, 3, 60)
}

/** Watson 总体水（升） */
export function totalBodyWater(sex: Sex, age: number, heightCm: number, weightKg: number): number {
  return sex === 'male'
    ? 2.447 - 0.09516 * age + 0.1074 * heightCm + 0.3362 * weightKg
    : -2.097 + 0.1069 * heightCm + 0.2466 * weightKg
}

/** Nadler 血容量（升） */
export function bloodVolume(sex: Sex, heightCm: number, weightKg: number): number {
  const h = heightCm / 100
  return sex === 'male' ? 0.3669 * h ** 3 + 0.03219 * weightKg + 0.6041 : 0.3561 * h ** 3 + 0.03308 * weightKg + 0.1833
}

export interface ElementShare {
  sym: string
  name: string
  kg: number
  atoms: number
  atomShare: number
}

export function elementBreakdown(weightKg: number): ElementShare[] {
  const rows = ELEMENTS.map((e) => {
    const kg = weightKg * e.frac
    const atoms = ((kg * 1000) / e.amu) * AVOGADRO
    return { sym: e.sym, name: e.name, kg, atoms, atomShare: 0 }
  })
  const total = rows.reduce((s, r) => s + r.atoms, 0)
  rows.forEach((r) => (r.atomShare = r.atoms / total))
  return rows
}

export const atomCount = (weightKg: number) => elementBreakdown(weightKg).reduce((s, r) => s + r.atoms, 0)

/** 人体细胞与共生菌数量，按参考人 70 kg 线性缩放（Sender et al. 2016） */
export const humanCells = (weightKg: number) => 3.0e13 * (weightKg / REF_MASS)
export const bacteria = (weightKg: number) => 3.8e13 * (weightKg / REF_MASS)
/** 每日细胞更新数（Sender & Milo 2021） */
export const cellsReplacedPerDay = (weightKg: number) => 3.3e11 * (weightKg / REF_MASS)

export const kcalToWatt = (kcalPerDay: number) => (kcalPerDay * 4184) / 86400
export const massEnergy = (weightKg: number) => weightKg * C_LIGHT ** 2
/** 广岛原子弹当量约 6.3×10¹³ J */
export const HIROSHIMA_J = 6.3e13

export interface BodySnapshot {
  age: number
  bmi: number
  bmiCat: ReturnType<typeof bmiCategory>
  bmr: number
  tdee: number
  restingWatts: number
  bodyFat: number
  fatKg: number
  leanKg: number
  waterL: number
  waterPct: number
  bloodL: number
  atoms: number
  cells: number
  bacteria: number
  cellsPerDay: number
  massEnergyJ: number
  hiroshimas: number
  elements: ElementShare[]
}

export function bodySnapshot(p: Profile, now = new Date()): BodySnapshot {
  const age = ageOf(p, now)
  const b = bmi(p.heightCm, p.weightKg)
  const bmr = bmrMifflin(p.sex, p.weightKg, p.heightCm, age)
  const fat = bodyFatDeurenberg(b, age, p.sex)
  const water = totalBodyWater(p.sex, age, p.heightCm, p.weightKg)
  const E = massEnergy(p.weightKg)
  return {
    age,
    bmi: b,
    bmiCat: bmiCategory(b),
    bmr,
    tdee: bmr * activityFactor(p.exerciseMin),
    restingWatts: kcalToWatt(bmr),
    bodyFat: fat,
    fatKg: (p.weightKg * fat) / 100,
    leanKg: p.weightKg * (1 - fat / 100),
    waterL: water,
    waterPct: (water / p.weightKg) * 100,
    bloodL: bloodVolume(p.sex, p.heightCm, p.weightKg),
    atoms: atomCount(p.weightKg),
    cells: humanCells(p.weightKg),
    bacteria: bacteria(p.weightKg),
    cellsPerDay: cellsReplacedPerDay(p.weightKg),
    massEnergyJ: E,
    hiroshimas: E / HIROSHIMA_J,
    elements: elementBreakdown(p.weightKg),
  }
}
