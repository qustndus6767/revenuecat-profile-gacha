import { useState, useEffect } from 'react'
import { Purchases } from '@revenuecat/purchases-js'

const COSMETIC_POOL = [
  { id: 't_gacha_master', name: 'Master of Gacha', type: 'title', rarity: 'Legendary', style: 'text-yellow-400 font-extrabold uppercase tracking-widest drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]' },
  { id: 't_cyber_cat', name: 'Cyberpunk Cat', type: 'title', rarity: 'Epic', style: 'text-fuchsia-400 font-bold tracking-wide drop-shadow-[0_0_6px_rgba(232,121,249,0.5)]' },
  { id: 't_steam_hermit', name: 'Steam Hermit', type: 'title', rarity: 'Rare', style: 'text-cyan-400 font-medium tracking-normal drop-shadow-[0_0_4px_rgba(34,211,238,0.4)]' },
  { id: 't_code_whisperer', name: 'Code Whisperer', type: 'title', rarity: 'Epic', style: 'text-violet-400 font-bold tracking-wide drop-shadow-[0_0_6px_rgba(167,139,250,0.5)]' },
  { id: 'b_neon_pink', name: 'Hologram Pink Frame', type: 'border', rarity: 'Legendary', style: 'ring-4 ring-pink-500 ring-offset-2 ring-offset-slate-900 animate-pulse' },
  { id: 'b_sapphire_aura', name: 'Sapphire Aura Frame', type: 'border', rarity: 'Epic', style: 'ring-4 ring-blue-500 ring-offset-2 ring-offset-slate-900' },
  { id: 'b_emerald_circuit', name: 'Emerald Circuit Frame', type: 'border', rarity: 'Rare', style: 'ring-4 ring-emerald-500 ring-offset-2 ring-offset-slate-900' },
  { id: 'a_neon_grid', name: 'Retro Neon Grid (Animated)', type: 'avatar', rarity: 'SSR', style: 'ring-4 ring-purple-500 ring-offset-2 ring-offset-slate-900', url: 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExbTZlczhzaW5hNDUybG0wZnFxb2J1NW82czlzOHFhbmtobDJycHhweSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT9IgzoKnwFNmISR8I/giphy.gif' },
  { id: 'a_space_voyager', name: 'Cosmic Voyager (Animated)', type: 'avatar', rarity: 'SSR', style: 'ring-4 ring-pink-500 ring-offset-2 ring-offset-slate-900', url: 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3AwajJnYXZ1ZW5tMXQ4ZW1ydXRjbjZtMGp4ZGN3Znp6ZHptenBrcSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/5t9wJjyHAOxvnIp5Y4/giphy.gif' },
  { id: 'a_cyber_hacker', name: 'Hologram Hacker (Animated)', type: 'avatar', rarity: 'SSR', style: 'ring-4 ring-cyan-500 ring-offset-2 ring-offset-slate-900', url: 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExbzh0N2sycG16cmw1eW9uNHB6M2M5Z295NWJyeDRqZnk0djV3c2c1YiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oz8xALRf3liRfy2CI/giphy.gif' }
]

function usePremiumEnforcer() {
  const [customerInfo, setCustomerInfo] = useState(null)
  const [appUserId, setAppUserId] = useState('')
  const [loading, setLoading] = useState(true)

  const syncRevenueCatState = async () => {
    try {
      if (Purchases.isConfigured()) {
        const purchases = Purchases.getSharedInstance()
        const info = await purchases.getCustomerInfo()
        setCustomerInfo(info)
        setAppUserId(purchases.getAppUserId())
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
      await syncRevenueCatState()
    }
  }

  const isMaster = !!(customerInfo?.entitlements?.active?.['master'] || customerInfo?.entitlements?.all?.['master']?.isActive)

  return {
    customerInfo,
    appUserId,
    loading,
    isMaster,
    syncRevenueCatState,
    activatePurchases,
    logInUser,
    logOutUser
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

  const {
    appUserId,
    loading,
    isMaster,
    syncRevenueCatState,
    activatePurchases,
    logInUser,
    logOutUser
  } = usePremiumEnforcer()

  useEffect(() => {
    const apiKey = import.meta.env.VITE_REVENUECAT_API_KEY
    if (apiKey) {
      const cachedUserId = localStorage.getItem('steam_customizer_user_id') || Purchases.generateRevenueCatAnonymousAppUserId()
      localStorage.setItem('steam_customizer_user_id', cachedUserId)
      activatePurchases(apiKey, cachedUserId)
    }
  }, [])

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
    ? equippedAvatar.url
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

      <main className="w-full max-w-4xl px-4 py-8 flex-grow flex flex-col justify-start z-10">
        
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                
                <div className="md:col-span-2 relative">
                  <div className={premiumGlowEffect}>
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
                            className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        
                        <div className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-950 animate-pulse shadow-md shadow-emerald-500/50" />
                      </div>

                      <div className="flex-1 flex flex-col justify-center md:justify-start text-center md:text-left gap-3 w-full">
                        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 justify-center md:justify-start">
                          <h2 className="text-2xl md:text-3xl font-extrabold tracking-wide text-white drop-shadow-md">
                            CyberCat_404
                          </h2>
                          <span className="text-xs bg-slate-800 border border-slate-700/80 px-2 py-0.5 rounded text-cyan-400 font-mono">
                            LV.99
                          </span>
                        </div>

                        <div className="h-6 flex items-center justify-center md:justify-start">
                          {equippedTitle ? (
                            <span className={`text-sm tracking-wide ${equippedTitle.style}`}>
                              {equippedTitle.name}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-500 italic tracking-wider">칭호 없음</span>
                          )}
                        </div>

                        <p className="text-slate-400 text-xs md:text-sm max-w-md leading-relaxed mt-2 bg-slate-950/40 p-3 rounded-lg border border-slate-800/40">
                          Hello, traveler. I am scanning the blockchain for retro game keys. Operating on fully decentralized Steam algorithms.
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
                                  <img src={item.url} className="w-full h-full object-cover rounded" alt="" />
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
                            <img src={gachaResult.url} className="w-10 h-10 object-cover rounded border border-slate-700" alt="" />
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
                        <img src={gachaResult.url} className="w-14 h-14 object-cover rounded-xl border-2 border-purple-500 shadow-lg my-1" alt="" />
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
