import './App.module.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ListOrder from './pages/ListOrder';
import OrderCake from './pages/OrderCake';
import SalesGraphic from './pages/SalesGraphic';
import Check from './pages/Check';
import Hero from './pages/Hero';
import CakeInformation from './pages/CakeInformations';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/cakeinformation" element={<CakeInformation />} />
        <Route path="/order" element={<OrderCake />} />
        <Route path="/list" element={<ListOrder />} />
        <Route path="/graphic" element={<SalesGraphic />} />
        <Route path="/order/check" element={<Check />} />
      </Routes>
    </Router>
  );
}

export default App;
