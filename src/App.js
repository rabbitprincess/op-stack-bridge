import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";
import Deposit from './components/bridge/Deposit';
import Withdraw from './components/bridge/Withdraw';
import WithdrawAccount from "./components/account/WithdrawAccount";
import DepositAccount from "./components/account/DepositAccount";
function App() {
  useEffect(() => {
    document.title = process.env.REACT_APP_L2_NETWORK_NAME + ' Bridge' || 'Unknown Bridge';
  }, []);

  return (
    <>
      <BrowserRouter>
        <Header />
        <div className="main_wrap">
          <Routes>
            <Route path="/" element={<Deposit />} />
            <Route path="/deposit" element={<Deposit />} />
            <Route path="/withdraw" element={<Withdraw />} />
            <Route path="/account/deposit" element={<DepositAccount />} />
            <Route path="/account/withdraw" element={<WithdrawAccount />} />
          </Routes>
        </div>
        <Footer />
      </BrowserRouter>

    </>
  );
}

export default App;
