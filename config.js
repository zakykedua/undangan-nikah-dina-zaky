/**
 * ===================================================
 * KONFIGURASI UNDANGAN DIGITAL - ZAKY & DINA
 * Tema: Soft Blue & Pink (Soft Pastel Ocean)
 * ===================================================
 */

const WEDDING_CONFIG = {
  // Informasi Mempelai
  groom: {
    nickname: "Zaky",
    fullName: "Muhammad Zaky Jaluaji",
    parents: "Putra dari Bpk. Muhammad Mashuri & Ibu Rina Nuryanti",
    instagram: "https://instagram.com/zakyjaluaji",
    photo: "assets/images/zaky.jpg",
  },
  bride: {
    nickname: "Dina",
    fullName: "Syanda Malsie Adinawa",
    parents: "Putri dari Bpk. Adi Suroso & Ibu Ernawati",
    instagram: "https://instagram.com/syandamalsiea_",
    photo: "assets/images/dina.jpg",
  },

  // Foto Pasangan & Sampul
  coupleCoverPhoto: "assets/images/couple_cover.jpg",
  coupleFunPhoto: "assets/images/couple_rings.jpg",

  // Opsional: Path video animasi buatan sendiri (misal: "assets/video/underwater-intro.mp4")
  introVideoPath: null,

  // Tanggal Acara Utama untuk Hitung Mundur (Akad Nikah: 20 Maret 2027 07:00:00 WIB)
  weddingDate: "2027-03-20T07:00:00+07:00",

  // Google Drive & Google Sheets Integration (Aktif: Buku Tamu Otomatis, Shared Live Album Feed, & RSVP)
  googleDriveWebhookUrl: "https://script.google.com/macros/s/AKfycbwZDBAmhhwYbNcNKRl4yKeVfkaPySngGZifD4YewDHQIHDVVPzVQkTg9TfW2aYPWDJ8/exec",

  // 1. Detail Acara Akad Nikah (Sabtu, 20 Maret 2027 di Gedung Wanita Nganjuk)
  akad: {
    title: "Akad Nikah",
    date: "Sabtu, 20 Maret 2027",
    time: "Pukul 07.00 WIB",
    venue: "Gedung Wanita Nganjuk",
    address: "Jl. P. Sudirman No. 12, Mangundikaran, Nganjuk",
    mapsUrl: "https://maps.google.com/?q=Gedung+Wanita+Nganjuk"
  },

  // 2. Detail Acara Resepsi Pernikahan (Sabtu, 20 Maret 2027 di Gedung Wanita Nganjuk)
  resepsi: {
    title: "Resepsi Pernikahan",
    date: "Sabtu, 20 Maret 2027",
    time: "Pukul 11.00 - 14.00 WIB",
    venue: "Gedung Wanita Nganjuk",
    address: "Jl. P. Sudirman No. 12, Mangundikaran, Nganjuk",
    mapsUrl: "https://maps.google.com/?q=Gedung+Wanita+Nganjuk"
  },

  // 3. Detail Acara Ngunduh Mantu (Sabtu, 27 Maret 2027 di Pendopo Marsudi Utomo, Klaten)
  ngunduhMantu: {
    title: "Ngunduh Mantu",
    date: "Sabtu, 27 Maret 2027",
    time: "Pukul 10.00 - 14.00 WIB",
    venue: "Pendopo Marsudi Utomo",
    address: "Pedan, Klaten",
    mapsUrl: "https://maps.app.goo.gl/nM2MsdTaEWafZusg7"
  },

  // Perjalanan Cinta (Love Story)
  loveStory: [
    {
      year: "2022",
      title: "Day-1",
      description: "Berawal dari sebuah tugas kuliah zaky membuat film. Zaky yang membutuhkan seorang pemeran perempuan dikenalkan oleh temannya dengan dina. Tak disangka yang awalnya hanya dikenalkan sebagai pemeran film, ternyata dina menjadi satu-satunya perempuan yang menemani zaky sampai jenjang pernikahan."
    },
    {
      year: "12 Juli 2026",
      title: "Hari Pertunangan",
      description: "Mengikat janji suci disaksikan keluarga untuk melangkah ke jenjang pernikahan."
    },
    {
      year: "20 Maret 2027",
      title: "Hari Pernikahan",
      description: "Resmi menjadi sepasang suami dan istri dalam ikatan pernikahan yang suci."
    }
  ],

  // Amplop Digital QRIS Resmi (Semua Bank & E-Wallet)
  qris: {
    merchantName: "MUHAMMAD ZAKY JALUAJI",
    nmid: "ID1026627341005",
    image: "assets/images/qris.jpg"
  },

  // Alamat Kado Fisik
  giftAddress: {
    recipient: "Zaky & Dina",
    phone: "089644456263",
    address: "Perumahan Kurung Indah, No. 35, Kurung, Ceper, Klaten"
  },

  // Audio Latar Belakang (Menggunakan audio dari link YouTube pilihan Zaky)
  audioPath: "assets/audio/wedding-song.m4a"
};
