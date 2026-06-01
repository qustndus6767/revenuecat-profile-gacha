import { useState, useEffect, useRef } from 'react'
import html2canvas from 'html2canvas'
import { Purchases } from '@revenuecat/purchases-js'
import { DEFAULT_SOUL_MATRIX, mock_steam_injector } from './lib/steam_vault'
import { SteamSoulScanner, GHOST_LOG_SCRIPTS } from './components/SteamSoulScanner'
import DopamineImpactModal from './components/DopamineImpactModal'
import MasterLoungePanel from './components/MasterLoungePanel'
import HipSlopToast from './components/HipSlopToast'
import { cyber_grade_allocator } from './lib/cyber_grade_allocator'
import { forge_raw_ticket_hash } from './lib/master_lounge_vault'
import {
  pull_cached_soul_payload,
  push_cached_soul_payload,
  build_anchor_blob,
  sync_master_flag_to_vault,
  flash_purge_executor
} from './lib/volatile_session_anchor'

const cached_soul_payload_boot = pull_cached_soul_payload()

const COSMETIC_POOL = [
  { id: 't_gacha_master', name: 'Master of Gacha', type: 'title', rarity: 'Legendary', style: 'text-yellow-400 font-extrabold uppercase tracking-widest drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]' },
  { id: 't_cyber_cat', name: 'Cyberpunk Cat', type: 'title', rarity: 'Epic', style: 'text-fuchsia-400 font-bold tracking-wide drop-shadow-[0_0_6px_rgba(232,121,249,0.5)]' },
  { id: 't_steam_hermit', name: 'Steam Hermit', type: 'title', rarity: 'Rare', style: 'text-cyan-400 font-medium tracking-normal drop-shadow-[0_0_4px_rgba(34,211,238,0.4)]' },
  { id: 't_code_whisperer', name: 'Code Whisperer', type: 'title', rarity: 'Epic', style: 'text-violet-400 font-bold tracking-wide drop-shadow-[0_0_6px_rgba(167,139,250,0.5)]' },
  { id: 'b_neon_pink', name: 'Hologram Pink Frame', type: 'border', rarity: 'Legendary', style: 'ring-4 ring-pink-500 ring-offset-2 ring-offset-slate-900 animate-pulse' },
  { id: 'b_sapphire_aura', name: 'Sapphire Aura Frame', type: 'border', rarity: 'Epic', style: 'ring-4 ring-blue-500 ring-offset-2 ring-offset-slate-900' },
  { id: 'b_emerald_circuit', name: 'Emerald Circuit Frame', type: 'border', rarity: 'Rare', style: 'ring-4 ring-emerald-500 ring-offset-2 ring-offset-slate-900' },
  { id: 'a_neon_grid', name: 'Retro Neon Grid (Animated)', type: 'avatar', rarity: 'SSR', style: 'ring-4 ring-purple-500 ring-offset-2 ring-offset-slate-900', url: 'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif' },
  { id: 'a_space_voyager', name: 'Cosmic Voyager (Animated)', type: 'avatar', rarity: 'SSR', style: 'ring-4 ring-pink-500 ring-offset-2 ring-offset-slate-900', url: 'https://media.giphy.com/media/5t9wJjyHAOxvnIp5Y4/giphy.gif' },
  { id: 'a_cyber_hacker', name: 'Hologram Hacker (Animated)', type: 'avatar', rarity: 'SSR', style: 'ring-4 ring-cyan-500 ring-offset-2 ring-offset-slate-900', url: 'https://media.giphy.com/media/3oz8xALRf3liRfy2CI/giphy.gif' }
]

const strip_oklch_poison = (cssChunk) =>
  cssChunk
    .replace(/oklch\([^)]*\)/gi, '#94a3b8')
    .replace(/oklab\([^)]*\)/gi, '#94a3b8')
    .replace(/color-mix\([^)]*\)/gi, '#94a3b8')

const hydrate_capture_clone_doc = (clonedDoc) => {
  const style_vault = []
  document.querySelectorAll('style').forEach((node) => {
    if (node.textContent) style_vault.push(strip_oklch_poison(node.textContent))
  })
  clonedDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => node.remove())
  const ink_node = clonedDoc.createElement('style')
  ink_node.textContent = style_vault.join('\n')
  clonedDoc.head.appendChild(ink_node)
}

const polish_capture_gradients = (clonedRoot) => {
  clonedRoot.querySelectorAll('[class*="bg-clip-text"]').forEach((el) => {
    el.style.background = 'none'
    el.style.webkitBackgroundClip = 'border-box'
    el.style.backgroundClip = 'border-box'
    el.style.color = '#fbbf24'
    el.style.webkitTextFillColor = '#fbbf24'
  })
}

const resync_cosmetic_item = (item) => {
  if (!item?.id) return item
  const canon = COSMETIC_POOL.find((c) => c.id === item.id)
  return canon ? { ...item, ...canon } : item
}

const flex_card_img_rescue = (e) => {
  e.currentTarget.onerror = null
  e.currentTarget.src = '/cyber_cat_avatar.png'
}

function usePremiumEnforcer() {
  const [customerInfo, setCustomerInfo] = useState(null)
  const [appUserId, setAppUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [localMasterActive, setLocalMasterActive] = useState(false)

  const syncRevenueCatState = async () => {
    try {
      if (Purchases.isConfigured()) {
        const purchases = Purchases.getSharedInstance()
        const info = await purchases.getCustomerInfo()
        setCustomerInfo(info)
        setAppUserId(purchases.getAppUserId())
        if (info?.entitlements?.active?.['master'] || info?.entitlements?.all?.['master']?.isActive) {
          localStorage.setItem('steam_customizer_master', '1')
          setLocalMasterActive(true)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const activatePurchases = async (apiKey, userId) => {
    if (!Purchases.isConfigured()) {
      Purchases.configure({ apiKey, appUserId: userId })
    }
    await syncRevenueCatState()
  }

  const logInUser = async (newUserId) => {
    if (Purchases.isConfigured() && newUserId.trim()) {
      setLoading(true)
      const purchases = Purchases.getSharedInstance()
      await purchases.changeUser(newUserId.trim())
      await syncRevenueCatState()
    }
  }

  const logOutUser = async () => {
    if (Purchases.isConfigured()) {
      setLoading(true)
      const purchases = Purchases.getSharedInstance()
      const anonymousId = Purchases.generateRevenueCatAnonymousAppUserId()
      await purchases.changeUser(anonymousId)
      localStorage.removeItem('steam_customizer_master')
      setLocalMasterActive(false)
      await syncRevenueCatState()
    }
  }

  useEffect(() => {
    if (localStorage.getItem('steam_customizer_master') === '1') {
      setLocalMasterActive(true)
    }
  }, [])

  const persistMasterAccess = () => {
    localStorage.setItem('steam_customizer_master', '1')
    setLocalMasterActive(true)
  }

  const imprintLocalMaster = (master_flag) => {
    if (master_flag) {
      localStorage.setItem('steam_customizer_master', '1')
      setLocalMasterActive(true)
    } else {
      localStorage.removeItem('steam_customizer_master')
      setLocalMasterActive(false)
    }
  }

  const isMaster = !!(customerInfo?.entitlements?.active?.['master'] || customerInfo?.entitlements?.all?.['master']?.isActive) || localMasterActive

  return {
    customerInfo,
    appUserId,
    loading,
    isMaster,
    syncRevenueCatState,
    activatePurchases,
    logInUser,
    logOutUser,
    persistMasterAccess,
    imprintLocalMaster
  }
}

function App() {
  const [activeTab, setActiveTab] = useState('profile')
  const [equippedTitle, setEquippedTitle] = useState(null)
  const [equippedBorder, setEquippedBorder] = useState(null)
  const [equippedAvatar, setEquippedAvatar] = useState(null)
  const [inventory, setInventory] = useState([])
  const [steamPoints, setSteamPoints] = useState(500)
  const [gachaStatus, setGachaStatus] = useState('idle')
  const [gachaResult, setGachaResult] = useState(null)
  const [isShaking, setIsShaking] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [modalTargetItem, setModalTargetItem] = useState('')
  const [inputUserId, setInputUserId] = useState('')
  const [offeringPackages, setOfferingPackages] = useState([])
  const [paymentTunnelState, setPaymentTunnelState] = useState('idle')
  const [paymentFeedbackSlot, setPaymentFeedbackSlot] = useState(null)
  const [loot_box_raffle_stamp, setLoot_box_raffle_stamp] = useState(() => cached_soul_payload_boot?.loot_box_raffle_stamp ?? null)
  const [raffle_stamp_overlay, setRaffleStampOverlay] = useState(false)
  const [hip_slop_toast, setHipSlopToast] = useState(null)
  const [steam_persona_label, setSteamPersonaLabel] = useState(() => cached_soul_payload_boot?.steam_persona_label || 'CyberCat_404')
  const [user_soul_matrix, setUserSoulMatrix] = useState(() => cached_soul_payload_boot?.user_soul_matrix || DEFAULT_SOUL_MATRIX)
  const [volatile_price_snipes, setVolatilePriceSnipes] = useState(() => cached_soul_payload_boot?.volatile_price_snipes ?? [])
  const [soul_nick_probe, setSoulNickProbe] = useState(() => cached_soul_payload_boot?.soul_nick_probe ?? '')
  const [isScanComplete, setIsScanComplete] = useState(() => !!cached_soul_payload_boot?.isScanComplete)
  const [active_scan_trigger, setActiveScanTrigger] = useState(false)
  const [volatile_scan_monitor, setVolatileScanMonitor] = useState('idle')
  const [ghost_log_ticker, setGhostLogTicker] = useState([])
  const [dynamic_tier_payload, setDynamicTierPayload] = useState(() => cached_soul_payload_boot?.dynamic_tier_payload ?? null)
  const [glitch_modal_state, setGlitchModalState] = useState(false)
  const [neon_impact_flash, setNeonImpactFlash] = useState(false)
  const flex_card_canvas_ref = useRef(null)
  const ghost_log_interval_ref = useRef(null)
  const pending_vault_payload_ref = useRef(null)
  const anchor_write_lock = useRef(!!cached_soul_payload_boot)

  const {
    appUserId,
    loading,
    isMaster,
    syncRevenueCatState,
    activatePurchases,
    logInUser,
    logOutUser,
    persistMasterAccess,
    imprintLocalMaster
  } = usePremiumEnforcer()

  useEffect(() => {
    if (cached_soul_payload_boot?.isMaster) imprintLocalMaster(true)
    anchor_write_lock.current = false
  }, [])

  useEffect(() => {
    const apiKey = import.meta.env.VITE_REVENUECAT_API_KEY
    if (apiKey) {
      const cachedUserId = localStorage.getItem('steam_customizer_user_id') || Purchases.generateRevenueCatAnonymousAppUserId()
      localStorage.setItem('steam_customizer_user_id', cachedUserId)
      activatePurchases(apiKey, cachedUserId)
    }
  }, [])

  useEffect(() => {
    if (anchor_write_lock.current) return
    const local_state_vault = build_anchor_blob({
      soul_nick_probe,
      isScanComplete,
      isMaster,
      loot_box_raffle_stamp,
      steam_persona_label,
      user_soul_matrix,
      dynamic_tier_payload,
      volatile_price_snipes
    })
    push_cached_soul_payload(local_state_vault)
    sync_master_flag_to_vault(isMaster)
  }, [
    soul_nick_probe,
    isScanComplete,
    isMaster,
    loot_box_raffle_stamp,
    steam_persona_label,
    user_soul_matrix,
    dynamic_tier_payload,
    volatile_price_snipes
  ])

  useEffect(() => {
    try {
      let loadedInventory = []
      const savedInv = localStorage.getItem('steam_customizer_inventory')
      if (savedInv) {
        const parsed = JSON.parse(savedInv)
        if (Array.isArray(parsed)) {
          loadedInventory = parsed.map(resync_cosmetic_item)
          setInventory(loadedInventory)
        }
      }
      const resolveStoredItem = (id) => {
        if (!id) return null
        const hit = loadedInventory.find((i) => i.id === id) || COSMETIC_POOL.find((i) => i.id === id) || null
        return resync_cosmetic_item(hit)
      }
      const titleId = localStorage.getItem('steam_customizer_equipped_title')
      const borderId = localStorage.getItem('steam_customizer_equipped_border')
      const avatarId = localStorage.getItem('steam_customizer_equipped_avatar')
      if (titleId) setEquippedTitle(resolveStoredItem(titleId))
      if (borderId) setEquippedBorder(resolveStoredItem(borderId))
      if (avatarId) setEquippedAvatar(resolveStoredItem(avatarId))
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('steam_customizer_inventory', JSON.stringify(inventory))
  }, [inventory])

  useEffect(() => {
    if (equippedTitle) localStorage.setItem('steam_customizer_equipped_title', equippedTitle.id)
    else localStorage.removeItem('steam_customizer_equipped_title')
  }, [equippedTitle])

  useEffect(() => {
    if (equippedBorder) localStorage.setItem('steam_customizer_equipped_border', equippedBorder.id)
    else localStorage.removeItem('steam_customizer_equipped_border')
  }, [equippedBorder])

  useEffect(() => {
    if (equippedAvatar) localStorage.setItem('steam_customizer_equipped_avatar', equippedAvatar.id)
    else localStorage.removeItem('steam_customizer_equipped_avatar')
  }, [equippedAvatar])

  useEffect(() => {
    if (appUserId) {
      localStorage.setItem('steam_customizer_user_id', appUserId)
      setInputUserId(appUserId)
      
      const fetchOfferings = async () => {
        if (Purchases.isConfigured()) {
          try {
            const offerings = await Purchases.getSharedInstance().getOfferings()
            if (offerings.current?.availablePackages) {
              setOfferingPackages(offerings.current.availablePackages)
            }
          } catch (e) {
            console.error(e)
          }
        }
      }
      fetchOfferings()
    }
  }, [appUserId])

  const switchAppThemeTone = (masterActive) => {
    if (masterActive) {
      document.documentElement.classList.add('masterCyberpunkTheme')
    } else {
      document.documentElement.classList.remove('masterCyberpunkTheme')
    }
  }

  const triggerPaymentTunnel = async (pkg) => {
    if (!Purchases.isConfigured()) return
    setPaymentTunnelState('pending')
    setPaymentFeedbackSlot(null)
    try {
      let targetPkg = pkg
      if (!targetPkg) {
        const offerings = await Purchases.getSharedInstance().getOfferings()
        targetPkg = offerings.current?.availablePackages?.[0] ?? null
      }
      if (!targetPkg) {
        setPaymentFeedbackSlot({
          status: 'error',
          headline: 'NO OFFERING FOUND',
          detail: 'RevenueCat 대시보드에 활성화된 Offering이 없습니다. 대시보드에서 Offering을 설정하거나 고객 패널에서 직접 Entitlement를 부여하세요.',
        })
        setPaymentTunnelState('idle')
        return
      }
      await Purchases.getSharedInstance().purchase({ rcPackage: targetPkg })
      await syncRevenueCatState()
      persistMasterAccess()
      setPaymentTunnelState('success')
      setPaymentFeedbackSlot({
        status: 'success',
        headline: 'MASTER ACTIVATED',
        detail: '결제가 완료되었습니다! Master 등급이 활성화되었으며 모든 SSR 아바타와 프리미엄 기능이 즉시 해제됩니다.',
      })
      setShowUpgradeModal(false)
      switchAppThemeTone(true)
    } catch (error) {
      const isCancelled = error?.userCancelled === true || error?.code === 'PURCHASE_CANCELLED' || String(error?.message).toLowerCase().includes('cancel')
      if (isCancelled) {
        setPaymentTunnelState('idle')
        setPaymentFeedbackSlot(null)
        return
      }
      const sandboxHint = String(error?.message ?? '').toLowerCase().includes('sandbox') || String(error?.underlyingErrorMessage ?? '').toLowerCase().includes('sandbox')
      setPaymentTunnelState('error')
      setPaymentFeedbackSlot({
        status: 'error',
        headline: sandboxHint ? 'SANDBOX ERROR' : 'PAYMENT FAILED',
        detail: sandboxHint
          ? `[Sandbox] ${error?.message ?? '알 수 없는 오류'} — Stripe 테스트 카드(4242 4242 4242 4242)를 사용하고 있는지 확인하세요.`
          : error?.message ?? '결제 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        code: error?.code ?? null,
      })
    }
  }

  useEffect(() => {
    switchAppThemeTone(isMaster)
  }, [isMaster])

  const currentAvatarUrl = (equippedAvatar && (equippedAvatar.rarity !== 'SSR' || isMaster))
    ? (resync_cosmetic_item(equippedAvatar)?.url ?? '/cyber_cat_avatar.png')
    : '/cyber_cat_avatar.png'

  const premiumGlowEffect = isMaster
    ? 'premiumGlowEffect rounded-2xl p-[3px] steam-premium-glow-border transition-all duration-500'
    : 'border-2 border-slate-700/60 rounded-2xl steam-glow-border bg-slate-900/80 transition-all duration-500'

  const triggerGachaRoll = () => {
    if (gachaStatus === 'spinning') return
    if (!isMaster && steamPoints < 100) {
      alert('Points depleted! Purchase Master subscription for unlimited draws.')
      return
    }

    setGachaStatus('spinning')
    setIsShaking(true)
    setGachaResult(null)

    if (!isMaster) {
      setSteamPoints(prev => prev - 100)
    }

    setTimeout(() => {
      setIsShaking(false)
      const randomIndex = Math.floor(Math.random() * COSMETIC_POOL.length)
      const selectedReward = COSMETIC_POOL[randomIndex]
      
      setGachaResult(selectedReward)
      setGachaStatus('showingResult')
      setInventory(prev => {
        if (prev.some(item => item.id === selectedReward.id)) {
          return prev
        }
        return [...prev, selectedReward]
      })
    }, 1200)
  }

  const flex_story_nick = isScanComplete ? steam_persona_label : '???'

  useEffect(() => {
    return () => {
      if (ghost_log_interval_ref.current) clearInterval(ghost_log_interval_ref.current)
    }
  }, [])

  useEffect(() => {
    if (!hip_slop_toast) return undefined
    const toast_decay_timer = setTimeout(() => setHipSlopToast(null), 2800)
    return () => clearTimeout(toast_decay_timer)
  }, [hip_slop_toast])

  const harvest_vault_payload = async (nickLabel) => {
    try {
      return await mock_steam_injector(nickLabel)
    } catch {
      return {
        matrix: DEFAULT_SOUL_MATRIX,
        volatile_price_snipes: []
      }
    }
  }

  const seal_tier_to_profile = () => {
    const nickLabel = soul_nick_probe.trim()
    const tier_seal = dynamic_tier_payload
    const vault_blob = pending_vault_payload_ref.current
    setSteamPersonaLabel(nickLabel)
    if (vault_blob?.matrix) {
      setUserSoulMatrix({
        archetype: tier_seal?.roast_line ?? vault_blob.matrix.archetype,
        genre_bias: tier_seal?.tag_chip ?? vault_blob.matrix.genre_bias,
        soul_sync_pct: vault_blob.matrix.soul_sync_pct,
        vault_worth_krw: vault_blob.matrix.vault_worth_krw
      })
      setVolatilePriceSnipes(vault_blob.volatile_price_snipes ?? [])
    }
    setGlitchModalState(false)
    setIsScanComplete(true)
    setNeonImpactFlash(true)
    setActiveTab('profile')
    setTimeout(() => setNeonImpactFlash(false), 1100)
  }

  const fire_active_scan_trigger = () => {
    if (!soul_nick_probe.trim() || active_scan_trigger) return
    setIsScanComplete(false)
    setGlitchModalState(false)
    setActiveScanTrigger(true)
    setVolatileScanMonitor('live')
    setGhostLogTicker([GHOST_LOG_SCRIPTS[0]])
    let log_cursor = 1
    ghost_log_interval_ref.current = setInterval(() => {
      setGhostLogTicker((prev) => [...prev, GHOST_LOG_SCRIPTS[log_cursor % GHOST_LOG_SCRIPTS.length]])
      log_cursor += 1
    }, 260)
    setTimeout(async () => {
      if (ghost_log_interval_ref.current) clearInterval(ghost_log_interval_ref.current)
      setActiveScanTrigger(false)
      setVolatileScanMonitor('idle')
      const nickLabel = soul_nick_probe.trim()
      const tier_roll = cyber_grade_allocator(nickLabel)
      pending_vault_payload_ref.current = await harvest_vault_payload(nickLabel)
      setDynamicTierPayload(tier_roll)
      setGlitchModalState(true)
    }, 1500)
  }

  const ssr_loadout_spotlight = [equippedAvatar, equippedTitle, equippedBorder]
    .map((gear) => resync_cosmetic_item(gear))
    .filter(
      (gear) => gear && ((gear.type === 'avatar' && gear.rarity === 'SSR') || gear.rarity === 'Legendary' || (gear.type === 'border' && gear.rarity === 'Legendary'))
    )

  const triggerCardExport = async () => {
    if (!isMaster || !flex_card_canvas_ref.current) return

    const extraction_deck = flex_card_canvas_ref.current
    const overlay_shield = extraction_deck.querySelector('.master-veil-blur')
    const interaction_btn = extraction_deck.querySelector('.generate-gif-btn-trigger')

    if (overlay_shield) overlay_shield.style.display = 'none'
    if (interaction_btn) interaction_btn.style.display = 'none'

    try {
      const raw_matrix_canvas = await html2canvas(extraction_deck, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0d0e12',
        scale: 2,
        logging: false,
        width: extraction_deck.offsetWidth,
        height: extraction_deck.offsetHeight,
        onclone: (clonedDoc, clonedRoot) => {
          hydrate_capture_clone_doc(clonedDoc)
          polish_capture_gradients(clonedRoot)
          clonedRoot.querySelectorAll('img').forEach((imgNode) => {
            if (imgNode.src && !imgNode.src.startsWith(window.location.origin)) {
              imgNode.crossOrigin = 'anonymous'
            }
          })
        }
      })

      const toxic_vault_url = raw_matrix_canvas.toDataURL('image/png')
      const phantom_anchor = document.createElement('a')

      phantom_anchor.href = toxic_vault_url
      phantom_anchor.download = `STEAM_MASTER_SOUL_${Date.now()}.png`

      document.body.appendChild(phantom_anchor)
      phantom_anchor.click()
      document.body.removeChild(phantom_anchor)
    } catch (matrix_panic_error) {
      console.error(matrix_panic_error)
    } finally {
      if (overlay_shield) overlay_shield.style.display = ''
      if (interaction_btn) interaction_btn.style.display = ''
    }
  }

  const trigger_loot_box_raffle_fire = () => {
    if (!isMaster || loot_box_raffle_stamp) return
    setLoot_box_raffle_stamp(forge_raw_ticket_hash())
    setRaffleStampOverlay(true)
    setHipSlopToast({
      tone: 'pink',
      headline: 'RAFFLE STAMP SEALED',
      detail: `티켓 #${forge_raw_ticket_hash()} · 이번 주 스팀 1만 원권 응모 봉인 완료`
    })
    setTimeout(() => setRaffleStampOverlay(false), 2400)
  }

  const copy_match_soul_target = (match_soul_target) => {
    const friend_link_blob = match_soul_target.steam_friend_url
    navigator.clipboard.writeText(friend_link_blob).then(() => {
      setHipSlopToast({
        tone: 'cyan',
        headline: 'STEAM FRIEND LINK COPIED',
        detail: `${match_soul_target.callsign} · ${friend_link_blob}`
      })
    }).catch(() => {
      setHipSlopToast({
        tone: 'pink',
        headline: 'CLIPBOARD BYPASS',
        detail: `수동 복사 → ${friend_link_blob}`
      })
    })
  }

  const matrix_wipe_trigger = () => {
    flash_purge_executor()
    imprintLocalMaster(false)
    anchor_write_lock.current = true
    setSoulNickProbe('')
    setIsScanComplete(false)
    setLoot_box_raffle_stamp(null)
    setSteamPersonaLabel('CyberCat_404')
    setUserSoulMatrix(DEFAULT_SOUL_MATRIX)
    setVolatilePriceSnipes([])
    setDynamicTierPayload(null)
    setInventory([])
    setEquippedTitle(null)
    setEquippedBorder(null)
    setEquippedAvatar(null)
    setGlitchModalState(false)
    setNeonImpactFlash(false)
    setRaffleStampOverlay(false)
    setActiveScanTrigger(false)
    setVolatileScanMonitor('idle')
    setGhostLogTicker([])
    setShowUpgradeModal(false)
    setPaymentTunnelState('idle')
    setPaymentFeedbackSlot(null)
    setActiveTab('profile')
    anchor_write_lock.current = false
    setHipSlopToast({
      tone: 'pink',
      headline: 'MATRIX WIPED',
      detail: 'volatile_session_anchor purged · 스캔 전 상태로 롤백'
    })
  }

  const enter_discord_party_room = (match_soul_target) => {
    setHipSlopToast({
      tone: 'purple',
      headline: 'DISCORD VAULT HANDSHAKE',
      detail: `${match_soul_target.discord_room_slug} 비공개 파티룸 입장 중...`
    })
    window.open(match_soul_target.discord_invite, '_blank', 'noopener,noreferrer')
  }

  const equipCosmeticGear = (item) => {
    const isPremiumItem = (item.type === 'avatar' && item.rarity === 'SSR') || (item.type === 'title' && item.id === 't_gacha_master')
    if (isPremiumItem && !isMaster) {
      setModalTargetItem(item.name)
      setShowUpgradeModal(true)
      return
    }

    if (item.type === 'title') {
      setEquippedTitle(prev => prev?.id === item.id ? null : item)
    } else if (item.type === 'border') {
      setEquippedBorder(prev => prev?.id === item.id ? null : item)
    } else if (item.type === 'avatar') {
      setEquippedAvatar(prev => prev?.id === item.id ? null : item)
    }
  }

  return (
    <div className={`min-h-screen text-slate-100 flex flex-col items-center justify-between font-sans transition-all duration-700 overflow-x-hidden ${
      isMaster 
        ? 'bg-radial from-slate-950 via-slate-900 to-purple-950/40' 
        : 'bg-radial from-slate-950 via-slate-900 to-slate-950'
    }`}>
      
      <header className="w-full max-w-5xl px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 z-20 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center font-black text-sm tracking-wider shadow-lg shadow-cyan-500/20">S</div>
          <span className="font-semibold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">STEAM CUSTOMIZER</span>
          <button
            type="button"
            onClick={matrix_wipe_trigger}
            className="matrix_wipe_trigger_btn text-[7px] font-mono font-black tracking-[0.2em] text-slate-600 hover:text-red-400 border border-slate-800/80 hover:border-red-500/50 px-2 py-1 rounded-md uppercase transition-all"
          >
            데이터 리셋
          </button>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-slate-900/90 px-4 py-2.5 rounded-2xl border border-slate-800/80 max-w-full md:max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 tracking-wider font-mono">USER ID:</span>
            <input 
              type="text" 
              value={inputUserId}
              onChange={(e) => setInputUserId(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs px-2.5 py-1 rounded text-slate-200 focus:outline-none focus:border-cyan-500 font-mono w-32 md:w-40"
              placeholder="User ID"
            />
            <button 
              onClick={() => logInUser(inputUserId)}
              disabled={loading}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 text-[10px] font-black px-2.5 py-1.5 rounded transition-all flex-shrink-0"
            >
              연동
            </button>
            <button 
              onClick={logOutUser}
              disabled={loading}
              className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-[10px] font-bold px-2 py-1.5 rounded transition-all flex-shrink-0"
            >
              로그아웃
            </button>
          </div>
          
          <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 tracking-wider font-mono">STATUS:</span>
            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
              isMaster 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white animate-pulse shadow-md shadow-purple-500/20' 
                : 'bg-slate-950 text-cyan-400 border border-slate-800'
            }`}>
              {isMaster ? 'MASTER' : 'FREE'}
            </span>
          </div>
        </div>
      </header>

      <main className="w-full max-w-6xl px-4 py-8 flex-grow flex flex-col justify-start z-10">

        {!loading && (
          <div className="relative w-full">
            <SteamSoulScanner
              soul_nick_probe={soul_nick_probe}
              onSoulNickProbe={setSoulNickProbe}
              active_scan_trigger={active_scan_trigger}
              onActiveScanTrigger={fire_active_scan_trigger}
              volatile_scan_monitor={volatile_scan_monitor}
              ghost_log_ticker={ghost_log_ticker}
              isScanComplete={isScanComplete}
            />
          </div>
        )}
        
        <div className="flex justify-center gap-2 mb-8 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/60 max-w-md mx-auto">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2.5 px-5 text-sm font-semibold rounded-lg transition-all duration-300 ${
              activeTab === 'profile'
                ? 'bg-slate-800 text-cyan-400 shadow-sm border-b-2 border-cyan-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            내 프로필
          </button>
          <button 
            onClick={() => setActiveTab('gacha')}
            className={`flex-1 py-2.5 px-5 text-sm font-semibold rounded-lg transition-all duration-300 ${
              activeTab === 'gacha'
                ? 'bg-slate-800 text-cyan-400 shadow-sm border-b-2 border-cyan-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            굿즈 가챠방
          </button>
          <button 
            onClick={() => setActiveTab('membership')}
            className={`flex-1 py-2.5 px-5 text-sm font-semibold rounded-lg transition-all duration-300 ${
              activeTab === 'membership'
                ? 'bg-slate-800 text-cyan-400 shadow-sm border-b-2 border-cyan-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            프리미엄 멤버십
          </button>
        </div>

        {loading ? (
          <div className="w-full flex flex-col items-center justify-center min-h-[300px] gap-3">
            <div className="w-10 h-10 border-4 border-t-purple-500 border-b-cyan-500 rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-mono tracking-widest uppercase">SYNCING REVENUECAT METRICS...</span>
          </div>
        ) : (
          <div className="transition-all duration-500">
            {activeTab === 'profile' && (
              <div className="flex flex-col gap-6 w-full">
              <div className="flex flex-col xl:flex-row gap-8 items-start w-full">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start flex-1 min-w-0 w-full">
                
                <div className="md:col-span-2 relative">
                  <div className={`${premiumGlowEffect} ${neon_impact_flash ? 'neon_impact_flash' : ''}`}>
                    <div className="relative rounded-2xl overflow-hidden steam-panel-gradient p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center md:items-start">
                      
                      {isMaster && (
                        <div className="absolute top-0 right-0 bg-gradient-to-l from-pink-500 to-purple-600 text-white text-[10px] font-black tracking-widest px-3 py-1 rounded-bl-lg shadow-lg">
                          MASTER PASS ACTIVE
                        </div>
                      )}

                      <div className="relative group">
                        <div className={`relative w-32 h-32 md:w-36 md:h-36 rounded-2xl bg-slate-950 flex items-center justify-center p-1.5 transition-all duration-300 shadow-2xl ${
                          equippedBorder ? equippedBorder.style : 'border border-slate-700/50'
                        }`}>
                          <img 
                            src={currentAvatarUrl} 
                            alt="Steam Cyber Avatar"
                            crossOrigin="anonymous"
                            onError={flex_card_img_rescue}
                            className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        
                        <div className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-950 animate-pulse shadow-md shadow-emerald-500/50" />
                      </div>

                      <div className="flex-1 flex flex-col justify-center md:justify-start text-center md:text-left gap-3 w-full">
                        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 justify-center md:justify-start">
                          <h2 className="text-2xl md:text-3xl font-extrabold tracking-wide text-white drop-shadow-md">
                            {isScanComplete ? steam_persona_label : '???'}
                          </h2>
                          <span className={`text-xs px-2 py-0.5 rounded font-mono font-black ${isScanComplete && dynamic_tier_payload ? 'cyber_grade_badge text-pink-300' : 'bg-slate-800 border border-slate-700/80 text-cyan-400'}`}>
                            {isScanComplete && dynamic_tier_payload ? `LV.${dynamic_tier_payload.level_stamp}` : 'LV.--'}
                          </span>
                        </div>

                        <div className="min-h-[52px] flex flex-col items-center md:items-start justify-center gap-1">
                          {isScanComplete && dynamic_tier_payload ? (
                            <>
                              <span className={`text-base md:text-lg font-black tracking-wide dopamine_payload_reveal ${dynamic_tier_payload.flare_class}`}>
                                {dynamic_tier_payload.grade_label}
                              </span>
                              <span className="text-[11px] text-fuchsia-300/90 italic dopamine_payload_reveal">
                                {dynamic_tier_payload.roast_line}
                              </span>
                            </>
                          ) : equippedTitle ? (
                            <span className={`text-sm tracking-wide ${equippedTitle.style}`}>
                              {equippedTitle.name}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-500 italic tracking-wider">스캔 후 겜생 등급 표시</span>
                          )}
                        </div>

                        <p className="text-slate-400 text-xs md:text-sm max-w-md leading-relaxed mt-2 bg-slate-950/40 p-3 rounded-lg border border-slate-800/40">
                          {isScanComplete && dynamic_tier_payload
                            ? `SteamSoulScanner 인증 완료 · ${dynamic_tier_payload.grade_label} 등급 프로필 동기화됨`
                            : 'Hello, traveler. I am scanning the blockchain for retro game keys. Operating on fully decentralized Steam algorithms.'}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 mt-3 justify-center md:justify-start text-xs text-slate-400 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                            <span>온라인: 게임 가동 중</span>
                          </div>
                          <span className="text-slate-700">|</span>
                          <div>스팀 코인: <span className="text-yellow-500 font-bold">{isMaster ? '∞' : `${steamPoints} P`}</span></div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/70 flex flex-col gap-4">
                  <h3 className="text-sm font-bold tracking-widest text-slate-400 uppercase">인벤토리 & 장비</h3>
                  
                  <div className="flex-grow min-h-[220px] max-h-[300px] overflow-y-auto steam-scrollbar bg-slate-950/60 p-3 pr-2 rounded-xl border border-slate-800/40 flex flex-col gap-2">
                    {inventory.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <span className="text-3xl mb-2">👾</span>
                        <p className="text-xs text-slate-500 leading-relaxed">획득한 굿즈가 없습니다.<br />굿즈 가챠방에서 아이템을 뽑아보세요!</p>
                      </div>
                    ) : (
                      inventory.map(item => {
                        const isEquipped = equippedTitle?.id === item.id || equippedBorder?.id === item.id || equippedAvatar?.id === item.id
                        const isLockedPremium = (item.type === 'avatar' && item.rarity === 'SSR' && !isMaster) || (item.type === 'title' && item.id === 't_gacha_master' && !isMaster)
                        return (
                          <div 
                            key={item.id}
                            className={`flex items-center justify-between p-2.5 rounded-lg border transition-all duration-300 bg-slate-900/40 gap-3 ${
                              isEquipped 
                                ? 'border-cyan-500/80 bg-cyan-950/10' 
                                : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-grow min-w-0">
                              <div className="w-10 h-10 rounded-md bg-slate-950 flex items-center justify-center p-0.5 border border-slate-800/80 flex-shrink-0 overflow-hidden">
                                {item.type === 'avatar' ? (
                                  <img src={resync_cosmetic_item(item)?.url ?? item.url} onError={flex_card_img_rescue} className="w-full h-full object-cover rounded" alt="" />
                                ) : item.type === 'border' ? (
                                  <div className={`w-full h-full rounded border ${item.style} flex items-center justify-center p-1`}>
                                    <div className="w-3.5 h-3.5 bg-slate-900 rounded-sm" />
                                  </div>
                                ) : (
                                  <div className="w-full h-full rounded bg-slate-900 flex items-center justify-center text-xs font-black text-slate-500 font-mono tracking-tighter">
                                    T
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col gap-0.5 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-widest uppercase ${
                                    item.type === 'title' 
                                      ? 'text-cyan-500 bg-cyan-950/20' 
                                      : item.type === 'border' 
                                        ? 'text-purple-400 bg-purple-950/20'
                                        : 'text-amber-400 bg-amber-950/20'
                                  }`}>{item.type}</span>
                                  {isLockedPremium && (
                                    <span className="text-[8px] bg-red-600 text-white font-extrabold px-1 rounded animate-pulse">🔒 PREMIUM</span>
                                  )}
                                </div>
                                <span className={`text-sm font-bold truncate block ${
                                  item.type === 'title' ? item.style : 'text-slate-200'
                                }`}>{item.name}</span>
                              </div>
                            </div>
                            
                            <div className="flex-shrink-0 ml-2">
                              <button
                                onClick={() => equipCosmeticGear(item)}
                                className={`px-3 py-1.5 rounded text-[11px] font-black transition-all flex items-center gap-1 flex-shrink-0 ${
                                  isEquipped 
                                    ? 'bg-cyan-500 text-slate-950' 
                                    : isLockedPremium
                                      ? 'bg-slate-800/50 hover:bg-slate-800 text-slate-500 cursor-pointer border border-red-500/30'
                                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                }`}
                              >
                                {isEquipped ? '해제' : '장착'}
                                {isLockedPremium && <span className="text-[9px]">🔒</span>}
                              </button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 leading-normal bg-slate-950/30 p-2.5 rounded border border-slate-800/40">
                    움직이는 SSR 아바타 및 Legendary 마스터 칭호는 오직 RevenueCat Master 라이선스가 연결되어 있어야 장착 가능합니다.
                  </div>
                </div>

              </div>

              <div className="w-full xl:w-[300px] flex-shrink-0 flex flex-col gap-5 mx-auto xl:mx-0">
                <div className="relative">
                  <div
                    ref={flex_card_canvas_ref}
                    className={`relative w-full max-w-[280px] mx-auto aspect-[9/16] rounded-3xl overflow-hidden flex flex-col border border-purple-500/30 shadow-2xl shadow-purple-950/50 bg-gradient-to-b from-slate-900 via-slate-950 to-purple-950/80 transition-all duration-700 ${neon_impact_flash ? 'neon_impact_flash' : ''}`}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(127,0,255,0.25),transparent_55%)] pointer-events-none" />
                    <div className="relative z-10 p-4 flex flex-col h-full">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[9px] font-black tracking-[0.2em] text-pink-400 uppercase">Premium Social Card</span>
                        <span className="text-[8px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded-full border border-cyan-800/50">9:16</span>
                      </div>

                      <div className="flex flex-col items-center gap-2 mb-3">
                        <div className={`w-24 h-24 rounded-2xl bg-slate-950 p-1 shadow-xl ${equippedBorder ? equippedBorder.style : 'ring-2 ring-slate-700'}`}>
                          <img src={currentAvatarUrl} alt="" crossOrigin="anonymous" onError={flex_card_img_rescue} className="w-full h-full object-cover rounded-xl" />
                        </div>
                        <h4 className={`text-lg font-black tracking-wide drop-shadow-lg ${isScanComplete ? 'text-white dopamine_payload_reveal' : 'text-slate-600'}`}>
                          {flex_story_nick}
                        </h4>
                        {isScanComplete && dynamic_tier_payload ? (
                          <div className="flex flex-col items-center gap-1 dopamine_payload_reveal">
                            <span className={`text-sm font-black text-center leading-tight ${dynamic_tier_payload.flare_class}`}>
                              {dynamic_tier_payload.grade_label}
                            </span>
                            <span className="text-[8px] font-mono text-cyan-400">LV.{dynamic_tier_payload.level_stamp}</span>
                            <span className="text-[8px] text-slate-400 italic text-center px-2">{dynamic_tier_payload.roast_line}</span>
                          </div>
                        ) : equippedTitle ? (
                          <span className={`text-[10px] ${equippedTitle.style}`}>{equippedTitle.name}</span>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap justify-center gap-1.5 mb-auto min-h-[52px]">
                        {ssr_loadout_spotlight.length > 0 ? (
                          ssr_loadout_spotlight.map((gear) => (
                            <div key={gear.id} className="flex flex-col items-center gap-0.5 bg-slate-950/70 border border-amber-500/40 rounded-lg p-1.5 w-[72px]">
                              {gear.type === 'avatar' ? (
                                <img src={gear.url} alt="" crossOrigin="anonymous" onError={flex_card_img_rescue} className="w-8 h-8 rounded object-cover ring-1 ring-amber-400/60" />
                              ) : (
                                <div className={`w-8 h-8 rounded flex items-center justify-center text-[10px] font-black ${gear.type === 'title' ? 'bg-amber-950/50 text-amber-300' : 'bg-purple-950/50'}`}>
                                  {gear.type === 'title' ? 'T' : '◈'}
                                </div>
                              )}
                              <span className="text-[7px] font-bold text-amber-300 text-center line-clamp-2 leading-tight">{gear.name}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-[9px] text-slate-500 italic text-center py-2">SSR 장비 미장착 — 가챠에서 획득 후 장착</span>
                        )}
                      </div>

                      <div className={`mt-auto space-y-2.5 bg-slate-950/60 rounded-xl p-3 border border-slate-800/60 ${isScanComplete ? 'dopamine_payload_reveal' : ''}`}>
                        {!isScanComplete ? (
                          <div className="flex flex-col items-center justify-center gap-2 py-4">
                            <span className="text-2xl text-slate-700">?</span>
                            <span className="text-[9px] text-slate-600 font-mono tracking-wider">스캔 대기 중</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-end justify-between gap-2">
                              <span className="text-[8px] text-slate-500 font-mono uppercase tracking-wider">계정 가치</span>
                              <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500">
                                ₩{user_soul_matrix.vault_worth_krw.toLocaleString('ko-KR')}
                              </span>
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-[8px] text-purple-300 font-bold truncate">{user_soul_matrix.archetype}</span>
                                <span className="text-[8px] font-mono text-pink-400 flex-shrink-0">{user_soul_matrix.soul_sync_pct}%</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 soul-bar-pulse" style={{ width: `${user_soul_matrix.soul_sync_pct}%` }} />
                              </div>
                              <div className="flex gap-1 flex-wrap">
                                {user_soul_matrix.genre_bias.map((tag) => (
                                  <span key={tag} className="text-[7px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono border border-cyan-900/50">{tag}</span>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={triggerCardExport}
                        disabled={!isMaster}
                        className={`generate-gif-btn-trigger mt-3 w-full py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${
                          isMaster
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:brightness-110 shadow-lg shadow-purple-500/30'
                            : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                        }`}
                      >
                        Generate Premium GIF
                      </button>
                    </div>

                    {!isMaster && isScanComplete && (
                      <div className="absolute top-3 right-3 z-20 text-[7px] font-black tracking-widest text-purple-300 bg-purple-950/90 border border-purple-500/40 px-2 py-1 rounded-full">
                        GIF · MASTER
                      </div>
                    )}
                    {!isMaster && !isScanComplete && (
                      <div className="flex-card-lock-shield absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-sm border border-slate-700/40">
                        <span className="text-3xl text-slate-600 mb-2">?</span>
                        <span className="text-[9px] font-mono text-slate-500 tracking-wider">상단 스캔 후解鎖</span>
                      </div>
                    )}
                  </div>
                </div>

                <MasterLoungePanel
                  isMaster={isMaster}
                  isScanComplete={isScanComplete}
                  volatile_price_snipes={volatile_price_snipes}
                  loot_box_raffle_stamp={loot_box_raffle_stamp}
                  raffle_stamp_overlay={raffle_stamp_overlay}
                  onLootBoxRaffleFire={trigger_loot_box_raffle_fire}
                  onCopyMatchSoulTarget={copy_match_soul_target}
                  onEnterDiscordPartyRoom={enter_discord_party_room}
                  flex_card_img_rescue={flex_card_img_rescue}
                />
              </div>
              </div>
              </div>
            )}

            {activeTab === 'gacha' && (
              <div className="flex flex-col items-center justify-center max-w-lg mx-auto bg-slate-900/60 p-6 md:p-8 rounded-3xl border border-slate-800/70 shadow-2xl relative">
                
                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800 text-xs font-mono">
                  <span className="text-slate-400">잔여 코인:</span>
                  <span className="text-yellow-500 font-extrabold">{isMaster ? '무제한 (MASTER)' : `${steamPoints} P`}</span>
                </div>

                <h2 className="text-xl md:text-2xl font-black tracking-wider text-center text-white mb-8 mt-2 uppercase">
                  🕹️ NEON GACHA MACHINE
                </h2>

                <div className="w-full flex justify-center mb-8 relative">
                  <div className={`w-48 h-56 bg-slate-950 rounded-3xl border-4 border-slate-800 flex flex-col justify-between items-center p-4 relative shadow-inner overflow-hidden ${
                    isShaking ? 'animate-gacha-shake border-purple-500/80 shadow-purple-500/30' : 'steam-glow-border border-cyan-500/30'
                  }`}>
                    
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 via-transparent to-slate-950/80 pointer-events-none" />
                    
                    <div className="w-full h-8 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800/80">
                      <span className="text-[10px] font-black text-cyan-400 tracking-widest animate-pulse uppercase">
                        {gachaStatus === 'spinning' ? 'SYSTEM ROTATING...' : 'READY FOR INSERT'}
                      </span>
                    </div>

                    <div className="w-24 h-24 rounded-full border-4 border-dashed border-slate-800/80 flex items-center justify-center relative overflow-hidden bg-slate-950/50">
                      {gachaStatus === 'spinning' ? (
                        <div className="w-16 h-16 rounded-full border-t-4 border-b-4 border-purple-500 animate-spin" />
                      ) : gachaResult ? (
                        <div className="text-center p-1.5 flex flex-col items-center justify-center h-full w-full">
                          <span className="text-[8px] bg-red-600 text-white font-extrabold px-1 rounded animate-pulse mb-1">{gachaResult.rarity}</span>
                          {gachaResult.type === 'avatar' ? (
                            <img src={resync_cosmetic_item(gachaResult)?.url ?? gachaResult.url} onError={flex_card_img_rescue} className="w-10 h-10 object-cover rounded border border-slate-700" alt="" />
                          ) : (
                            <span className="text-lg">🎁</span>
                          )}
                          <span className={`text-[10px] font-black line-clamp-1 truncate w-full ${gachaResult.style}`}>{gachaResult.name}</span>
                        </div>
                      ) : (
                        <span className="text-4xl animate-bounce">🎁</span>
                      )}
                    </div>

                    <div className="w-full h-6 bg-slate-900 rounded-md border border-slate-800 flex justify-around items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping" />
                    </div>
                  </div>

                  <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="w-2.5 h-16 bg-slate-800 rounded-t border-l border-slate-700" />
                    <button 
                      onClick={triggerGachaRoll}
                      disabled={gachaStatus === 'spinning'}
                      className={`w-8 h-8 rounded-full border-2 border-slate-900 shadow-lg cursor-pointer transform active:scale-95 transition-all ${
                        gachaStatus === 'spinning'
                          ? 'bg-slate-700 translate-y-6 shadow-none'
                          : 'bg-gradient-to-b from-red-500 to-red-700 hover:brightness-110 shadow-red-500/30'
                      }`}
                    />
                  </div>
                </div>

                {gachaStatus === 'showingResult' && gachaResult && (
                  <div className="w-full bg-slate-950/80 border border-slate-800/80 p-4 rounded-2xl mb-6 flex flex-col items-center gap-2 animate-fade-in shadow-xl">
                    <span className="text-xs tracking-widest text-slate-500 uppercase font-black">대박! 신규 획득 아이템</span>
                    <div className="text-center flex flex-col items-center gap-1.5">
                      <div className="flex gap-1.5 items-center">
                        <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded font-mono uppercase tracking-widest">{gachaResult.rarity}</span>
                        <span className="text-[10px] bg-cyan-950/30 border border-cyan-800 px-2 py-0.5 rounded font-bold text-cyan-400 font-mono uppercase tracking-widest">{gachaResult.type}</span>
                      </div>
                      {gachaResult.type === 'avatar' && (
                        <img src={resync_cosmetic_item(gachaResult)?.url ?? gachaResult.url} onError={flex_card_img_rescue} className="w-14 h-14 object-cover rounded-xl border-2 border-purple-500 shadow-lg my-1" alt="" />
                      )}
                      <h3 className={`text-lg font-black tracking-wide ${gachaResult.style}`}>
                        {gachaResult.name}
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">인벤토리에 보관되었습니다. 프로필 탭에서 장착하십시오.</p>
                  </div>
                )}

                <button 
                  onClick={triggerGachaRoll}
                  disabled={gachaStatus === 'spinning'}
                  className="w-full py-4 px-6 rounded-2xl font-black text-sm tracking-widest text-white bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 hover:brightness-110 transform active:scale-[0.98] transition-all shadow-xl shadow-purple-950/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {gachaStatus === 'spinning' ? '코즈믹 모듈 로딩 중...' : isMaster ? '코인 무제한으로 뽑기' : '100 COIN 사용하여 뽑기'}
                </button>

                <p className="text-[10px] text-slate-500 text-center mt-3 leading-normal">
                  움직이는 SSR 아바타가 드롭 테이블에 대거 활성화되었습니다!
                </p>
              </div>
            )}

            {activeTab === 'membership' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 flex flex-col justify-between items-center text-center transition-all duration-300 hover:border-slate-700/60 shadow-lg relative overflow-hidden">
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-xs font-black tracking-widest text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-full uppercase">Basic Tier</span>
                    <h3 className="text-2xl font-black text-slate-200">STEAM FREE</h3>
                    <div className="flex items-baseline gap-1 my-3">
                      <span className="text-3xl font-extrabold text-white">0</span>
                      <span className="text-sm text-slate-400">원 / 평생</span>
                    </div>
                    
                    <ul className="text-left text-xs text-slate-400 flex flex-col gap-3 my-4 border-t border-slate-800/80 pt-4 w-full">
                      <li className="flex items-center gap-2">
                        <span className="text-cyan-500">✓</span> 99레벨 기본 프로필 레이아웃
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-cyan-500">✓</span> 초기 자금 500 스팀 코인 제공
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-slate-600">✗</span> 화려한 네온 애니메이션 테두리 비활성화
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-slate-600">✗</span> SSR 등급의 움직이는 아바타 장착 잠금
                      </li>
                    </ul>
                  </div>

                  <div className="w-full text-slate-500 text-xs py-4 font-mono bg-slate-950/20 border border-slate-800/60 rounded-xl">
                    FREE TIER ACTIVE
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-purple-500/40 rounded-3xl p-6 md:p-8 flex flex-col justify-between items-center text-center transition-all duration-300 hover:border-purple-500/80 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-pink-500 to-purple-600 text-white text-[9px] font-black tracking-widest px-3 py-1.5 rounded-bl-lg shadow-md uppercase">
                    Best Choice
                  </div>

                  <div className="flex flex-col items-center gap-3">
                    <span className="text-xs font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 bg-slate-800/80 px-3 py-1.5 rounded-full uppercase font-mono">Premium Access</span>
                    <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">STEAM MASTER</h3>
                    <div className="flex items-baseline gap-1 my-3">
                      <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                        {offeringPackages.length > 0 && offeringPackages[0].product?.price ? offeringPackages[0].product.price.formattedPrice : '4,900'}
                      </span>
                      <span className="text-sm text-slate-400">
                        {offeringPackages.length > 0 && offeringPackages[0].product?.price?.period ? `/ ${offeringPackages[0].product.price.period}` : '/ 월 구독'}
                      </span>
                    </div>
                    
                    <ul className="text-left text-xs text-slate-300 flex flex-col gap-3 my-4 border-t border-slate-800/80 pt-4 w-full">
                      <li className="flex items-center gap-2">
                        <span className="text-purple-400">✓</span> <strong className="shimmer-text">premiumGlowEffect</strong> 네온 테두리 해제
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-purple-400">✓</span> 무한 가챠 코인 공급 (소진 없이 무제한 드로우)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-purple-400">✓</span> SSR 등급의 모든 움직이는 아바타 완벽 장착 지원
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-purple-400">✓</span> 멤버십 전용 하이테크 퍼플 테마 해제
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => triggerPaymentTunnel(offeringPackages[0] ?? null)}
                    disabled={isMaster || paymentTunnelState === 'pending'}
                    className={`w-full py-4 px-6 rounded-xl font-black text-xs tracking-widest text-white transition-all shadow-lg ${
                      isMaster
                        ? 'bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 text-purple-400 shadow-none cursor-not-allowed paymentSuccessFlare'
                        : paymentTunnelState === 'pending'
                          ? 'bg-gradient-to-r from-slate-700 to-slate-800 cursor-wait opacity-70'
                          : 'bg-gradient-to-r from-purple-600 via-pink-600 to-pink-500 hover:brightness-110 shadow-purple-500/20 active:scale-[0.98]'
                    }`}
                  >
                    {isMaster ? '구독 활성화 완료 ✓' : paymentTunnelState === 'pending' ? 'PROCESSING...' : 'MASTER로 구독하기'}
                  </button>

                  {paymentFeedbackSlot && (
                    <div className={`w-full mt-3 p-3 rounded-xl border text-xs font-mono leading-relaxed ${
                      paymentFeedbackSlot.status === 'success'
                        ? 'bg-purple-950/30 border-purple-500/40 text-purple-300'
                        : 'bg-red-950/30 border-red-500/40 text-red-300'
                    }`}>
                      <div className="font-black tracking-widest mb-1">{paymentFeedbackSlot.headline}</div>
                      <div className="text-[10px] opacity-80">{paymentFeedbackSlot.detail}</div>
                      {paymentFeedbackSlot.code && (
                        <div className="text-[9px] opacity-50 mt-1">CODE: {paymentFeedbackSlot.code}</div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}

      </main>

      <HipSlopToast hip_slop_toast={hip_slop_toast} />

      <DopamineImpactModal
        glitch_modal_state={glitch_modal_state}
        dynamic_tier_payload={dynamic_tier_payload}
        soul_nick_probe={soul_nick_probe}
        onSealTierToProfile={seal_tier_to_profile}
      />

      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900/90 rounded-3xl p-6 md:p-8 border border-red-500/30 shadow-2xl text-center flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-red-950/40 border border-red-500/40 flex items-center justify-center text-3xl text-red-500 animate-bounce">
              🔒
            </div>
            
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-black tracking-wider text-red-400 uppercase">MASTER MEMBERSHIP REQUIRED</h3>
              <p className="text-xs text-slate-300 leading-relaxed px-2">
                선택하신 <strong className="text-white">[{modalTargetItem}]</strong> 아이템은 RevenueCat Master 등급 전용 혜택입니다.<br />
                구독을 시작하시고 화려하게 움직이는 한정 프로필을 직접 소유해 보십시오!
              </p>
            </div>

            <div className="flex flex-col gap-2.5 w-full mt-2">
              <button
                onClick={() => triggerPaymentTunnel(offeringPackages[0] ?? null)}
                disabled={paymentTunnelState === 'pending'}
                className={`w-full py-3.5 px-6 rounded-xl font-black text-xs tracking-widest text-white transition-all shadow-lg shadow-purple-500/20 ${
                  paymentTunnelState === 'pending'
                    ? 'bg-gradient-to-r from-slate-700 to-slate-800 cursor-wait opacity-70'
                    : 'bg-gradient-to-r from-purple-600 via-pink-600 to-pink-500 hover:brightness-110 active:scale-[0.98]'
                }`}
              >
                {paymentTunnelState === 'pending' ? 'PROCESSING...' : 'MASTER 등급 구독하기 (₩4,900/월)'}
              </button>

              {paymentFeedbackSlot?.status === 'error' && (
                <div className="w-full p-3 rounded-xl border bg-red-950/30 border-red-500/40 text-red-300 text-xs font-mono">
                  <div className="font-black tracking-widest mb-1">{paymentFeedbackSlot.headline}</div>
                  <div className="text-[10px] opacity-80">{paymentFeedbackSlot.detail}</div>
                  {paymentFeedbackSlot.code && (
                    <div className="text-[9px] opacity-50 mt-1">CODE: {paymentFeedbackSlot.code}</div>
                  )}
                </div>
              )}

              <button
                onClick={() => { setShowUpgradeModal(false); setPaymentFeedbackSlot(null); setPaymentTunnelState('idle') }}
                className="w-full py-3 px-6 rounded-xl font-bold text-xs tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
              >
                나중에 하기
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="w-full max-w-5xl px-6 py-6 border-t border-slate-900/60 bg-slate-950/40 text-center text-xs text-slate-500 font-mono tracking-wider z-20">
        © 2026 STEAM PROFILE CUSTOMIZER. INTEGRATED WITH REVENUECAT WEB SDK.
      </footer>

    </div>
  )
}

export default App
