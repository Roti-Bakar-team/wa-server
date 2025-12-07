# wa-server

Server API WhatsApp menggunakan Baileys dan Express.

## Fitur

- Menghasilkan kode QR untuk menghubungkan ke WhatsApp.
- Mengirim pesan teks ke nomor WhatsApp.
- Menerima pesan dan meneruskannya ke API eksternal.
- Balasan otomatis berdasarkan respons dari API eksternal.
- Menyimpan sesi untuk login otomatis.

## Prasyarat

- [Node.js](https://nodejs.org/) (versi 20.x atau lebih tinggi direkomendasikan)
- NPM atau Yarn

## Instalasi

1.  **Clone repositori ini** (jika belum ada).

2.  **Masuk ke direktori `wa-server`**:
    ```bash
    cd wa-server
    ```

3.  **Install dependensi**:
    ```bash
    npm install
    ```
    atau jika Anda menggunakan Yarn:
    ```bash
    yarn install
    ```

4.  **Konfigurasi Environment**

    Buat file `.env` di root folder `wa-server` dan tambahkan variabel berikut. Anda bisa menyalin dari contoh di bawah ini.

    ```env
    # Port untuk server Express
    APP_PORT=4000

    # URL endpoint API eksternal untuk menangani pesan masuk
    API_URL_CHATATID=http://localhost:3000
    ```

5.  **Build TypeScript**

    Kompilasi kode TypeScript ke JavaScript.
    ```bash
    npm run build
    ```

## Penggunaan

### Menjalankan Server

-   **Untuk development** (dengan auto-reload):
    ```bash
    npm run dev
    ```
-   **Untuk production**:
    ```bash
    npm start
    ```

### Menghubungkan ke WhatsApp

1.  Saat server dijalankan untuk pertama kali, sebuah kode QR akan muncul di terminal.
2.  Buka aplikasi WhatsApp di ponsel Anda.
3.  Buka **Pengaturan** > **Perangkat Tertaut** > **Tautkan Perangkat**.
4.  Pindai kode QR yang ada di terminal.
5.  Setelah berhasil terhubung, server akan menyimpan sesi di folder `auth_info_bailys` dan akan mencoba login otomatis pada saat dijalankan berikutnya. Folder ini sebaiknya tidak dihapus jika Anda ingin tetap login.

### API Endpoints

Server menyediakan beberapa endpoint untuk berinteraksi dengan WhatsApp.

#### 1. `GET /` - Dapatkan Status & Kode QR

Endpoint ini digunakan untuk memeriksa status koneksi dan mendapatkan kode QR jika belum terhubung.

-   **Respons (jika belum terhubung):**
    ```json
    {
      "success": true,
      "qrCode": "2@...==", 
      "connected": false,
      "message": "QR Code retrieved successfully."
    }
    ```
-   **Respons (jika sudah terhubung):**
    ```json
    {
      "success": false,
      "qrCode": null,
      "connected": true,
      "message": "No QR Code available at the moment or already connected."
    }
    ```

#### 2. `POST /send-message` - Kirim Pesan

Endpoint untuk mengirim pesan teks ke nomor WhatsApp.

-   **Body Request:**
    ```json
    {
      "number": "6281234567890", 
      "message": "Halo, ini pesan dari API."
    }
    ```

-   **Respons Sukses:**
    -   Status: `200 OK`
    -   Body: `Message sent successfully.`

-   **Respons Gagal:**
    -   Status: `400 Bad Request` (jika `number` atau `message` tidak ada)
    -   Status: `503 Service Unavailable` (jika client WhatsApp belum siap)
    -   Status: `500 Internal Server Error` (jika terjadi kesalahan lain)

### Penanganan Pesan Masuk

Server ini secara otomatis akan mendengarkan pesan masuk. Ketika pesan baru diterima:
1.  Pesan akan divalidasi untuk memastikan pesan tersebut baru dan bukan dari bot itu sendiri.
2.  Informasi pengirim (`senderNumber`) dan isi pesan (`chatRaw`) akan dikirim melalui permintaan `POST` ke `API_URL_CHATATID/api/messages`.
3.  Server akan menunggu respons dari API tersebut dan mengirimkan kembali isi respons sebagai balasan ke pengirim asli di WhatsApp.

Pastikan endpoint `API_URL_CHATATID` Anda dapat menerima request `POST` dengan body berikut:
```json
{
  "number": "6281234567890",
  "chatRaw": "Isi pesan dari pengguna"
}
```
Dan mengembalikan respons dengan format:
```json
{
  "message": "Ini adalah pesan balasan."
}
```