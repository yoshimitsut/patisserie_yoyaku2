import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ListOrder from './pages/ListOrder';
import OrderCake from './pages/OrderCake';
import SalesGraphic from './pages/SalesGraphic';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<OrderCake />} />
        <Route path="/list" element={<ListOrder />} />
        <Route path="/graphic" element={<SalesGraphic />} />
      </Routes>
    </Router>
  );
}

export default App;
