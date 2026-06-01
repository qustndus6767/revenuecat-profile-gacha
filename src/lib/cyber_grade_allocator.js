const CYBER_TIER_VAULT = [
  {
    tier_key: 'gacha_overlord',
    grade_label: 'MASTER OF GACHA',
    level_stamp: 99,
    roast_line: '돈으로 확률을 지배하는 자',
    flare_class: 'tier_flare_gacha',
    tag_chip: ['Gacha', 'Whale', 'SSR']
  },
  {
    tier_key: 'sale_sniper',
    grade_label: '연쇄할인마',
    level_stamp: 77,
    roast_line: '할인율 75% 이하는 쳐다보지 않는 자',
    flare_class: 'tier_flare_sale',
    tag_chip: ['-75%', 'Deal', 'Vault']
  },
  {
    tier_key: 'wallet_warrior',
    grade_label: '스팀 지갑 전사',
    level_stamp: 88,
    roast_line: '게임은 사서 모으는 굿즈라 믿는 자',
    flare_class: 'tier_flare_wallet',
    tag_chip: ['Collector', 'Backlog', 'Flex']
  }
]

export const cyber_grade_allocator = (nick_string) => {
  const probe = (nick_string || '').trim()
  let hash_pulse = 0
  for (let i = 0; i < probe.length; i += 1) {
    hash_pulse = (hash_pulse << 5) - hash_pulse + probe.charCodeAt(i)
    hash_pulse |= 0
  }
  const tier_slot = Math.abs(hash_pulse) % CYBER_TIER_VAULT.length
  return { ...CYBER_TIER_VAULT[tier_slot], nick_fingerprint: probe }
}
