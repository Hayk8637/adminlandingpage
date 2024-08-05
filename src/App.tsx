import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import 'antd/dist/reset.css'; 


function App()  {
  return <>
    <Router>
      <Routes>
        <Route path="/" element={<Login/>} />
        {/* <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} /> */}
        <Route path="/dashboard/*" element={<PrivateRoute element={<Dashboard />} />} />
        <Route path="/*" element={<Login/>} />
      </Routes>
    </Router>
  </>;
}

export default App;
