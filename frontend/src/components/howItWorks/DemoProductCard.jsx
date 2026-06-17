export default function DemoProductCard({
  productName,
  icon: Icon,
  productPrice,
  hostname,
  style,
}) {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-lg border-2 border-black bg-white shadow-[2px_2px_0_#000]"
      style={style}
    >
      <div className="flex h-[58px] items-center justify-center bg-gradient-to-b from-stone-50 to-stone-100">
        <Icon className="h-7 w-7 text-stone-600" strokeWidth={1.75} />
      </div>
      <div className="flex items-center justify-between gap-1 border-t border-stone-100 p-1.5 text-black">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[8px] font-semibold leading-tight">
            {productName}
          </p>
          <p className="truncate text-[7px] text-stone-400">{hostname}</p>
        </div>
        <span className="shrink-0 text-[8px] font-bold">{productPrice}</span>
      </div>
    </div>
  );
}
