import express, { Request, Response } from 'express';
import { PORT } from './config';
import {
  connectToWhatsApp,
  deleteSession,
  getQRCode,
  getSocket,
} from './socket';

const app = express();
app.use(express.json());

// Endpoint to get QR Code if available
app.get('/', (req: Request, res: Response) => {
  const qr = getQRCode();
  if (qr) {
    res.json({ success: true, qrCode: qr });
  } else {
    res.json({
      success: false,
      message: 'No QR Code available at the moment or already connected.',
    });
  }
});

// Endpoint to send a message
app.post('/send-message', async (req: Request, res: Response) => {
  const { number, message } = req.body;
  const sock = getSocket();

  if (!sock) {
    return res.status(503).send('WhatsApp client is not ready.');
  }

  if (!number || !message) {
    return res.status(400).send('Number and message are required.');
  }

  try {
    const waNumber = number.includes('@s.whatsapp.net')
      ? number
      : `${number}@s.whatsapp.net`;
    await sock.sendMessage(waNumber, { text: message });
    res.send('Message sent successfully.');
  } catch (error) {
    console.error('Failed to send message:', error);
    res.status(500).send('Failed to send message: ' + (error as Error).message);
  }
});


// Initialize the app
const startServer = async () => {
  // Delete old session and start a new connection
  deleteSession();
  await connectToWhatsApp();

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

startServer();
