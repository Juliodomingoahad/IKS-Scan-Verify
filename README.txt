IKS Scan & Verify PWA V2

Perbaikan:
- Secure-context/camera diagnostics: tidak lagi menampilkan error generik.
- Live camera dengan rear camera preference, autofocus/browser constraints, zoom dan torch.
- Realtime DotCode decoding memakai @sythos/js_barcode_universal 1.6.3 (MIT), yang menyediakan encode/decode/detect DotCode.
- Crop area scan + normal/inverted attempts.
- Scan foto.
- Riwayat lokal.
- Verify prefix.
- PWA manifest + service worker.

PENTING:
1. Live camera harus dijalankan dari HTTPS (atau localhost). File manager/content:// bukan jalur yang andal untuk camera permission.
2. Decoder bundle dimuat dari jsDelivr saat pertama kali dibuka, jadi koneksi internet diperlukan untuk memuat decoder. Setelah service worker/cache aktif, aplikasi shell dapat digunakan offline, tetapi decoder CDN hanya akan offline jika browser sudah menyimpannya.
3. Decoder open-source ini adalah implementasi DotCode generik dan tidak menyatakan kompatibilitas dengan sistem proprietary PMI.
4. Pengujian dengan sample Anda harus dilakukan pada marking yang Anda berwenang uji.
