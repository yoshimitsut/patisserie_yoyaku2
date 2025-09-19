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
  const [scannedOrderId, setScannedOrderId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<"date" | "order">("order");
  
  // const cakeLimitOfDay = 0;
  // const limityHours = 0;

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


  // Use o useMemo para encontrar o objeto Order na lista orders
  const foundScannedOrder = useMemo(() => {
    if (scannedOrderId) {
      return orders.find((o) => o.id_order === scannedOrderId);
    }
    return null;
  }, [scannedOrderId, orders]);

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
    const scanner = new Html5QrcodeScanner('reader', { fps: 10, qrbox: 250 }, false);

    scanner.render(
      async (decodedText: string) => {
        setShowScanner(false);
        scanner.clear();
        try {
          const found = orders.find((o) => o.id_order === Number(decodedText));
          if (found) {
            // 🔑 Armazene apenas o ID no estado
            setScannedOrderId(found.id_order);
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
}, [showScanner, orders]);

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
    value: "a" | "b" | "c" | "d" | "e";
    label: string;
  };

  const statusOptions: StatusOption[] = [
    { value: "a", label: "未" },
    { value: "b", label: "ネット決済済" },
    { value: "c", label: "店頭支払い済" },
    { value: "d", label: "お渡し済" },
    { value: "e", label: "キャンセル" },
  ];


  function handleStatusChange(id_order: number, newStatus: "a" | "b" | "c" | "d" | "e") {
    const order = orders.find((o) => o.id_order === id_order);
    if(!order) return;

    const statusMap: Record<string, string> = {
      "a": "未",
      "b": "ネット決済済",
      "c": "店頭支払い済",
      "d": "お渡し済",
      "e": "キャンセル",
    };

    const currentStatus = statusMap[order.status ?? "a"];
    const nextStatus = statusMap[newStatus];

    const confirmed = window.confirm(
      `(確認)ステータスを変更しますか？\n\n` +
      `受付番号: ${String(order.id_order).padStart(4, "0")}\n` +
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
      let fontColor = "#fff";

      if (selected) {
        switch (selected.value) {
          case "a":
            bgColor = "#C40000";
            fontColor = "#FFF";
            break;
          case "b":
            bgColor = "#000DBD"; 
            fontColor = "#FFF";
            break;
          case "c":
            bgColor = "#287300"; 
            fontColor = "#FFF";
            break;
          case "d":
            bgColor = "#6B6B6B"; 
            fontColor = "#FFF";
            break;
          case "e":
            bgColor = "#000";
            fontColor = "#fff";
            break;
          default:
            bgColor = "#fff";
            fontColor = "#000";
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
      let bgColor = "#000";
      let fontColor = "#FFF";

      switch ((state.data as StatusOption).value) {
        case "a":
          bgColor = state.isFocused ? "#C40000" : "white";
          fontColor = state.isFocused ? "white" : "black";
          break;
        case "b":
          bgColor = state.isFocused ? "#000DBD" : "white";
          fontColor = state.isFocused ? "white" : "black";
          break;
        case "c":
          bgColor = state.isFocused ? "#287300" : "white";
          fontColor = state.isFocused ? "white" : "black";
          break;
        case "d":
          bgColor = state.isFocused ? "#6B6B6B" : "white";
          fontColor = state.isFocused ? "white" : "black";
          break;
        case "e":
          bgColor = state.isFocused ? "#000" : "white";
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

      {foundScannedOrder && (
        <div style={{ border: '1px solid #007bff', padding: 12, marginBottom:20 }}>
          <strong>
            <Select
              options={statusOptions}
              value={statusOptions.find((opt) => Number(opt.value) === Number(foundScannedOrder.status))}
              onChange={(selected) =>
                handleStatusChange(
                  foundScannedOrder.id_order,
                  selected?.value as "a" | "b" | "c" | "d" | "e"
                )
              }
              styles={customStyles}
              isSearchable={false}
            />
          </strong>
          <strong>受付番号: </strong> {foundScannedOrder.id_order}<br />
          <strong>お名前: </strong> {foundScannedOrder.first_name} {foundScannedOrder.last_name}<br />
          <strong>電話番号: </strong> {foundScannedOrder.tel}<br />
          <strong>受取日: </strong> {foundScannedOrder.date} - {foundScannedOrder.pickupHour}<br />
          <strong>ご注文のケーキ: </strong> 
          <ul className='cake-list'>
            {foundScannedOrder.cakes.map((cake, index) => (
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
            <div key={groupTitles} className="table-wrapper scroll-cell table-order-container">
              {/* <h3 style={{ background: "#f0f0f0", padding: "8px" }}>{groupTitles}</h3> */}
              
              <table className="list-order-table table-order">
                <thead>
                  <tr>
                    <th className='id-cell'>受付番号</th>
                    <th className='situation-cell'>お会計</th>
                    <th>お名前</th>
                    <th>受取希望日時</th>
                    <th>ご注文のケーキ</th>
                    {/* <th>値段</th> */}
                    <th>個数</th>
                    <th className='message-cell'>メッセージ</th>
                    <th>その他</th>
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
                      <td style={{ textAlign: "left" }}>
                        <ul>
                          {order.cakes.map((cake, index) => (
                            <li key={`${order.id_order}-${cake.id_cake}-${index}`}>
                              {cake.amount}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className='message-cell' style={{ textAlign: "left" }}>
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
                  <span>受付番号: {String(order.id_order).padStart(4, "0")}</span>
                </div>
                  <Select
                    options={statusOptions}
                    value={statusOptions.find((opt) => opt.value === order.status)}
                    onChange={(selected) =>
                      handleStatusChange(order.id_order, selected?.value as "a" | "b" | "c" | "d" | "e")
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