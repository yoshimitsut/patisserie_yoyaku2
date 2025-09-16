import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ListOrder from './pages/ListOrder';
import OrderCake from './pages/OrderCake';
import SalesGraphic from './pages/SalesGraphic';
import Check from './pages/Check';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<OrderCake />} />
        <Route path="/list" element={<ListOrder />} />
        <Route path="/graphic" element={<SalesGraphic />} />
        <Route path="/check" element={<Check />} />
      </Routes>
    </Router>
  );
}

export default App;
