import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import './Hero.css'
import type { Cake } from '../types/types'

const API_URL = import.meta.env.VITE_API_URL;

export default function Hero() {
  const [cakes, setCakes] = useState<Cake[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/api/cake`)
      .then((res) => res.json())
      .then((data) => {
        setCakes(data.cakes || []);
      })
      .catch((err) => console.error("Erro ao carregar bolos:", err));
  }, []);

  const handleClick = (cake: Cake) => {
    if (cake.stock <= 0) return;
    navigate(`/cakeinformation?cake=${encodeURIComponent(cake.name)}`);
  };

  return (
    <div className="hero-main">
    <div className="hero-wrapper">
  <div className="hero-grid">
    {cakes.map((cake, index) => {
      let extraClass = "";
      if (index === 0) extraClass = "big";
      if (index === 1) extraClass = "tall";
      if (index === 2) extraClass = "wide";

      const isDisabled = cake.stock <= 0;

      return (
        <div
          key={cake.id_cake}
          className={`hero-cell ${extraClass} ${isDisabled ? "disabled" : ""}`}
          onClick={() => handleClick(cake)}
          style={{ cursor: isDisabled ? "not-allowed" : "pointer" }}
        >
          <img
            src={cake.image}
            alt={cake.name}
            className="hero-img"
          />
          {isDisabled && <div className="overlay">完売</div>}
        </div>
      );
    })}
  </div>
</div>
</div>

  );
}
