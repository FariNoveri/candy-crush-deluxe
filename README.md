# Candy Crush Deluxe

Selamat datang di **Candy Crush Deluxe**, sebuah permainan match-3 berbasis web yang penuh warna dan menyenangkan! Dikembangkan oleh **Fari Noveri**, game ini terinspirasi oleh kecintaannya pada **Illyasviel von Einzbern**, karakter ikonik yang membawa semangat manis ke dalam proyek ini. Dengan animasi yang halus, efek visual yang memukau, dan mekanisme permainan yang adiktif, Candy Crush Deluxe siap menghibur Anda dalam petualangan mencocokkan permen yang seru!

## Tentang Game

Candy Crush Deluxe adalah permainan berbasis HTML5 yang mengajak pemain untuk mencocokkan tiga atau lebih permen sejenis secara horizontal atau vertikal untuk mendapatkan poin. Setiap level memiliki target skor yang harus dicapai dalam jumlah langkah terbatas. Fitur seperti animasi jatuh yang dinamis, efek kombo, dan tombol bantuan seperti Hint dan Shuffle membuat permainan ini cocok untuk pemain kasual maupun penggemar game teka-teki.

Proyek ini dibuat dengan cinta oleh **Fari Noveri**, yang menjadikan **Illyasviel von Einzbern** sebagai muse untuk menciptakan pengalaman bermain yang menyenangkan dan penuh semangat.


## New UPDATE 

Kami dengan bangga mengumumkan rilis stabil **v1.0.0** dari **Candy Crush Deluxe**! Rilis ini menghadirkan pengalaman bermain yang lebih mulus, efek suara combo yang memanjakan telinga, dan stabilitas yang ditingkatkan. Berikut adalah sorotan utama:

- **Efek Suara Combo**: Nikmati efek audio dinamis untuk combo (2x, 3x, 4x, dan max) dengan file `combo_2x.mp3`, `combo_3x.mp3`, `combo_4x.mp3`, dan `combo_max.mp3`.
- **Perbaikan Bug**: Mengatasi error `renderGridWithFallingAnimation` dengan menggabungkan metode `renderGrid` untuk animasi jatuh yang lebih halus.
- **Optimalisasi Performa**: Pembersihan partikel untuk mencegah kebocoran memori, meningkatkan performa pada perangkat low-end.
- **Stabilitas**: Batas rekursi pada `processMatches` untuk mencegah loop tak terbatas.
- **Pengalaman Mobile**: Peningkatan event sentuh dengan pemeriksaan batas untuk interaksi yang lebih baik di perangkat mobile.
- **Efek Visual**: Integrasi `screenShake` dan `animateScoreUpdate` untuk feedback visual yang lebih menarik.
- **Aksesibilitas**: Atribut ARIA pada grid dan sel untuk mendukung pengguna dengan kebutuhan khusus.
- **Game Over Modal**: Modal game over kini dibuat secara dinamis untuk keandalan.

Lihat detail lengkap di [Release Notes](https://github.com/FariNoveri/candy-crush-deluxe/releases/).


## Fitur Utama

- **Gameplay Match-3 yang Adiktif**: Cocokkan permen untuk mendapatkan poin dan selesaikan level.
- **Animasi Memukau**: Efek jatuh permen, ledakan saat mencocokkan, dan kombo berantai yang dinamis.
- **Level Beragam**: Tantangan meningkat dengan target skor yang lebih tinggi di setiap level.
- **Antarmuka Responsif**: Kompatibel dengan desktop dan perangkat mobile.
- **Fitur Interaktif**: Tombol Hint untuk saran langkah dan Shuffle untuk mengacak papan.
- **Inspirasi Unik**: Didedikasikan untuk Illyasviel von Einzbern oleh Fari Noveri.

## Cara Bermain

1. Buka game di browser modern (Chrome, Firefox, dll.).
2. Gunakan klik atau seret (drag & drop) untuk menukar posisi permen, mencocokkan tiga atau lebih secara horizontal/vertikal.
3. Capai target skor di setiap level sebelum langkah habis.
4. Manfaatkan tombol Hint untuk saran atau Shuffle untuk mengacak papan saat terjebak.
5. Nikmati efek visual dan kombo untuk skor lebih tinggi!

## Instalasi

Untuk menjalankan game secara lokal:

1. **Klon repositori ini:**
   ```bash
   git clone https://github.com/<username>/candy-crush-deluxe.git
   ```

2. **Masuk ke direktori proyek:**
   ```bash
   cd candy-crush-deluxe
   ```

3. **Buka file `index.html` di browser modern.** Tidak perlu server lokal, tetapi Anda bisa menggunakan `http-server` atau ekstensi seperti Live Server di VS Code untuk pengalaman lebih baik.

## Teknologi yang Digunakan

- **HTML5**: Struktur antarmuka dan elemen permainan.
- **CSS3**: Styling, animasi, dan efek visual (termasuk gradient dan keyframe).
- **JavaScript**: Logika permainan, termasuk mekanisme match-3, drag & drop, dan manajemen level.
- **Google Fonts**: Font Fredoka One dan Poppins untuk tampilan yang menarik.
- **Responsive Design**: Mendukung berbagai ukuran layar dengan media query.

## Kontribusi

Kami menyambut kontribusi untuk meningkatkan Candy Crush Deluxe! Jika Anda ingin berkontribusi:

1. **Fork repositori ini.**
2. **Buat branch baru untuk fitur atau perbaikan:**
   ```bash
   git checkout -b nama-fitur
   ```
3. **Lakukan perubahan dan commit:**
   ```bash
   git commit -m "Menambahkan fitur X"
   ```
4. **Push ke branch Anda:**
   ```bash
   git push origin nama-fitur
   ```
5. **Buka Pull Request di GitHub dan jelaskan perubahan Anda.**

Silakan buka issue untuk melaporkan bug atau menyarankan ide baru.

## Lisensi

Proyek ini dilisensikan di bawah **MIT License**. Anda bebas menggunakan, memodifikasi, dan mendistribusikan kode sesuai ketentuan lisensi.

## Pengembang

Dibuat dengan penuh 💖 oleh **Fari Noveri**, didedikasikan untuk **Illyasviel von Einzbern**, yang menjadi inspirasi di balik proyek ini. Terima kasih telah mencoba Candy Crush Deluxe, dan semoga Anda menikmati permainan ini!

**Kontak:** Jika ada pertanyaan, hubungi Fari Noveri melalui GitHub Issues.
