function DopamineImpactModal({ glitch_modal_state, dynamic_tier_payload, soul_nick_probe, onSealTierToProfile }) {
  if (!glitch_modal_state || !dynamic_tier_payload) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 dopamine_impact_backdrop">
      <div className="dopamine_impact_modal_shell relative w-full max-w-md">
        <div className="dopamine_impact_neon_ring absolute -inset-[3px] rounded-3xl" />
        <div className="relative bg-slate-950/95 border border-purple-500/40 rounded-3xl p-6 md:p-8 flex flex-col items-center text-center gap-5 dopamine_impact_modal_pop overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(236,72,153,0.15),transparent_70%)] pointer-events-none" />
          <div className="relative z-10 w-full flex flex-col items-center gap-4">
            <p className="text-[10px] font-mono font-black tracking-[0.35em] text-cyan-400 animate-pulse">
              [SCAN SUCCESS: IDENTITY DETECTED]
            </p>
            <div className="w-full border-y border-pink-500/30 py-4">
              <p className="text-[10px] text-slate-500 font-mono mb-2">TARGET · {soul_nick_probe}</p>
              <h2 className={`dopamine_grade_glitch text-4xl md:text-5xl font-black tracking-tight leading-none ${dynamic_tier_payload.flare_class}`}>
                {dynamic_tier_payload.grade_label}
              </h2>
              <p className="mt-3 text-sm font-mono text-fuchsia-300">
                LV.{dynamic_tier_payload.level_stamp}
              </p>
              <p className="mt-2 text-xs text-slate-300 italic max-w-xs mx-auto leading-relaxed">
                &quot;{dynamic_tier_payload.roast_line}&quot;
              </p>
            </div>
            <div className="flex gap-1.5 flex-wrap justify-center">
              {dynamic_tier_payload.tag_chip.map((chip) => (
                <span key={chip} className="text-[8px] font-black px-2 py-0.5 rounded-full border border-cyan-500/40 text-cyan-300 bg-cyan-950/40">
                  {chip}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={onSealTierToProfile}
              className="w-full mt-2 py-4 rounded-2xl font-black text-sm tracking-widest text-slate-950 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-cyan-400 hover:brightness-110 active:scale-[0.98] shadow-lg shadow-pink-500/30 transition-all"
            >
              내 프로필에 카드 장착하기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DopamineImpactModal
