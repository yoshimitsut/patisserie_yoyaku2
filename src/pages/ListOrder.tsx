import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { Html5QrcodeScanner } from 'html5-qrcode';
import Select from "react-select";

import ExcelExportButton from '../components/ExcelExportButton';

import type { StylesConfig, SingleValue } from 'react-select';
import type { Order } from '../types/types';

import './ListOrder.css';



export default function ListOrder() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedOrder, setScannedOrder] = useState<Order | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<"date" | "order">("order");
  
  const navigate = useNavigate();
  
  const handleSearch = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
  setLoading(true);
  if (handleSearch.current) {
    clearTimeout(handleSearch.current);
  }

  handleSearch.current = setTimeout(() => {
    const searchUrl = search 
      ? `${import.meta.env.VITE_API_URL}/api/list?search=${encodeURIComponent(search)}` 
      : `${import.meta.env.VITE_API_URL}/api/list`;
  
    fetch(searchUrl)
      .then((res) => res.json())
      .then((data) => {
        // 🔑 garante que orders sempre é array
        const normalized = Array.isArray(data) ? data : (data.orders || []);
        setOrders(normalized);
      })
      .catch((error) => {
        console.error('Erro ao carregar pedidos:', error);
      })
      .finally(() => setLoading(false));
  }, 500);

  return () => {
    if (handleSearch.current) {
      clearTimeout(handleSearch.current);
    }
  };
}, [search]);


  // Agora, você não precisa mais do filteredOrders, use apenas 'orders' diretamente
  const groupedOrders = useMemo(() => {
    return orders.reduce((acc, order) => {
      if (!acc[order.date]) acc[order.date] = [];
      acc[order.date].push(order);
      return acc;
    }, {} as Record<string, Order[]>);
  }, [orders]);

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

  // const filteredOrders = useMemo(() => {
  //   const normalizedSeach = search.replace(/\D/g, "");

  //   return orders.filter((o) => {
  //     const idStr = String(o.id_order).padStart(4, "0"); 
  //     const normalizedTel = o.tel.replace(/\D/g, "");
      
  //     return (
  //       idStr.includes(search) ||
  //       o.id_order.toString().includes(search) || 
  //       o.first_name.toLowerCase().includes(search.toLowerCase()) ||
  //       o.last_name.toLowerCase().includes(search.toLowerCase()) ||
  //       normalizedTel.includes(normalizedSeach)
  //     );
  //   });
  // }, [orders, search]);


  // const groupedOrders = useMemo(() => {
  //   return filteredOrders.reduce((acc: Record<string, Order[]>, order) => {
  //     if (!acc[order.date]) acc[order.date] = [];
  //     acc[order.date].push(order);
  //     return acc;
  //   }, {});
  // }, [filteredOrders]);

  // transforma em array e ordena pelas datas
  const sortedGroupedOrders = useMemo(() => {
    return Object.entries(groupedOrders) as [string, Order[]][];
    // return (Object.entries(groupedOrders) as [string, Order[]][]).sort(
    //   ([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime()
    // );
  }, [groupedOrders]);

  const displayOrders: [string, Order[]][] = useMemo(() => {
    if (viewMode === 'date') {
      return sortedGroupedOrders;
    } else {
      return [["注文順", [...orders].sort((a, b) => a.id_order - b.id_order)]];
    }
  }, [viewMode, sortedGroupedOrders, orders]);

  type StatusOption = {
    value: "1" | "2" | "3" | "4";
    label: string;
  };

  const statusOptions: StatusOption[] = [
    { value: "1", label: "未" },
    { value: "2", label: "ネット決済済" },
    { value: "3", label: "店頭支払い済" },
    { value: "4", label: "お渡し済" },
  ];


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
      `(確認)ステータスを変更しますか？\n\n` +
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

  const customStyles: StylesConfig<StatusOption, false> = {
    control: (provided, state) => {
      const selected = state.selectProps.value as StatusOption | null;

      let bgColor = "#000";
      let fontColor = "#FFF";

      if (selected) {
        switch (selected.value) {
          case "1":
            bgColor = "#C40000"; // amarelo
            fontColor = "#FFF";
            break;
          case "2":
            bgColor = "#000DBD"; // verde
            fontColor = "#FFF";
            break;
          case "3":
            bgColor = "#287300"; // vermelho
            fontColor = "#FFF";
            break;
          case "4":
            bgColor = "#6B6B6B"; // vermelho
            fontColor = "#FFF";
            break;
          default:
            bgColor = "#000";
            fontColor = "#FFF";
        }
      }

      return {
        ...provided,
        borderRadius: 8,
        borderColor: "none",
        // boxShadow: state.isFocused ? "0 0 0 2px rgba(0,123,255,0.25)" : "none",
        minHeight: 36,
        backgroundColor: bgColor,
        color: fontColor,
      };
    },
    singleValue: (provided) => {
      // garante fonte branca no texto selecionado
      return {
        ...provided,
        color: "white",
      };
    },
    option: (provided, state) => {
      let bgColor = "white";
      let fontColor = "#FFF";

      switch ((state.data as StatusOption).value) {
        case "1":
          bgColor = state.isFocused ? "#C40000" : "white";
          fontColor = state.isFocused ? "white" : "black";
          break;
        case "2":
          bgColor = state.isFocused ? "#000DBD" : "white";
          fontColor = state.isFocused ? "white" : "black";
          break;
        case "3":
          bgColor = state.isFocused ? "#287300" : "white";
          fontColor = state.isFocused ? "white" : "black";
          break;
        case "4":
          bgColor = state.isFocused ? "#6B6B6B" : "white";
          fontColor = state.isFocused ? "white" : "black";
          break;
      }

      return {
        ...provided,
        backgroundColor: bgColor,
        color: fontColor,
      };
    },
    dropdownIndicator: (provided) => ({
      ...provided,
      padding: "1px",
    }),
  };

  return (
    <div className='list-order-container'>
      <div className="list-order-actions">
        
        <input 
            type="text" 
            placeholder='検索：お名前、電話番号、受付番号などを入力'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='list-order-input'
          />
        
        <div className='btn-actions'>
          <ExcelExportButton data={orders} filename='注文ケーキ.xlsx' sheetName='注文' />
          <button onClick={() => setShowScanner(true)} className='list-btn'>
            <img src="/icons/qrCodeImg.avif" alt="qrcode icon" />
          </button>
          <button onClick={() => navigate("/graphic")} className='list-btn'>
            <img src="/icons/table.avif" alt="graphic icon" />
          </button>
        </div>


      </div>
      
      {showScanner && (
        <div id="reader" style={{ width: '300px', marginBottom: 20 }}></div>
      )}

      {scannedOrder && (
        <div style={{ border: '1px solid #007bff', padding: 12, marginBottom:20 }}>
          <strong>
            <Select
              options={statusOptions}
              value={statusOptions.find((opt) => opt.value === scannedOrder.status)}
              onChange={(selected) =>
                handleStatusChange(
                  scannedOrder.id_order,
                  selected?.value as "1" | "2" | "3" | "4"
                )
              }
              styles={customStyles}
              isSearchable={false}
            />
          </strong>
          <strong>受付番号: </strong> {scannedOrder.id_order}<br />
          <strong>お名前: </strong> {scannedOrder.first_name} {scannedOrder.last_name}<br />
          <strong>電話番号: </strong> {scannedOrder.tel}<br />
          <strong>受取日: </strong> {scannedOrder.date} - {scannedOrder.pickupHour}<br />
          <strong>ご注文のケーキ: </strong> 
          <ul className='cake-list'>
            {scannedOrder.cakes.map((cake, index) => (
              <li key={`${cake.id_cake}-${index}`}>
                <span className='cake-name'>{cake.name}</span>
                <span className='cake-amount'>¥{cake.size}</span>
                <span className='cake-size'>個数: {cake.amount}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {loading ? (
        <p>Loading...</p>  
      ) : orders.length === 0 ? (
        <p>注文が見つかりません。</p>
      ) : (
        <>
          <Select 
          options={[
            { value: "date", label: "受取日順" },  
            { value: "order", label: "受付番号順" }, 
          ]}
          value={
            { value: viewMode, 
              label: viewMode === "date" ? "受取日順" : "受付番号順", 
            }}
          onChange={(opt) => setViewMode(opt?.value as "date" | "order")}
          isSearchable={false}
          styles={{ container: (base) => ({ ...base, wiidth: 200 }) }}
        />
          
          {/* Tabelas (desktop) */}
          {displayOrders.map(([groupTitles, ordersForGroup]: [string, Order[]]) => {
            const totalProdutos = ordersForGroup.reduce(
              (sum, order) => sum + order.cakes.reduce((s, c) => s + c.amount, 0),
              0
            );

            const totalValor = ordersForGroup.reduce(
              (sum, order) =>
                sum +
                order.cakes.reduce((s, c) => s + (c.price) * c.amount, 0),
              0
            );
            return (
            <div key={groupTitles} className="table-wrapper scroll-cell">
              {/* <h3 style={{ background: "#f0f0f0", padding: "8px" }}>{groupTitles}</h3> */}
              
              <table className="list-order-table">
                <thead>
                  <tr>
                    <th className='id-cell'>受付番号</th>
                    <th className='situation-cell'>お会計</th>
                    <th>お名前</th>
                    <th>受取希望日時</th>
                    <th>ご注文のケーキ</th>
                    {/* <th>値段</th> */}
                    <th>個数</th>
                    <th>メッセージ</th>
                    <th>メッセージ</th>
                    <th>電話番号</th>
                    <th>メールアドレス</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersForGroup.map((order) => (
                    <tr key={order.id_order}>
                      <td>{String(order.id_order).padStart(4, "0")}</td>
                      <td className='situation-cell'>
                        <Select<StatusOption, false>
                          options={statusOptions}
                          value={statusOptions.find((opt) => opt.value === order.status)}
                          onChange={(selected: SingleValue<StatusOption>) => {
                            if (selected) handleStatusChange(order.id_order, selected.value);
                          }}
                          styles={customStyles}
                          isSearchable={false}
                        />
                      </td>
                      <td>
                        {order.first_name} {order.last_name}
                      </td>
                      <td>{order.date} {order.pickupHour}</td>
                      <td>
        <ul>
          {order.cakes.map((cake, index) => (
            <li key={`${order.id_order}-${cake.id_cake}-${index}`}>
              {cake.name} 
              {cake.size} - ¥{cake.price}<br />
            </li>
          ))}
        </ul>
      </td>
      <td style={{ textAlign: "center" }}>
        <ul>
          {order.cakes.map((cake, index) => (
            <li key={`${order.id_order}-${cake.id_cake}-${index}`}>
              {cake.amount}
            </li>
          ))}
        </ul>
      </td>
      <td style={{ textAlign: "center" }}>
        <ul>
          {order.cakes.map((cake, index) => (
            <li key={`${order.id_order}-${cake.id_cake}-${index}`}>
              {cake.message_cake}
            </li>
          ))}
        </ul>
      </td>
                      {/* <td>
                        <table className='table-cake' style={{width: "100%"}}>
                          <thead>
                          <tr className='description'>
                            <th>ケーキ名</th>
                            <th>サイズ</th>
                            <th>値段</th>
                            <th>個数</th>
                            <th>メッセージ</th>
                          </tr>
                        </thead>
                          <tbody>

                            {order.cakes.map((cake, index) => (
                              <tr key={`${order.id_order}-${cake.id_cake}-${index}`}>
                                <td>{cake.name}
                                </td>
                                <td>
                                  ¥{cake.price}
                                </td>
                                <td>
                                  {cake.amount}
                                </td>
                                <td>
                                  {cake.size}
                                </td>
                                <td>
                                  {cake.message_cake}
                                </td>
                              </tr>
                            ))}

                          </tbody>
                        </table>
                      </td> */}
                      
                      <td>{order.message || " "}</td>
                      <td>{order.tel}</td>
                      <td>{order.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Totais por dia */}
              <div className="day-summary">
                <strong>合計商品数: </strong> {totalProdutos} 個
                <br />
                <strong>合計金額: </strong> ¥{totalValor.toLocaleString()}
              </div>
            </div>
            );  
        })}
      

          {/* Cards (mobile) */}
          <div className="mobile-orders">
            {orders.map((order) => (
              <div className="order-card" key={order.id_order}>
                <div className="order-header">
                  <span>受付番号: {order.id_order}</span>
                  <span>{order.status}</span>
                </div>
                  <Select
                    options={statusOptions}
                    value={statusOptions.find((opt) => opt.value === order.status)}
                    onChange={(selected) =>
                      handleStatusChange(order.id_order, selected?.value as "1" | "2" | "3" | "4")
                    }
                  />
                <p>お名前: {order.first_name} {order.last_name}</p>
                <p>受取日: {order.date} {order.pickupHour}</p>
                <details>
                  <summary>ご注文内容</summary>
                  <ul>
                    {order.cakes.map((cake, index) => (
                      <li key={`${cake.id_cake}-${index}`}>
                        {cake.name} - 個数: {cake.amount} - {cake.size}
                      </li>
                    ))}
                  </ul>
                  <p>電話番号: {order.tel}</p>
                  <p>メッセージ: {order.message || " "}</p>
                </details>
              </div>
            
            ))}
          </div>
        </>
      )}
    </div>
  );
};