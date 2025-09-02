import { useEffect, useState } from "react";
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from "recharts";

type Cake = {
  id_cake: number;
  name: string;
  size: string[];
  quantity: number;
  image: string;
  amount: number;
  price?: number; // caso exista
};

type Order = {
  id_order: number;
  id_client: string;
  first_name: string;
  last_name: string;
  email: string;
  tel: string;
  date: string;
  pickupHour: string;
  message: string;
  cakes: Cake[];
  status: string;
};

export default function SalesGraphic() {
  const [, setOrders] = useState<Order[]>([]);
  const [salesData, setSalesData] = useState<{ date: string; total: number }[]>([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/list`)
      .then((res) => res.json())
      .then((data: Order[]) => {
        setOrders(data);

        // Agrupar por data e calcular total
        const salesByDate: { [key: string]: number } = {};

        data.forEach((order) => {
          let totalOrder = 0;
          order.cakes.forEach((cake) => {
            // se não tem "price" no JSON, você pode criar um mapa fixo de preços
            const price = cake.price ?? 4000; 
            totalOrder += price * (cake.amount ?? 1);
          });

          if (!salesByDate[order.date]) {
            salesByDate[order.date] = 0;
          }
          salesByDate[order.date] += totalOrder;
        });

        // Converter para array de objetos { date, total }
        const formattedData = Object.entries(salesByDate).map(([date, total]) => ({
          date,
          total,
        }));

        setSalesData(formattedData);
      })
      .catch((error) => {
        console.error("Erro ao carregar pedidos:", error);
      });
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">📊 売上グラフ</h2>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={salesData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="total" fill="#82ca9d" name="売上 (円)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
