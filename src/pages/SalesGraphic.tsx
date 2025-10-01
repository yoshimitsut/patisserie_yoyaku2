import { useEffect, useState } from "react";
import "./SalesGraphic.css";
import type { Order, StatusOptionStatus } from "../types/types";

export default function SalesGraphic() {
  const [summary, setSummary] = useState<Record<string, Record<string, Record<string, number>>>>({});
  // const [percentageSummary, setPercentageSummary] = useState<Record<string, Record<string, number>>>({});
  const [dates, setDates] = useState<string[]>([]);
  // const [paymentStatus, setPaymentStatus] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusDayCounts, setStatusDayCounts] = useState<Record<string, Record<string, number>>>({}); 

  const statusOptions: StatusOptionStatus[] = [
    { value: "a", label: "未" },
    { value: "b", label: "ネット決済済" },
    { value: "c", label: "店頭支払い済" },
    { value: "d", label: "お渡し済" },
  ];


  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/list`)
      .then((res) => res.json())
      .then((data: Order[]) => {
        const grouped: Record<string, Record<string, Record<string, number>>> = {};
        // const groupedPercentage: Record<string, Record<string, number>> = {};
        const allDates = new Set<string>();
        const allStatus = new Set<string>();

        const statusCounterByDate: Record<string, Record<string, number>> = {};

        data.forEach((order) => {
          // 🔹 Ignorar pedidos cancelados
          const status = order.status?.toLowerCase();
          if ( status === "e") return;

          // const orderStatus = order.status.toLowerCase();
          // statusCounter[status] = (statusCounter[status] || 0) + 1;
          
          const date = order.date;
          allDates.add(date);
          allStatus.add(status);
          
          //Contatos de status por dia
          if (!statusCounterByDate[date]) statusCounterByDate[date] = {};
          if (!statusCounterByDate[date][status]) statusCounterByDate[date][status] = 0;
          statusCounterByDate[date][status] +=1;
          
          //Info dos Bolos
          order.cakes.forEach((cake) => {
            const name = cake.name.trim();
            const size = cake.size.trim();
            const amount = Number(cake.amount) || 0;

            // const price = Number(cake.price) || 0;

            if (!grouped[name]) grouped[name] = {};
            if (!grouped[name][size]) grouped[name][size] = {};
            if (!grouped[name][size][date]) grouped[name][size][date] = 0;

            grouped[name][size][date] += amount;
          });
        });

        setSummary(grouped);
        setDates([...allDates].sort());
        // setPaymentStatus([...allStatus].sort());
        setStatusDayCounts(statusCounterByDate);
        setLoading(false);
        console.table(statusCounterByDate);
      })
      .catch((error) => {
        console.error("Erro ao carregar pedidos:", error);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Carregando dados...</p>;

  // 🔹 Cálculo do total geral de todos os bolos por dia
  const totalGeralPorDia = dates.reduce((acc: Record<string, number>, date) => {
    let total = 0;
    Object.values(summary).forEach((sizes) => {
      Object.values(sizes).forEach((days) => {
        total += days[date] || 0;
      });
    });
    acc[date] = total;
    return acc;
  }, {});

  // 🔹 Total global (soma de tudo)
  const totalGlobal = Object.values(totalGeralPorDia).reduce((a, b) => a + b, 0);

  return (
    <div className="summary-table-container">


      {/* 🔹 Tabela final com o total geral de todos os bolos */}
      <div className="cake-table-wrapper">
        <h3 className="cake-title">🧾 Total geral de todos os bolos</h3>

        <table className="summary-table total-summary">
          <thead>
            <tr>
              <th>日</th>
              {dates.map((date) => (
                <th key={date}>{date.replace("2025-", "")}</th>
              ))}
              <th>合計 (Total)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="total-row">
              <td></td>
              {dates.map((date) => (
                <td key={date}><strong>{totalGeralPorDia[date] || 0}</strong></td>
              ))}
              <td><strong>{totalGlobal}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="table-title">📊 Produção diária por bolo</h2>

      {/* 🔹 Tabelas individuais por bolo */}
      {Object.entries(summary).map(([cakeName, sizes]) => {
        // Total por dia desse bolo
        const totalPorDia = dates.reduce((acc: Record<string, number>, date) => {
          let total = 0;
          Object.values(sizes).forEach((days) => {
            total += days[date] || 0;
          });
          acc[date] = total;
          return acc;
        }, {});

        const totalGeral = Object.values(totalPorDia).reduce((a, b) => a + b, 0);

        return (
          <div key={cakeName} className="cake-table-wrapper">
            <h3 className="cake-title">{cakeName}</h3>

            <table className="summary-table">
              <thead>
                <tr>
                  <th>サイズ</th>
                  {dates.map((date) => (
                    <th key={date}>{date.replace("2025-", "")}</th>
                  ))}
                  <th>合計</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(sizes).map(([size, days]) => {
                  const total = Object.values(days).reduce((a, b) => a + b, 0);
                  return (
                    <tr key={`${cakeName}-${size}`}>
                      <td>{size}</td>
                      {dates.map((date) => (
                        <td key={date}>{days[date] || 0}</td>
                      ))}
                      <td className="total-cell">{total}</td>
                    </tr>
                  );
                })}

                {/* 🔹 Linha de total diário desse bolo */}
                <tr className="total-row">
                  <td><strong>Total diário →</strong></td>
                  {dates.map((date) => (
                    <td key={date}><strong>{totalPorDia[date] || 0}</strong></td>
                  ))}
                  <td><strong>{totalGeral}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}

      <div className="data-percentage">
        <h3 className="table-title">Situação de pedidos por dia</h3>

        <table className="summary-table total-summary">
          <thead>
            <tr>
              <th></th>
              {dates.map((date) => (
                <th key={date}>{date.replace("2025-", "")}</th>
              ))}
              <th>合計 (Total)</th>
            </tr>
          </thead>
          <tbody>
           {statusOptions.map(({ value, label }) => {
        let totalStatus = 0;

        return (
          <tr key={value}>
            <td>{label}</td>
            {dates.map((date) => {
              const count = statusDayCounts[date]?.[value] || 0;
              totalStatus += count;
              return <td key={`${value}-${date}`}>{count}</td>;
            })}
            <td><strong>{totalStatus}</strong></td>
          </tr>
        );
      })}

      <tr className="total-row">
        <td><strong>合計</strong></td>
        {dates.map((date) => {
          const totalDay = statusOptions.reduce((sum, {value}) => {
            return sum + (statusDayCounts[date]?.[value] || 0);
          }, 0);
          return <td key={`total-${date}`}><strong>{totalDay}</strong></td>
        })}
        <td>
          <strong>
            {
              dates.reduce((sum, date) => {
                return (
                  sum + statusOptions.reduce((subSum, {value}) => {
                    return subSum + (statusDayCounts[date]?.[value] || 0)
                  }, 0)
                );
              }, 0)
            }
          </strong>
        </td>
      </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}
