/**
 * SocketContext — контекст для WebSocket соединения
 * 
 * Отвечает за:
 * - Подключение/отключение WebSocket
 * - Ping/Pong heartbeat
 * - Отправку сообщений
 * - Event-based подписки (onEvent)
 * 
 * Подписывается на authEvents для мгновенного закрытия соединения при logout
 * (без setInterval polling)
 */

import React, { createContext, useEffect, useRef, useState, useCallback, useContext } from "react";
import { useSnackbar } from "notistack";
import { TYPE_SOCKET_EVENTS } from "@app-constants";
import { getLanguageByKey } from "@utils";
import Cookies from "js-cookie";
import { AuthContext, authEvents, AUTH_EVENTS } from "./AuthContext";

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { isAuthenticated } = useContext(AuthContext);

  const socketRef = useRef(null);
  const [val, setVal] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;
  const reconnectDelay = 10000;

  const pingIntervalRef = useRef(null);
  const pongTimeoutRef = useRef(null);
  const pingInterval = 30000;
  const pongTimeout = 10000;

  const onOpenCallbacksRef = useRef(new Set());
  const listenersRef = useRef({});
  
  // Флаг для предотвращения переподключения после logout
  const shouldReconnectRef = useRef(true);

  // === Callbacks для подписки ===
  
  const onOpenSubscribe = useCallback((cb) => {
    const set = onOpenCallbacksRef.current;
    set.add(cb);
    return () => set.delete(cb);
  }, []);

  /**
   * Подписка на события определённого типа
   * Возвращает функцию отписки
   */
  const onEvent = useCallback((type, cb) => {
    if (!type || typeof cb !== "function") return () => {};
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

  /**
   * Emit события всем подписчикам
   */
  const emit = useCallback((type, data) => {
    const set = listenersRef.current[type];
    if (!set || set.size === 0) return;
    set.forEach((cb) => {
      try { cb(data); } catch { /* ignore */ }
    });
  }, []);

  // === Отправка сообщений ===
  
  const safeSend = useCallback((payload) => {
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }, []);

  const sendJSON = useCallback((type, data) => safeSend({ type, data }), [safeSend]);

  // === Ping/Pong heartbeat ===
  
  const startPingPong = useCallback(() => {
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    if (pongTimeoutRef.current) clearTimeout(pongTimeoutRef.current);

    pingIntervalRef.current = setInterval(() => {
      const sent = safeSend({ type: 'ping' });
      if (sent) {
        pongTimeoutRef.current = setTimeout(() => {
          if (socketRef.current) {
            socketRef.current.close();
          }
        }, pongTimeout);
      }
    }, pingInterval);
  }, [safeSend]);

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

  // === Room management ===
  
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

  // === Закрытие соединения ===
  
  const closeSocket = useCallback(() => {
    shouldReconnectRef.current = false;
    stopPingPong();
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsConnected(false);
  }, [stopPingPong]);

  // === Подписка на auth события ===
  // Мгновенно закрываем соединение при logout (без setInterval)
  useEffect(() => {
    const unsubscribe = authEvents.subscribe((event) => {
      if (event === AUTH_EVENTS.LOGOUT) {
        closeSocket();
      } else if (event === AUTH_EVENTS.LOGIN) {
        // При логине разрешаем переподключение
        shouldReconnectRef.current = true;
      }
    });
    return unsubscribe;
  }, [closeSocket]);

  // === Основной useEffect для соединения ===
  useEffect(() => {
    let socket;
    let reconnectTimer;

    // Не подключаемся если не авторизован
    if (!isAuthenticated) {
      closeSocket();
      return;
    }

    // Разрешаем переподключение
    shouldReconnectRef.current = true;

    const connect = () => {
      const currentToken = Cookies.get("jwt");
      if (!currentToken || !shouldReconnectRef.current) {
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
        if (shouldReconnectRef.current) {
          reconnectTimer = setTimeout(connect, reconnectDelay);
        }
        return;
      }

      socketRef.current = socket;

      socket.onopen = () => {
        reconnectAttempts.current = 0;
        setIsConnected(true);
        enqueueSnackbar(getLanguageByKey("socketConnectionEstablished"), { variant: "success" });
        onOpenCallbacksRef.current.forEach((cb) => { try { cb(); } catch { /* ignore */ } });
        startPingPong();
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          
          // Обрабатываем pong
          if (parsed.type === 'pong') {
            if (pongTimeoutRef.current) {
              clearTimeout(pongTimeoutRef.current);
              pongTimeoutRef.current = null;
            }
            return;
          }
          
          // Обновляем state и вызываем подписчиков
          setVal(parsed);
          if (parsed?.type) emit(parsed.type, parsed);
        } catch { /* ignore parse errors */ }
      };

      socket.onerror = () => {
        setIsConnected(false);
        enqueueSnackbar(getLanguageByKey("unexpectedSocketErrorDetected"), { variant: "info" });
      };

      socket.onclose = () => {
        setIsConnected(false);
        stopPingPong();
        
        // Переподключаемся только если разрешено
        if (shouldReconnectRef.current && Cookies.get("jwt")) {
          reconnectAttempts.current += 1;
          reconnectTimer = setTimeout(connect, reconnectDelay);
        }
      };
    };

    connect();

    return () => {
      stopPingPong();
      shouldReconnectRef.current = false;
      try { socket && socket.close(); } catch { /* ignore */ }
      clearTimeout(reconnectTimer);
    };
  }, [isAuthenticated, enqueueSnackbar, emit, startPingPong, stopPingPong, closeSocket]);

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
