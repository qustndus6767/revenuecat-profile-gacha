const CORS_GHOST_TUNNEL = 'https://cors-anywhere.herokuapp.com/'
const STEAM_AVG_TICKET_KRW = 15000

export const DEFAULT_SOUL_MATRIX = {
  archetype: '턴제에 영혼을 판 전략가',
  genre_bias: ['SRPG', '4X', 'Roguelike'],
  soul_sync_pct: 99,
  vault_worth_krw: 2154000
}

export const indie_deal_dump = [
  { id: 'deal_hades', title: 'Hades', genre_keys: ['Action', 'Indie', 'RPG'], msrp_krw: 20500, historic_low_krw: 8200, current_low_krw: 10250, storefront: 'Steam' },
  { id: 'deal_breach', title: 'Into the Breach', genre_keys: ['Strategy', 'Indie'], msrp_krw: 16500, historic_low_krw: 4100, current_low_krw: 4950, storefront: 'Fanatical' },
  { id: 'deal_stardew', title: 'Stardew Valley', genre_keys: ['Simulation', 'Indie', 'RPG'], msrp_krw: 16500, historic_low_krw: 5800, current_low_krw: 6200, storefront: 'GOG' },
  { id: 'deal_outer', title: 'Outer Wilds', genre_keys: ['Adventure', 'Indie'], msrp_krw: 28500, historic_low_krw: 11400, current_low_krw: 12800, storefront: 'Epic' },
  { id: 'deal_slay', title: 'Slay the Spire', genre_keys: ['Strategy', 'Indie', 'RPG'], msrp_krw: 24500, historic_low_krw: 4900, current_low_krw: 5250, storefront: 'Steam' },
  { id: 'deal_celeste', title: 'Celeste', genre_keys: ['Action', 'Indie'], msrp_krw: 20500, historic_low_krw: 2050, current_low_krw: 2450, storefront: 'Humble' }
]

const GENRE_LEXICON = {
  Strategy: ['civilization', 'xcom', 'crusader', 'total war', 'stellaris', 'anno', 'turn', 'breach', 'chess', 'hearts of iron', 'europa', 'slay the spire'],
  RPG: ['witcher', 'elder scrolls', 'baldur', 'divinity', 'pillars', 'jrpg', 'final fantasy', 'mass effect', 'disco', 'hades', 'stardew'],
  Action: ['counter-strike', 'doom', 'elden', 'sekiro', 'devil may cry', 'celeste', 'hollow knight', 'resident evil'],
  Indie: ['hades', 'celeste', 'hollow knight', 'stardew', 'outer wilds', 'undertale', 'cuphead'],
  Simulation: ['simulator', 'cities', 'farming', 'flight', 'planet coaster', 'stardew'],
  Adventure: ['outer wilds', 'life is strange', 'walking dead', 'portal', 'tomb raider']
}

const ARCHETYPE_FORGE = {
  Strategy: { archetype: '턴제에 영혼을 판 전략가', tags: ['4X', 'SRPG', 'Turn-Based'] },
  RPG: { archetype: '서사에 목숨 거는 RPG 수집가', tags: ['Story-Rich', 'CRPG', 'Open World'] },
  Action: { archetype: '반사신경이 곧 실력인 액션 헌터', tags: ['FPS', 'Soulslike', 'Hack & Slash'] },
  Indie: { archetype: '숨은 명작을 캐내는 인디 발굴단', tags: ['Roguelike', 'Pixel', 'Narrative'] },
  Simulation: { archetype: '시스템을 지배하는 시뮬 제국주', tags: ['Tycoon', 'Sandbox', 'Crafting'] },
  Adventure: { archetype: '세계관에 빠져드는 탐험가', tags: ['Puzzle', 'Mystery', 'Exploration'] }
}

const MOCK_OWNED_VAULT = [
  { appid: 289070, name: 'Sid Meier\'s Civilization VI', playtime_forever: 6120 },
  { appid: 268500, name: 'XCOM 2', playtime_forever: 2840 },
  { appid: 281990, name: 'Stellaris', playtime_forever: 4510 },
  { appid: 394360, name: 'Hearts of Iron IV', playtime_forever: 1920 },
  { appid: 1145360, name: 'Hades', playtime_forever: 980 },
  { appid: 646570, name: 'Slay the Spire', playtime_forever: 1560 },
  { appid: 413150, name: 'Stardew Valley', playtime_forever: 720 },
  { appid: 753640, name: 'Outer Wilds', playtime_forever: 410 }
]

export const ghost_steam_fetcher = async (rawSteamApiUrl) => {
  const tunnel_url = `${CORS_GHOST_TUNNEL}${rawSteamApiUrl}`
  const tunnel_res = await fetch(tunnel_url, {
    headers: { 'X-Requested-With': 'XMLHttpRequest' }
  })
  if (!tunnel_res.ok) throw new Error(`ghost_steam_fetcher ${tunnel_res.status}`)
  return tunnel_res.json()
}

const forge_steam_api_url = (endpointPath, apiKey, queryBlob) => {
  const qs = new URLSearchParams({ key: apiKey, ...queryBlob })
  return `https://api.steampowered.com/${endpointPath}?${qs.toString()}`
}

export const resolve_steamid64 = async (rawProbe, apiKey) => {
  const trimmed_probe = rawProbe.trim()
  if (/^\d{17}$/.test(trimmed_probe)) return trimmed_probe
  const vanity_url = forge_steam_api_url('ISteamUser/ResolveVanityURL/v0001', apiKey, { vanityurl: trimmed_probe })
  const vanity_payload = await ghost_steam_fetcher(vanity_url)
  if (vanity_payload?.response?.success !== 1) throw new Error('VANITY_RESOLVE_MISS')
  return String(vanity_payload.response.steamid)
}

export const pull_player_summaries = async (steamid64, apiKey) => {
  const summary_url = forge_steam_api_url('ISteamUser/GetPlayerSummaries/v0002', apiKey, { steamids: steamid64 })
  const summary_payload = await ghost_steam_fetcher(summary_url)
  return summary_payload?.response?.players?.[0] ?? null
}

export const pull_owned_games = async (steamid64, apiKey) => {
  const owned_url = forge_steam_api_url('IPlayerService/GetOwnedGames/v0001', apiKey, {
    steamid: steamid64,
    include_appinfo: '1',
    include_played_free_games: '1',
    format: 'json'
  })
  const owned_payload = await ghost_steam_fetcher(owned_url)
  return owned_payload?.response?.games ?? []
}

export const alchemy_taste_matrix = (ownedGames) => {
  const genre_weights = {}
  let total_playtime = 0

  for (const vault_entry of ownedGames) {
    const minutes = vault_entry.playtime_forever || 0
    total_playtime += minutes
    const name_probe = (vault_entry.name || '').toLowerCase()
    for (const [genre_label, keyword_radar] of Object.entries(GENRE_LEXICON)) {
      if (keyword_radar.some((kw) => name_probe.includes(kw))) {
        genre_weights[genre_label] = (genre_weights[genre_label] || 0) + minutes
      }
    }
  }

  const ranked_genres = Object.entries(genre_weights).sort((a, b) => b[1] - a[1])
  const dominant_genre = ranked_genres[0]?.[0] || 'Strategy'
  const forge_hit = ARCHETYPE_FORGE[dominant_genre] || ARCHETYPE_FORGE.Strategy
  const steam_asset_value = ownedGames.length * STEAM_AVG_TICKET_KRW
  const top_weight = genre_weights[dominant_genre] || 0
  const concentration = top_weight / Math.max(total_playtime, 1)
  const soul_sync_pct = Math.min(99, Math.max(58, Math.round(52 + concentration * 47)))

  const dominant_genre_radar = ranked_genres.slice(0, 3).map(([g]) => g)
  if (dominant_genre_radar.length === 0) dominant_genre_radar.push('Strategy', 'RPG', 'Indie')

  return {
    archetype: forge_hit.archetype,
    genre_bias: forge_hit.tags,
    soul_sync_pct,
    vault_worth_krw: steam_asset_value,
    dominant_genre_radar
  }
}

export const snipe_volatile_deals = (dominant_genre_radar) => {
  const radar = dominant_genre_radar?.length ? dominant_genre_radar : ['Strategy', 'RPG', 'Indie']
  return indie_deal_dump
    .filter((deal_chip) => deal_chip.genre_keys.some((gk) => radar.includes(gk)))
    .slice(0, 3)
}

export const mock_steam_injector = async (rawProbe) => {
  const apiKey = import.meta.env.VITE_STEAM_API_KEY
  if (!apiKey || !rawProbe?.trim()) {
    const matrix = alchemy_taste_matrix(MOCK_OWNED_VAULT)
    return {
      persona: { personaname: 'CyberCat_404 (Mock Vault)' },
      matrix,
      volatile_price_snipes: snipe_volatile_deals(matrix.dominant_genre_radar),
      used_mock_vault: true
    }
  }

  const steamid64 = await resolve_steamid64(rawProbe, apiKey)
  const [persona, ownedGames] = await Promise.all([
    pull_player_summaries(steamid64, apiKey),
    pull_owned_games(steamid64, apiKey)
  ])

  const vault_games = ownedGames.length > 0 ? ownedGames : MOCK_OWNED_VAULT
  const matrix = alchemy_taste_matrix(vault_games)
  return {
    persona,
    matrix,
    volatile_price_snipes: snipe_volatile_deals(matrix.dominant_genre_radar),
    used_mock_vault: ownedGames.length === 0
  }
}
