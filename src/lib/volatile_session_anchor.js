const LOCAL_STATE_VAULT = 'volatile_session_anchor'

const SESSION_PURGE_TARGETS = [
  LOCAL_STATE_VAULT,
  'steam_customizer_master',
  'steam_customizer_user_id',
  'steam_customizer_inventory',
  'steam_customizer_equipped_title',
  'steam_customizer_equipped_border',
  'steam_customizer_equipped_avatar'
]

export const pull_cached_soul_payload = () => {
  try {
    const raw_vault = localStorage.getItem(LOCAL_STATE_VAULT)
    if (!raw_vault) return null
    const parsed = JSON.parse(raw_vault)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

export const push_cached_soul_payload = (anchor_blob) => {
  try {
    localStorage.setItem(LOCAL_STATE_VAULT, JSON.stringify(anchor_blob))
  } catch (e) {
    console.error(e)
  }
}

export const sync_master_flag_to_vault = (isMaster) => {
  if (isMaster) localStorage.setItem('steam_customizer_master', '1')
  else localStorage.removeItem('steam_customizer_master')
}

export const read_master_flag_from_vault = () => localStorage.getItem('steam_customizer_master') === '1'

export const flash_purge_executor = () => {
  SESSION_PURGE_TARGETS.forEach((vault_key) => localStorage.removeItem(vault_key))
}

export const build_anchor_blob = ({
  soul_nick_probe,
  isScanComplete,
  isMaster,
  loot_box_raffle_stamp,
  steam_persona_label,
  user_soul_matrix,
  dynamic_tier_payload,
  volatile_price_snipes
}) => ({
  soul_nick_probe: soul_nick_probe ?? '',
  isScanComplete: !!isScanComplete,
  isMaster: !!isMaster,
  loot_box_raffle_stamp: loot_box_raffle_stamp ?? null,
  steam_persona_label: steam_persona_label ?? '',
  user_soul_matrix: user_soul_matrix ?? null,
  dynamic_tier_payload: dynamic_tier_payload ?? null,
  volatile_price_snipes: volatile_price_snipes ?? []
})
