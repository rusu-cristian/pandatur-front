import { FaSync } from "react-icons/fa";
import "./ConnectionIndicator.css";

/**
 * Connection Indicator Component
 * Shows connection status with socket and provides reconnect button
 */
export const ConnectionIndicator = ({ isConnected }) => {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="connection-status">
      <span
        className={`connection-dot ${isConnected ? "connected" : "disconnected"}`}
        title={isConnected ? "Подключен к сокету" : "Нет подключения"}
      />
      {!isConnected && (
        <button
          onClick={handleReload}
          className="reconnect-btn"
          title="Перезагрузить страницу"
        >
          <FaSync size={12} />
        </button>
      )}
    </div>
  );
};
