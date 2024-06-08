import React from 'react'
import { Link, useLocation } from "react-router-dom"
const TabMenu = () => {
    const location = useLocation()
    return (
        <>
            <ul>
                <li><Link to="/bridge/deposit" className={`${location.pathname == "/" ? "active" : location.pathname == "/bridge/deposit" ? "active" : ""}`}>Deposit</Link></li>
                <li><Link to="/withdraw" className={`${location.pathname == "/withdraw" ? "active" : ""}`}>Withdraw</Link></li>
            </ul>
        </>
    )
}

export default TabMenu