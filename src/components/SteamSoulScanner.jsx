const GHOST_LOG_SCRIPTS = [
  '[유저 라이브러리 파싱 중...]',
  '[플레이 타임 Matrix 연산 중...]',
  '[숨겨진 흑역사 게임 탐지 중...]',
  '[겜창 메타 DNA 시퀀싱...]',
  '[스팀 자산 가치 폭주 계산 중...]',
  '[취향 저격 딜 스나이퍼 장전...]'
]

function SteamSoulScanner({
  soul_nick_probe,
  onSoulNickProbe,
  active_scan_trigger,
  onActiveScanTrigger,
  volatile_scan_monitor,
  ghost_log_ticker,
  isScanComplete
}) {
  return (
    <section className="w-full mb-6 rounded-3xl border border-purple-500/40 bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-900 p-5 md:p-6 shadow-2xl shadow-purple-950/40 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,rgba(236,72,153,0.12),transparent_60%)] pointer-events-none" />
      <div className="relative z-10 flex flex-col lg:flex-row gap-5 lg:items-center">
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-[0.3em] text-pink-400 uppercase">SteamSoulScanner</span>
            <span className="text-[8px] font-mono px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300">초고속 스캔 허브</span>
          </div>
          <input
            type="text"
            value={soul_nick_probe}
            onChange={(e) => onSoulNickProbe(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !active_scan_trigger && soul_nick_probe.trim() && onActiveScanTrigger()}
            disabled={active_scan_trigger}
            placeholder="스팀 닉네임만 입력 (예: gabelogannewell)"
            className="w-full bg-slate-950/90 border-2 border-purple-500/30 text-base md:text-lg px-4 py-3.5 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-pink-500 font-bold tracking-wide disabled:opacity-60"
          />
          <button
            type="button"
            onClick={onActiveScanTrigger}
            disabled={active_scan_trigger || !soul_nick_probe.trim()}
            className="w-full lg:w-auto px-8 py-4 rounded-2xl font-black text-sm md:text-base tracking-wider text-white bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-500 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-pink-500/25 transition-all"
          >
            {active_scan_trigger ? '겜생 DNA 추출 중...' : isScanComplete ? '다시 스캔하기' : '내 겜생 등급 스캔하기'}
          </button>
        </div>

        <div className="w-full lg:w-[340px] h-[120px] rounded-2xl bg-slate-950/80 border border-slate-800/80 overflow-hidden relative">
          {volatile_scan_monitor === 'live' ? (
            <>
              <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-slate-950 to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-slate-950 to-transparent z-10 pointer-events-none" />
              <div className="ghost_log_marquee_rail h-full py-2">
                <div className="ghost_log_marquee_track flex flex-col gap-2">
                  {[...ghost_log_ticker, ...ghost_log_ticker].map((log_line, idx) => (
                    <p key={`${log_line}-${idx}`} className="text-[10px] font-mono text-cyan-300/90 px-3 whitespace-nowrap">
                      <span className="text-pink-400 mr-1">▸</span>
                      {log_line}
                    </p>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-2 px-4 text-center">
              {isScanComplete ? (
                <>
                  <span className="text-2xl">✓</span>
                  <p className="text-[10px] font-mono text-emerald-400">등급 확정 · 카드 장착 대기</p>
                </>
              ) : (
                <>
                  <span className="text-2xl opacity-40">◎</span>
                  <p className="text-[10px] font-mono text-slate-500">닉네임 입력 후 1.5초 초고속 분석</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export { SteamSoulScanner, GHOST_LOG_SCRIPTS }
