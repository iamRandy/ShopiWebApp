import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getProductDisplayName,
  getProductNumericPrice,
  truncateProductName,
} from "../../utils/product";

const BAR_COLORS = [
  "#FFBC42",
  "#2E86AB",
  "#6FB07F",
  "#D7647A",
  "#8E6FB0",
  "#4FA8B0",
  "#E0954F",
  "#7D93C2",
];

export default function PriceComparisonChart({ products }) {
  const data = products.map((product) => ({
    name: getProductDisplayName(product),
    price: getProductNumericPrice(product) ?? 0,
  }));

  return (
    <div className="mt-6 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
      <h2 className="mb-3 text-sm font-bold text-[var(--color-text-primary)]">Price Comparison</h2>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
            tickFormatter={(name) => truncateProductName(name)}
            interval={0}
            angle={-10}
            textAnchor="end"
            height={50}
          />
          <YAxis tickFormatter={(value) => `$${value}`} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value) => [`$${Number(value).toFixed(2)}`, "Price"]}
            contentStyle={{
              background: "#fff",
              border: "1px solid #e7e5e4",
              borderRadius: 8,
            }}
            labelStyle={{ color: "#1a1a1a", fontWeight: 600 }}
            itemStyle={{ color: "#1a1a1a" }}
          />
          <Bar dataKey="price" radius={[6, 6, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
