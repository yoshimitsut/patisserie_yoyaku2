import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ListOrder from './pages/ListOrder';
import OrderCake from './pages/OrderCake';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<OrderCake />} />
        <Route path="/list" element={<ListOrder />} />
      </Routes>
    </Router>
  );
}

export default App;
