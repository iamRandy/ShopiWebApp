export default function SectionBackground() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_30%,rgba(255,188,66,0.22),transparent_65%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(#d4a574_1px,transparent_1px)] dark:[background-image:radial-gradient(#5a4a38_1px,transparent_1px)] [background-size:20px_20px] [mask-image:linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.2)_14%,rgba(0,0,0,0.75)_38%,rgba(0,0,0,0.9)_50%,rgba(0,0,0,0.75)_62%,rgba(0,0,0,0.2)_86%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.2)_14%,rgba(0,0,0,0.75)_38%,rgba(0,0,0,0.9)_50%,rgba(0,0,0,0.75)_62%,rgba(0,0,0,0.2)_86%,transparent_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 top-1/3 h-48 w-48 rounded-full bg-[#FFBC42]/20 motion-reduce:hidden"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-1/4 h-56 w-56 rounded-full bg-[#FFBC42]/15 motion-reduce:hidden"
        aria-hidden
      />
    </>
  );
}
