import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function SalesChart({ orders, start, end }) {
  // Compute data from orders
  const salesByDate = orders.reduce((acc, order) => {
    const date = order.createdAt.slice(0, 10); // yyyy-mm-dd
    const spItem = order.lineItems.edges.find(li => li.node.title.toLowerCase().includes("shipping protection"));
    if (spItem) {
      const amount = parseFloat(spItem.node.variant.price) * spItem.node.quantity;
      acc[date] = (acc[date] || 0) + amount;
    }
    return acc;
  }, {});

  let data = [];
  if (start && end) {
    // Show all dates with sales within the range
    data = Object.entries(salesByDate)
      .map(([date, sales]) => ({ date, sales }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } else {
    data = Object.entries(salesByDate)
      .map(([date, sales]) => ({ date, sales }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={data}
        margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })} />
        <YAxis allowDecimals={true} />
        <Tooltip
          formatter={(value, name, props) => [`€${value}`, "Shipping protection sales"]}
          labelFormatter={(label) => `📅 ${new Date(label).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}`}
          contentStyle={{ backgroundColor: "#7E57C2", color: "#fff", borderRadius: "8px" }}
          itemStyle={{ color: "#fff" }}
        />
        <Legend
          verticalAlign="bottom"
          wrapperStyle={{ paddingTop: "20px" }}
        />
        <Line
          type="monotone"
          dataKey="sales"
          stroke="#CC62C7"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6, fill: "#7E57C2" }}
          name="Shipping protection sales"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
