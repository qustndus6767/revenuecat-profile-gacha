function HipSlopToast({ hip_slop_toast }) {
  if (!hip_slop_toast) return null

  const tone_rim =
    hip_slop_toast.tone === 'cyan'
      ? 'border-cyan-400/60 shadow-cyan-500/30'
      : hip_slop_toast.tone === 'purple'
        ? 'border-purple-400/60 shadow-purple-500/30'
        : 'border-pink-400/60 shadow-pink-500/30'

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] px-5 py-3 rounded-2xl bg-slate-950/95 border-2 ${tone_rim} shadow-2xl hip_slop_toast_pop max-w-sm w-[calc(100%-2rem)]`}>
      <p className="text-[10px] font-black tracking-[0.25em] text-pink-400">{hip_slop_toast.headline}</p>
      <p className="text-xs text-slate-200 mt-1 font-mono leading-snug">{hip_slop_toast.detail}</p>
    </div>
  )
}

export default HipSlopToast
