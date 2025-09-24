import { Card, Text } from "@shopify/polaris";

export default function OrderData({ orders, type }) {
  let count = orders.length;  
  let total = 0;              
  let currency = "USD";

  orders.forEach(order => {
    let orderTotal = 0;
    order.lineItems.edges.forEach(li => {
      if (li.node.title === "Shipping Protections") {
        const price = parseFloat(li.node.variant.price);
        orderTotal += price * li.node.quantity;
      }
    });
    total += orderTotal;

    currency = order.currencyCode; // use store currency
  });

  const data = { count, total: total.toFixed(2), currency };

  return (
    <div sectioned>
      {type === "count" && <Text variant="heading3xl" as="h2">{data.count}</Text>}
      {type === "total" && (
        <Text variant="heading3xl" as="h2">
          {data.total} {data.currency}
        </Text>
      )}
    </div>
  );
}
