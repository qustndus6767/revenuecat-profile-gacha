import { phantom_party_roster } from '../lib/master_lounge_vault'

function MasterLoungePanel({
  isMaster,
  isScanComplete,
  volatile_price_snipes,
  loot_box_raffle_stamp,
  raffle_stamp_overlay,
  onLootBoxRaffleFire,
  onCopyMatchSoulTarget,
  onEnterDiscordPartyRoom,
  flex_card_img_rescue
}) {
  return (
    <div className={`relative rounded-2xl border border-purple-500/25 bg-slate-900/70 overflow-hidden transition-all duration-700 ${isMaster ? 'shadow-[0_0_40px_rgba(168,85,247,0.15)]' : 'master-veil-blur'}`}>
      <div className="px-4 py-3 border-b border-purple-500/20 bg-gradient-to-r from-purple-950/80 to-slate-950/80 flex items-center justify-between">
        <h3 className="text-xs font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-400 uppercase">Master Lounge</h3>
        <span className="text-[8px] font-mono text-purple-400/80">SECRET</span>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <div className={`relative rounded-xl border p-3 transition-all overflow-hidden ${isMaster ? 'border-amber-500/40 bg-amber-950/20' : 'border-slate-800 bg-slate-950/50'}`}>
          {raffle_stamp_overlay && (
            <div className="raffle_stamp_overlay absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
              <span className="raffle_success_stamp">SUCCESS</span>
            </div>
          )}
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-[10px] font-bold text-amber-200 leading-snug">이번 주 스팀 1만 원권 기프트카드 래플</span>
            <span className="text-lg">🎫</span>
          </div>
          <p className="text-[9px] text-amber-300/70 font-mono mb-2">MASTER 전용 · 주간 1회 즉시 응모</p>
          <button
            type="button"
            onClick={onLootBoxRaffleFire}
            disabled={!isMaster || !!loot_box_raffle_stamp}
            className={`w-full py-2.5 rounded-lg text-[10px] font-black tracking-wider transition-all ${
              loot_box_raffle_stamp && isMaster
                ? 'bg-slate-800 text-amber-300 border border-amber-500/40 cursor-default'
                : isMaster
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:brightness-110'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            {loot_box_raffle_stamp && isMaster
              ? `응모 완료 (티켓 번호: #${loot_box_raffle_stamp})`
              : '즉시 응모하기'}
          </button>
          {loot_box_raffle_stamp && isMaster && (
            <p className="text-[9px] text-amber-300/80 mt-2 font-mono">raw_ticket_hash locked · 추첨은 매주 금요일 21:00 KST</p>
          )}
        </div>

        <div className={`rounded-xl border p-3 transition-all ${isMaster ? 'border-emerald-500/35 bg-emerald-950/15' : 'border-slate-800 bg-slate-950/50'}`}>
          <p className="text-[10px] font-bold text-emerald-200 mb-2 leading-snug">취향 저격 인디 게임 최저가 스나이퍼</p>
          {!isScanComplete ? (
            <div className="flex flex-col items-center justify-center gap-1 py-6 mb-1 border border-dashed border-slate-800 rounded-lg">
              <span className="text-xl text-slate-700">???</span>
              <span className="text-[9px] text-slate-600 font-mono">취향 저격 딜 대기</span>
            </div>
          ) : volatile_price_snipes.length > 0 ? (
            <div className="flex flex-col gap-2 mb-3 dopamine_payload_reveal">
              {volatile_price_snipes.map((deal_chip) => (
                <div key={deal_chip.id} className="p-2 rounded-lg bg-slate-950/80 border border-emerald-800/30 flex flex-col gap-1">
                  <div className="flex justify-between items-start gap-2">
                    <span className={`text-[11px] font-black text-white ${!isMaster ? 'master-veil-blur deal-sensitive-veil' : ''}`}>
                      {deal_chip.title}
                    </span>
                    <span className={`text-[9px] font-mono text-emerald-400 flex-shrink-0 ${!isMaster ? 'master-veil-blur deal-sensitive-veil' : ''}`}>
                      ₩{deal_chip.current_low_krw.toLocaleString('ko-KR')}
                    </span>
                  </div>
                  <div className="flex justify-between text-[8px] font-mono text-slate-500">
                    <span className={!isMaster ? 'master-veil-blur deal-sensitive-veil' : ''}>정가 ₩{deal_chip.msrp_krw.toLocaleString('ko-KR')}</span>
                    <span className={!isMaster ? 'master-veil-blur deal-sensitive-veil' : ''}>역저 ₩{deal_chip.historic_low_krw.toLocaleString('ko-KR')} · {deal_chip.storefront}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[9px] text-slate-600 font-mono mb-3">상단 Steam 스캔 후 취향 매칭 딜 로드</p>
          )}
        </div>

        <div className={`rounded-xl border p-3 transition-all ${isMaster ? 'border-cyan-500/30 bg-cyan-950/15' : 'border-slate-800 bg-slate-950/50'}`}>
          <div className="flex items-center justify-between gap-2 mb-3">
            <p className="text-[10px] font-bold text-cyan-200 leading-snug">나랑 취향이 98% 일치하는 실시간 접속 게이머</p>
            {isMaster && (
              <span className="flex items-center gap-1 text-[8px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                LIVE
              </span>
            )}
          </div>
          {isMaster ? (
            <div className="flex flex-col gap-3">
              {phantom_party_roster.map((match_soul_target) => (
                <div key={match_soul_target.match_id} className="lounge_phantom_card lounge-phantom-glow rounded-xl bg-slate-950/90 border border-cyan-500/25 p-3 flex flex-col gap-2.5">
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <img
                        src={match_soul_target.avatar_url}
                        alt=""
                        crossOrigin="anonymous"
                        onError={flex_card_img_rescue}
                        className="w-12 h-12 rounded-xl object-cover ring-2 ring-cyan-500/50"
                      />
                      <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[12px] font-black text-white truncate">{match_soul_target.callsign}</span>
                        <span className="text-[8px] font-mono font-black text-pink-400 bg-pink-950/40 px-1.5 py-0.5 rounded border border-pink-500/30">
                          {match_soul_target.vibe_match}% MATCH
                        </span>
                      </div>
                      <p className="text-[9px] text-cyan-300/90 font-bold mt-1">{match_soul_target.genre_main}</p>
                      <p className="text-[8px] text-slate-500 font-mono mt-0.5 truncate">{match_soul_target.online_tag}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => onCopyMatchSoulTarget(match_soul_target)}
                      className="flex-1 py-2 rounded-lg text-[8px] font-black tracking-wide bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/50 transition-all"
                    >
                      스팀 친추 링크 카피
                    </button>
                    <button
                      type="button"
                      onClick={() => onEnterDiscordPartyRoom(match_soul_target)}
                      className="flex-1 py-2 rounded-lg text-[8px] font-black tracking-wide bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:brightness-110 transition-all"
                    >
                      디코드 비공개 파티룸 입장
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center text-[9px] text-slate-600 font-mono">MASTER 해제 시 실시간 매칭</div>
          )}
        </div>
      </div>

      {!isMaster && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/50 backdrop-blur-md pointer-events-none">
          <span className="text-2xl mb-1">🔒</span>
          <span className="text-[10px] font-black tracking-widest text-purple-300 uppercase">Master Lounge</span>
        </div>
      )}
    </div>
  )
}

export default MasterLoungePanel
