import React, { createContext, useEffect, useRef, useState, useCallback } from "react";
import { useSnackbar } from "notistack";
import { TYPE_SOCKET_EVENTS } from "@app-constants";
import { getLanguageByKey } from "@utils";
import Cookies from "js-cookie";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { enqueueSnackbar } = useSnackbar();

  const socketRef = useRef(null);
  const [val, setVal] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Отслеживаем JWT токен для управления подключением к сокету
  const [jwtToken, setJwtToken] = useState(() => Cookies.get("jwt"));

  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;
  const reconnectDelay = 10000;

  const pingIntervalRef = useRef(null);
  const pongTimeoutRef = useRef(null);
  const pingInterval = 30000; // Отправляем ping каждые 30 секунд
  const pongTimeout = 10000; // Ожидаем pong 10 секунд

  const onOpenCallbacksRef = useRef(new Set());

  const listenersRef = useRef({});

  const onOpenSubscribe = useCallback((cb) => {
    const set = onOpenCallbacksRef.current;
    set.add(cb);
    return () => set.delete(cb);
  }, []);

  const onEvent = useCallback((type, cb) => {
    if (!type || typeof cb !== "function") return () => { };
    const map = listenersRef.current;
    if (!map[type]) map[type] = new Set();
    map[type].add(cb);
    return () => {
      map[type]?.delete(cb);
    };
  }, []);

  const offEvent = useCallback((type, cb) => {
    listenersRef.current[type]?.delete(cb);
  }, []);

  const emit = useCallback((type, data) => {
    const set = listenersRef.current[type];
    if (!set || set.size === 0) return;
    set.forEach((cb) => {
      try { cb(data); } catch { }
    });
  }, []);

  const safeSend = useCallback((payload) => {
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }, []);

  const sendJSON = useCallback((type, data) => safeSend({ type, data }), [safeSend]);

  const startPingPong = useCallback(() => {
    // Очищаем предыдущие таймеры
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    if (pongTimeoutRef.current) clearTimeout(pongTimeoutRef.current);

    // Отправляем ping каждые 30 секунд
    pingIntervalRef.current = setInterval(() => {
      const sent = safeSend({ type: 'ping' });
      if (sent) {
        // Устанавливаем таймаут на получение pong
        pongTimeoutRef.current = setTimeout(() => {
          // Если pong не получен, закрываем соединение для переподключения
          if (socketRef.current) {
            socketRef.current.close();
          }
        }, pongTimeout);
      }
    }, pingInterval);
  }, [safeSend, pongTimeout, pingInterval]);

  const stopPingPong = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (pongTimeoutRef.current) {
      clearTimeout(pongTimeoutRef.current);
      pongTimeoutRef.current = null;
    }
  }, []);

  const joinTicketRoom = useCallback((ticketId, clientId) => {
    if (!ticketId || !clientId) return;
    sendJSON(TYPE_SOCKET_EVENTS.TICKET_JOIN, { ticket_id: ticketId, client_id: clientId });
  }, [sendJSON]);

  const leaveTicketRoom = useCallback((ticketId, clientId) => {
    if (!ticketId || !clientId) return;
    sendJSON(TYPE_SOCKET_EVENTS.TICKET_LEAVE, { ticket_id: ticketId, client_id: clientId });
  }, [sendJSON]);

  const seenMessages = useCallback((ticketId, userId) => {
    if (!ticketId || !userId) return;
    sendJSON(TYPE_SOCKET_EVENTS.SEEN, { ticket_id: ticketId, sender_id: userId });
  }, [sendJSON]);

  // Отслеживаем изменения JWT токена (проверка каждые 5 сек)
  useEffect(() => {
    const checkToken = () => {
      setJwtToken(Cookies.get("jwt"));
    };
    
    checkToken();
    const interval = setInterval(checkToken, 5000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let socket;
    let reconnectTimer;

    // Не подключаемся если нет JWT токена
    if (!jwtToken) {
      // Закрываем сокет если он был открыт
      if (socketRef.current) {
        socketRef.current.close();
      }
      return;
    }

    const connect = () => {
      // Проверяем наличие токена перед подключением
      const currentToken = Cookies.get("jwt");
      if (!currentToken) {
        // Токен удален, закрываем сокет
        if (socketRef.current) {
          socketRef.current.close();
        }
        return;
      }

      if (reconnectAttempts.current >= maxReconnectAttempts) {
        enqueueSnackbar(getLanguageByKey("socketMaxReconnectReached"), { variant: "warning" });
        return;
      }

      try {
        socket = new WebSocket(import.meta.env.VITE_WS_URL);
      } catch {
        reconnectAttempts.current += 1;
        reconnectTimer = setTimeout(connect, reconnectDelay);
        return;
      }

      socketRef.current = socket;

      socket.onopen = () => {
        reconnectAttempts.current = 0;
        setIsConnected(true);
        enqueueSnackbar(getLanguageByKey("socketConnectionEstablished"), { variant: "success" });
        onOpenCallbacksRef.current.forEach((cb) => { try { cb(); } catch { } });
        startPingPong();
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          
          // Обрабатываем pong сообщение
          if (parsed.type === 'pong') {
            // Очищаем таймаут ожидания pong
            if (pongTimeoutRef.current) {
              clearTimeout(pongTimeoutRef.current);
              pongTimeoutRef.current = null;
            }
            return;
          }
          
          // Обновляем только если это новое сообщение или другой тип события
          setVal(parsed);
          if (parsed?.type) emit(parsed.type, parsed);
        } catch {
        }
      };

      socket.onerror = () => {
        setIsConnected(false);
        enqueueSnackbar(getLanguageByKey("unexpectedSocketErrorDetected"), { variant: "info" });
      };

      socket.onclose = () => {
        setIsConnected(false);
        stopPingPong();
        
        // Проверяем наличие токена перед попыткой переподключения
        const currentToken = Cookies.get("jwt");
        if (!currentToken) {
          // Токен удален, прекращаем попытки переподключения
          return;
        }
        
        reconnectAttempts.current += 1;
        reconnectTimer = setTimeout(connect, reconnectDelay);
      };
    };

    connect();
    return () => {
      stopPingPong();
      try { socket && socket.close(); } catch { }
      clearTimeout(reconnectTimer);
    };
  }, [enqueueSnackbar, emit, startPingPong, stopPingPong, jwtToken]); // Добавляем jwtToken в зависимости

  return (
    <SocketContext.Provider
      value={{
        socketRef,
        sendedValue: val,
        isConnected,
        sendJSON,
        joinTicketRoom,
        leaveTicketRoom,
        onOpenSubscribe,
        seenMessages,
        onEvent,
        offEvent,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
