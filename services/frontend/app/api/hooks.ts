import { useCallback, useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";
import { Game } from "./entities";

const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const useSocket = (joinCode?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [game, setGame] = useState<Game | null>(null);

  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
    });
    console.log("Attempting to connect to:", SOCKET_SERVER_URL);

    newSocket.on("connect", () => {
      console.log("Socket connected successfully");
    });

    newSocket.on("connect_error", (error) => {
      console.log(
        "Socket connection error:",
        error.message,
        error.name,
        error.stack
      );
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to WebSocket");
      if (joinCode) {
        console.log("Sending join code.");
        newSocket.emit("joinGame", joinCode);
      }
    });

    newSocket.on("gameState", (updatedGameState: Game) => {
      console.log("Received updated game state:", updatedGameState);
      setGame(updatedGameState);
    });

    return () => {
      newSocket.close();
    };
  }, [joinCode]);

  const updateGame = useCallback(
    (updatedGame: Game) => {
      if (socket) {
        socket.emit("setGameState", updatedGame);
      }
    },
    [socket]
  );

  const setPlayerState = useCallback(
    (playerName: string, predicted: number[]) => {
      if (socket) {
        socket.emit("setPlayerState", joinCode, playerName, predicted);
      }
    },
    [socket, joinCode]
  );

  const createGame = useCallback(
    (game: Game) => {
      return new Promise<void>((resolve, reject) => {
        if (socket) {
          socket.emit(
            "createGame",
            game,
            (response: { success: boolean; error?: string }) => {
              if (response.success) {
                resolve();
              } else {
                reject(new Error(response.error || "Failed to create game"));
              }
            }
          );
        } else {
          reject(new Error("Socket not connected"));
        }
      });
    },
    [socket]
  );

  const getGame = useCallback(
    (requestedJoinCode: string) => {
      return new Promise<Game>((resolve, reject) => {
        if (socket) {
          socket.emit(
            "getGameState",
            requestedJoinCode,
            (response: Game | null) => {
              if (response) {
                setGame(response);
                resolve(response);
              } else {
                reject(new Error("Game not found"));
              }
            }
          );
        } else {
          reject(new Error("Socket not connected"));
        }
      });
    },
    [socket]
  );

  return { socket, game, updateGame, createGame, getGame, setPlayerState };
};
