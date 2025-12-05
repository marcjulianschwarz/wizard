import { useCallback, useEffect, useState, useRef } from "react";
import io, { Socket } from "socket.io-client";
import { type Game } from "./entities";

const SOCKET_SERVER_URL = import.meta.env.VITE_BACKEND_URL;

export const useSocket = (joinCode?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const initializeSocket = useCallback(() => {
    if (socketRef.current) {
      return socketRef.current;
    }

    const newSocket = io(SOCKET_SERVER_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
    });

    console.log("Attempting to connect to:", SOCKET_SERVER_URL);

    const handleConnect = () => {
      console.log("Connected to WebSocket");
      setIsConnected(true);

      if (joinCode) {
        console.log("Sending join code.");
        newSocket.emit("joinGame", joinCode);
      }
    };

    const handleConnectError = (error: Error) => {
      console.log(
        "Socket connection error:",
        error.message,
        error.name,
        error.stack,
      );
      setIsConnected(false);
    };

    const handleGameState = (updatedGameState: Game) => {
      console.log("Received updated game state:", updatedGameState);
      setGame(updatedGameState);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    newSocket.on("connect", handleConnect);
    newSocket.on("connect_error", handleConnectError);
    newSocket.on("gameState", handleGameState);
    newSocket.on("disconnect", handleDisconnect);

    socketRef.current = newSocket;
    setSocket(newSocket);
    return newSocket;
  }, [joinCode]);

  const joinGame = useCallback(
    (code: string) => {
      const currentSocket = socketRef.current || initializeSocket();
      if (currentSocket && isConnected) {
        currentSocket.emit("joinGame", code);
      }
    },
    [initializeSocket, isConnected],
  );

  // Only initialize socket once, handle join code changes separately
  useEffect(() => {
    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.close();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, []); // Empty dependency array - socket created once

  // Handle join code changes separately
  useEffect(() => {
    if (joinCode && isConnected) {
      joinGame(joinCode);
    }
  }, [joinCode, isConnected, joinGame]);

  const updateGame = useCallback(
    (updatedGame: Game) => {
      const currentSocket = socketRef.current;
      if (currentSocket && isConnected) {
        currentSocket.emit("setGameState", updatedGame);
      }
    },
    [isConnected],
  );

  const setPlayerState = useCallback(
    (playerName: string, predicted: number[]) => {
      const currentSocket = socketRef.current;
      if (currentSocket && isConnected) {
        currentSocket.emit("setPlayerState", joinCode, playerName, predicted);
      }
    },
    [isConnected, joinCode],
  );

  const createGame = useCallback(
    (gameData: Game): Promise<void> => {
      return new Promise((resolve, reject) => {
        const currentSocket = socketRef.current;
        if (!currentSocket || !isConnected) {
          reject(new Error("Socket not connected"));
          return;
        }

        currentSocket.emit(
          "createGame",
          gameData,
          (response: { success: boolean; error?: string }) => {
            if (response.success) {
              resolve();
            } else {
              reject(new Error(response.error || "Failed to create game"));
            }
          },
        );
      });
    },
    [isConnected],
  );

  const getGame = useCallback(
    (requestedJoinCode: string): Promise<Game> => {
      return new Promise((resolve, reject) => {
        const currentSocket = socketRef.current;
        if (!currentSocket || !isConnected) {
          reject(new Error("Socket not connected"));
          return;
        }

        currentSocket.emit(
          "getGameState",
          requestedJoinCode,
          (response: Game | null) => {
            if (response) {
              setGame(response);
              resolve(response);
            } else {
              reject(new Error("Game not found"));
            }
          },
        );
      });
    },
    [isConnected],
  );

  return {
    socket,
    game,
    isConnected,
    updateGame,
    createGame,
    getGame,
    setPlayerState,
    joinGame,
  };
};
