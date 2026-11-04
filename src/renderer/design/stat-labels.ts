export const summaryStatGroups: { title: string; rows: [string, string, number?, number?, string?][] }[] = [
  { title: '공격', rows: [['평균 적중', 'AverageHit', 1], ['공격/시전 속도', 'Speed', 2], ['치명타 확률', 'CritChance', 2, 1, '%'], ['치명타 배율', 'CritMultiplier', 0, 100, '%'], ['적중 DPS', 'TotalDPS', 1], ['점화 포함 DPS', 'WithIgniteDPS', 1]] },
  { title: '자원', rows: [['총 생명력', 'Life'], ['미점유 생명력', 'LifeUnreserved'], ['마나', 'Mana'], ['마나 재생', 'ManaRegenRecovery', 1], ['총 정신력', 'Spirit'], ['미점유 정신력', 'SpiritUnreserved']] },
  { title: '방어', rows: [['유효 생명력', 'TotalEHP'], ['에너지 보호막', 'EnergyShield'], ['방어도', 'Armour'], ['회피', 'Evasion'], ['회피 확률', 'EvadeChance', 0, 1, '%'], ['물리 최대 피격', 'PhysicalMaximumHitTaken'], ['화염 최대 피격', 'FireMaximumHitTaken']] },
  { title: '저항', rows: [['화염', 'FireResist', 0, 1, '%'], ['냉기', 'ColdResist', 0, 1, '%'], ['번개', 'LightningResist', 0, 1, '%'], ['카오스', 'ChaosResist', 0, 1, '%']] },
  { title: '능력치', rows: [['힘', 'Str'], ['민첩', 'Dex'], ['지능', 'Int']] },
];

export const summaryStatLabels=new Map(summaryStatGroups.flatMap(group=>group.rows.map(([label,key,,scale=1,suffix=''])=>[key,{label,scale,suffix}] as const)));
