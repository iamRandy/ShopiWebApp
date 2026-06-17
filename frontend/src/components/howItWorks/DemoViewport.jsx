export default function DemoViewport({ children, className = "", heightClass }) {
  const height = heightClass ?? "h-[260px] md:h-[300px]";
  return (
    <div className={`relative overflow-hidden ${height} ${className}`}>
      {children}
    </div>
  );
}
