import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import './Hero.css'

const API_URL = import.meta.env.VITE_API_URL;

type Cake = {
  id_cake: number;
  name: string;
  image: string;
  stock: number;
};

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
    navigate(`/cakeinformation?cake=${encodeURIComponent(cake.name)}`);
  };

  return (
    <div className="hero-container">
      {cakes.map((cake) => (
        <div
          key={cake.id_cake}
          className={`cake-card ${cake.stock <= 0 ? "disabled" : ""}`}
          onClick={() => handleClick(cake)}
        >
          <img
            src={cake.image}
            alt={cake.name}
            className="cake-image"
          />
        </div>
      ))}
    </div>
  );
}
