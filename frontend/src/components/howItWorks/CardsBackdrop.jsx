export default function CardsBackdrop() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-[-1.25rem] rounded-[2rem] border-2 border-[#FFBC42]/25 bg-gradient-to-br from-white/80 via-[#fff8ee]/90 to-[#ffecd0]/60 shadow-[inset_0_0_80px_rgba(255,188,66,0.14)] sm:inset-[-1.75rem] sm:rounded-[2.5rem] md:inset-[-2rem]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-[-0.5rem] rounded-[1.5rem] bg-[radial-gradient(ellipse_90%_80%_at_50%_50%,rgba(255,188,66,0.1),transparent_70%)] sm:inset-[-0.75rem] sm:rounded-[2rem]"
        aria-hidden
      />
    </>
  );
}
