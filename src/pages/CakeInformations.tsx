import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import type { Cake } from "../types/types";
import './CakeInformations.css'

const API_URL = import.meta.env.VITE_API_URL;

export default function CakeInformations() {
  const [cakes, setCakes] = useState<Cake[]>([]);

  const [searchParams] = useSearchParams();
  const cakeName = searchParams.get("cake");

  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/api/cake`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Falha ao carregar os dados dos bolos.");
        }
        return res.json();
      })
      .then((data) => {
        setCakes(data.cakes || []);
      })
      .catch((err) => {
        console.error("Erro ao carregar bolos:", err);
      });
  }, []);

  const selectedCake = cakes.find(
    (cake) => cake.name.trim().toLowerCase() === cakeName?.trim().toLowerCase()
  );

  const handleReserve = () => {
    if (!selectedCake) return;
    navigate(`/order?cake=${encodeURIComponent(selectedCake.name.trim())}`);
  };


  if (!selectedCake) {
    return <div></div>;
  }

  return (
    <div className="cake-main" >
      <img
        src={selectedCake.image}
        alt={selectedCake.name}
        style={{ maxWidth: "400px"}}
        />
        <h2 className="cake-name">{selectedCake.name}</h2>
        <p className="cake-description">{selectedCake.description}</p>
      {/* <p><strong>Estoque:</strong> {selectedCake.stock}</p> */}

      <table
        style={{
          margin: "20px auto",
          borderCollapse: "collapse",
          minWidth: "300px",
        }}
      >
        {/* <thead>
          <tr>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Tamanho</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Preço</th>
          </tr>
        </thead> */}
        <tbody>
          {selectedCake.sizes.map((size, index) => (
            <tr key={index}>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {size.size}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                ¥{size.price.toLocaleString("ja-JP")} （税込）
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
          onClick={handleReserve}
          className="reserve-btn"
      >
        予約
      </button>
    </div>
  );
}
