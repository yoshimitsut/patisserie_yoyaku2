import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Html5QrcodeScanner } from 'html5-qrcode';
import './ListOrder.css';

type Cake = {
  id_cake: number;
  name: string;
  quantity: number;
  size: string;
  image: string;
  amount: number;
}

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
  status?:string; 
};



export default function ListOrder() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedOrder, setScannedOrder] = useState<Order | null>(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/list`)
      .then((res) => res.json())
      .then((data) => setOrders(data))
      .catch((error: unknown) => {
        console.error('Erro ao carregar pedidos:', error);
      });
  }, []);

  useEffect(() => {
    if (showScanner) {
      const scanner = new Html5QrcodeScanner('reader', { fps:10, qrbox: 250}, false);

      scanner.render(
        async (decodedText: string) => {
          setShowScanner(false);
          scanner.clear();
          try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/list`);
            const allOrders: Order[] = await res.json();
            const found = allOrders.find((o) => o.id_order === Number(decodedText));
            if (found) {
              setScannedOrder(found);
            } else {
              alert('Pedido não encontrado.');
            }
          } catch (error) {
            console.error('Erro ao buscar pedidos:', error);
          }
        },
        (err) => {
          console.warn('Erro ao ler QR Code:', err);
        }
      );
    }
  }, [showScanner]);

  const filteredOrders = orders.filter(
    (o) => 
      o.first_name.toLowerCase().includes(search.toLowerCase()) ||
      o.last_name.toLowerCase().includes(search.toLowerCase()) ||
      o.id_client.includes(search) || 
      o.tel.includes(search)
  );

  const groupedOrders = filteredOrders.reduce((acc: Record<string,Order[]>, order) => {
    if (!acc[order.date]) {
      acc[order.date] = []
    }
    acc[order.date].push(order);
    return acc;
  }, {});

  // transforma em array e ordena pelas datas
  const sortedGroupedOrders = Object.entries(groupedOrders).sort(
    ([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime()
  );


  function handleStatusChange(id_order: number, newStatus: "1" | "2" | "3" | "4") {
    const order = orders.find((o) => o.id_order === id_order);
    if(!order) return;

    const statusMap: Record<string, string> = {
      "1": "未",
      "2": "ネット決済済",
      "3": "店頭支払い済",
      "4": "お渡し済",
    };

    const currentStatus = statusMap[order.status ?? "1"];
    const nextStatus = statusMap[newStatus];

    const confirmed = window.confirm(
      `本当にステータスを変更しますか？\n\n` +
      `受付番号: ${order.id_order}\n` +
      `お名前: ${order.first_name} ${order.last_name}\n\n` +
      `${currentStatus} → ${nextStatus}`
    );

    if (!confirmed) return;

    setOrders((oldOrder) =>
      oldOrder.map((order) => 
        order.id_order === id_order ? {...order, status: newStatus } : order
      )
    );

    //Atualiza no backend
    fetch(`${import.meta.env.VITE_API_URL}/api/reservar/${id_order}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body:JSON.stringify({ status: newStatus }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Statos atualizado no Servidor:", data);
      })
      .catch((err) => {
        console.log("Erro ao atualizar status", err)
      })
  }

  return (
    <div className='list-order-container'>
      <div>

        <input 
          type="text" 
          placeholder='検索：お名前、電話番号、受付番号などを入力'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='list-order-input'
          />
          <button 
            onClick={() => setShowScanner(true)} 
            className='list-btn'
          >
            <img src="/icons/qrCodeImg.avif" alt="qrcode image" />
          </button>
          <button 
            onClick={() => navigate("/graphic")} 
            className='list-btn'
          >
            <img src="/icons/table.avif" alt="graphic image" />
          </button>
      </div>
    
    {scannedOrder && (
      <div style={{ border: '1px solid #007bff', padding: 12, marginBottom:20 }}>
        <strong></strong><br />
        <strong>受付番号: </strong> {scannedOrder.id_order}<br />
        <strong>お名前: </strong> {scannedOrder.first_name} {scannedOrder.last_name}<br />
        <strong>電話番号: </strong> {scannedOrder.tel}<br />
        <strong>受取日: </strong> {scannedOrder.date} - {scannedOrder.pickupHour}<br />
        <strong>ご注文のケーキ: </strong> 
          <ul>
            {scannedOrder.cakes.map((cake) => (
              <li key={cake.id_cake}>
                {cake.name} - 個数: {cake.amount} - ¥{cake.size}
              </li>
            ))}
          </ul>
      </div>
    )}

    {filteredOrders.length === 0 ? (
      <p>注文が見つかりません。</p>
    ) : (
      sortedGroupedOrders.map(([date, ordersForDate]) => (
        <div key={date} style={{ marginBottom: "2rem" }}>
          <h3 style={{ background: "#f0f0f0", padding: "8px" }}>{date}</h3>

            <table className="list-order-table">
              <thead>
                <tr>
                  <th>受付番号</th>
                  <th>お会計</th>
                  <th>お名前</th>
                  <th>ご注文のケーキ</th>
                  <th>受け取り希望時間</th>
                  <th>メッセージ</th>
                  <th>電話番号</th>
                </tr>
              </thead>
              <tbody>
                {ordersForDate.map((order) => (
                  <tr key={order.id_order}>
                    <td>{order.id_order}</td>
                    <td>
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(order.id_order, e.target.value as "1" | "2" | "3" | "4")
                        }
                      >
                        <option value="1">未</option>
                        <option value="2">ネット決済済</option>
                        <option value="3">店頭支払い済</option>
                        <option value="4">お渡し済</option>
                      </select>
                    </td>
                    <td>
                      {order.first_name} {order.last_name}
                      <br />
                      <small>ID: {order.id_client}</small>
                    </td>
                    <td>
                      <ul>
                        {order.cakes.map((cake, index) => (
                          <li key={`${order.id_order}-${cake.id_cake}-${index}`}>
                            {cake.name} - 個数: {cake.amount} <br /> {cake.size}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td>{order.pickupHour}</td>
                    <td>{order.message || " "}</td>
                    <td>{order.tel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))

      // <table className='list-order-table'>
      //   <thead>
      //     <tr>
      //       <th>受付番号</th>
      //       <th>お会計</th>
      //       <th>お名前</th>
      //       <th>ご注文のケーキ</th>
      //       <th>受け取り希望時間</th>
      //       <th>メッセージ</th>
      //       <th>電話番号</th>
      //     </tr>
      //   </thead>

      //   <tbody>
      //     {filteredOrders.map((order) => (
      //       <tr key={order.id_order}>
      //         <td>{order.id_order}</td>
      //         <td>
      //           <select name="" id=""
      //             value={order.status}
      //             onChange={(e) => handleStatusChange(order.id_order, String(e.target.value) as "1" | "2")}
      //             >
      //               <option value={1}>未</option>
      //               <option value={2}>ネット決済済</option>
      //               <option value={3}>店頭支払い済</option>
      //               <option value={4}>お渡し済</option>
      //           </select>
      //         </td>
      //         <td>
      //           {order.first_name} {order.last_name} <br />
      //           <small> ID: {order.id_client} </small>
      //         </td>
      //         <td>
      //           <ul>
      //             {order.cakes.map((cake, index) => (
      //               <li key={`${order.id_order}-${cake.id_cake}-${index}`}>
      //                 {cake.name} - 個数: {cake.amount} <br /> {cake.size}
      //               </li>
      //             ))}
      //           </ul>
      //         </td>
      //         <td>
      //           {order.date} <br /> 
      //           {order.pickupHour}
      //         </td>
      //         <td>{order.message || ' '}</td>
      //         <td>
      //           {order.tel}
      //         </td>
      //       </tr>
      //     ))}

      //   </tbody>
      // </table>

    )}

    </div>
  );
}

