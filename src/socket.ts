import axios from "axios";
import {
  DisconnectReason,
  makeWASocket,
  useMultiFileAuthState,
  WASocket,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  proto,
} from "@whiskeysockets/baileys";
import fs from "fs";
import path from "path";
import { SESSION_DIR, DEFAULT_RECONNECT_INTERVAL } from "./config";
import { Boom } from "@hapi/boom";
import { API_URL_ChatatID } from "./config";

let sock: WASocket;
let qrCode: string | null = null;
const sessionDir = path.resolve(SESSION_DIR);

// Function to delete the session directory
export function deleteSession(): void {
  if (fs.existsSync(sessionDir)) {
    fs.rmSync(sessionDir, { recursive: true, force: true });
    console.log("Session directory deleted.");
  } else {
    console.log("Session directory does not exist.");
  }
}

// Function to connect to WhatsApp
export async function connectToWhatsApp(): Promise<void> {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

  sock = makeWASocket({
    printQRInTerminal: true,
    auth: state,
  });

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log("New QR code received.");
      qrCode = qr;
    }
    if (connection === "close") {
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !==
        DisconnectReason.loggedOut;
      console.log(
        "Connection closed due to",
        lastDisconnect?.error,
        ", reconnecting:",
        shouldReconnect
      );
      if (shouldReconnect) {
        setTimeout(() => connectToWhatsApp(), DEFAULT_RECONNECT_INTERVAL);
      } else {
        qrCode = null;
        deleteSession();
        console.log("Connection logged out, starting a new session...");
        connectToWhatsApp();
      }
    } else if (connection === "open") {
      console.log("Connection opened");
      qrCode = null; // Clear QR code after successful login
    }
  });

  sock.ev.on("creds.update", saveCreds);

  // Listen for incoming messages
  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    if (!msg.key.fromMe && m.type === "notify") {
      // Log the entire message object for debugging
      console.log("Received new message:", JSON.stringify(msg, undefined, 2));

      // The sender's number is in msg.key.remoteJid
      // const senderNumber = msg.key.remoteJid;
      const senderNumber = msg.key.remoteJid?.split("@")[0] || "unknown";

      console.log("Sender Number:", senderNumber);

      // The message content depends on the message type.
      // For a simple text message, it's in msg.message.conversation.
      const messageContent =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        "No text content";
      console.log("Message Content:", messageContent);

      try {
        await axios.post(`${API_URL_ChatatID}/api/messages`, {
          number: senderNumber,
          message: messageContent,
        });
        console.log("Message sent to Next.js API");
      } catch (error) {
        console.error("Error sending message to Next.js API:", error);
      }
    }
  });
}

export const getSocket = (): WASocket => sock;
export const getQRCode = (): string | null => qrCode;
