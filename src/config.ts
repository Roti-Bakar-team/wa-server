import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.APP_PORT || 4000;
export const SESSION_DIR = "auth_info_bailys";
export const DEFAULT_RECONNECT_INTERVAL = 5000;
export const API_URL_ChatatID = process.env.API_URL_CHATATID || "http://localhost:3000";
