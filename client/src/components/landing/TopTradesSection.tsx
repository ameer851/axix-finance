import React from "react";
import "./TopTradesSection.css";
// import { Link } from "react-router-dom"; // Not used, replaced with <a> for wouter compatibility

const trades = [
  { rank: 1, name: "Alfonso B", total: "3,906,390", asset: "EUR/JPY", type: "Pairs", trend: "up" },
  { rank: 2, name: "George C.", total: "3,547,250", asset: "EUR/USD", type: "Sixty Seconds", trend: "down" },
  { rank: 3, name: "John S.", total: "3,218,230", asset: "EUR/USD", type: "Sixty Seconds", trend: "down" },
  { rank: 4, name: "Peter J.", total: "3,000,000", asset: "USD/EUR", type: "Sixty Seconds", trend: "up" },
  { rank: 5, name: "Razvan F.", total: "2,987,410", asset: "AUD/USD", type: "Ladder", trend: "up" },
];

const rankIcon = (rank: number, trend: "up" | "down") => {
  const icons = [
    <span key="gold" role="img" aria-label="gold">🥇</span>,
    <span key="silver" role="img" aria-label="silver">🥈</span>,
    <span key="bronze" role="img" aria-label="bronze">🥉</span>,
    <span key="4">⭐</span>,
    <span key="5">⭐</span>,
  ];
  const trendArrow = trend === "up" ? (
    <span style={{ color: "#00c853", fontWeight: 700 }}>&nbsp;▲</span>
  ) : (
    <span style={{ color: "#d50000", fontWeight: 700 }}>&nbsp;▼</span>
  );
  return <>{icons[rank - 1]}{trendArrow}</>;
};

const TopTradesSection = () => (
  <section className="top-trades-section">
    <h2 className="top-trades-title">This Week’s Top Trades</h2>
    <div className="top-trades-table-wrapper">
      <table className="top-trades-table">
        <thead>
          <tr>
            <th>RANK</th>
            <th>NAME</th>
            <th>TOTAL</th>
            <th>ASSET</th>
            <th>TYPE</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade, idx) => (
            <tr key={trade.rank}>
              <td>{rankIcon(trade.rank, trade.trend as "up" | "down")}</td>
              <td>{trade.name}</td>
              <td>{trade.total} <span style={{ fontSize: 12, color: '#888' }}>▼</span></td>
              <td>{trade.asset}</td>
              <td>{trade.type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="top-trades-action">
      <a href="/register" className="top-trades-btn">
        Become a top trader
      </a>
    </div>
  </section>
);

export default TopTradesSection;
