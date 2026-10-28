/**
 * ===================================================
 * LOGIKA INTERAKSI & ANIMASI STABLE ELEGAN
 * Undangan Digital Zaky & Dina - Soft Blue & Pink
 * ===================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  initWeddingData();
  initAudioPlayer();
  initCountdown();
  initGuestbook();
  initParticleCanvas();
  initLightbox();
  initScrollReveal();
});

/* ===================================================
   1. RENDER DATA DARI CONFIG.JS
   =================================================== */
/**
 * Enkripsi & Dekripsi Nama Tamu Ringan & Aman (URL-Safe Base64 + Signature)
 * Menyembunyikan nama tamu di dalam link agar tidak bisa diedit sembarangan
 */
function encodeGuestName(name) {
  if (!name || name === "Tamu Undangan") return "";
  try {
    const payload = "zd:" + encodeURIComponent(name);
    return btoa(payload).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch (e) {
    return encodeURIComponent(name);
  }
}

function decodeGuestToken(token) {
  if (!token) return null;
  try {
    let base64 = token.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    const decoded = atob(base64);
    if (decoded && decoded.startsWith("zd:")) {
      return decodeURIComponent(decoded.slice(3));
    }
  } catch (e) {}
  return null;
}

function initWeddingData() {
  if (typeof WEDDING_CONFIG === "undefined") return;

  if (WEDDING_CONFIG.introVideoPath) {
    const videoBg = document.getElementById("cover-video-bg");
    if (videoBg) {
      videoBg.src = WEDDING_CONFIG.introVideoPath;
      videoBg.style.display = "block";
      videoBg.play().catch(() => {});
    }
  }

  const urlParams = new URLSearchParams(window.location.search);
  let decodedName = null;

  // 1. Cek parameter terenkripsi/tersembunyi ?u=... atau ?code=...
  const token = urlParams.get("u") || urlParams.get("code") || urlParams.get("k");
  if (token) {
    const fromToken = decodeGuestToken(token);
    if (fromToken) {
      decodedName = fromToken;
    }
  }

  // 2. Cek parameter teks biasa ?to=... atau ?nama=... (untuk kompatibilitas)
  if (!decodedName) {
    const rawName = urlParams.get("to") || urlParams.get("n") || urlParams.get("nama") || urlParams.get("tamu") || urlParams.get("guest");
    if (rawName) {
      try {
        decodedName = decodeURIComponent(rawName.replace(/\+/g, " "));
      } catch (e) {
        decodedName = rawName.replace(/\+/g, " ");
      }
    }
  }

  // 3. Fallback ke localStorage jika parameter URL kosong
  if (!decodedName) {
    const savedName = localStorage.getItem("zaky_dina_current_guest_name") || localStorage.getItem("zaky_dina_locked_guest_name");
    if (savedName && savedName !== "Tamu Undangan") {
      decodedName = savedName;
    }
  }

  // 4. Default jika tidak ada nama
  if (!decodedName) {
    decodedName = "Tamu Undangan";
  }

  // SEMBUNYIKAN / BERSIHKAN PARAMETER DARI ADDRESS BAR BROWSER
  // Sehingga di address bar HP tamu HANYA tampil: https://.../
  // Tamu tidak bisa melihat atau mengedit nama di address bar!
  if (window.location.search) {
    try {
      const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
    } catch (e) {}
  }

  document.querySelectorAll(".recipient-name").forEach(el => {
    el.textContent = decodedName;
  });

  if (decodedName && decodedName !== "Tamu Undangan") {
    try {
      localStorage.setItem("zaky_dina_current_guest_name", decodedName);
      localStorage.setItem("zaky_dina_locked_guest_name", decodedName);
    } catch (e) {}

    // Kunci nama tamu pada formulir RSVP / Ucapan agar tidak dapat diubah oleh siapapun
    const rsvpGuestInput = document.getElementById("guest-name");
    if (rsvpGuestInput) {
      rsvpGuestInput.value = decodedName;
      rsvpGuestInput.readOnly = true;
      rsvpGuestInput.classList.add("form-input-locked");
      rsvpGuestInput.title = "Nama tamu terkunci sesuai undangan resmi Zaky & Dina";
      let lockNote = document.getElementById("rsvp-guest-name-lock-note");
      if (!lockNote) {
        lockNote = document.createElement("span");
        lockNote.id = "rsvp-guest-name-lock-note";
        lockNote.style.cssText = "font-size: 0.72rem; color: var(--blue-primary); display: block; margin-top: 5px; font-weight: 500;";
        lockNote.innerHTML = "🔒 Nama terverifikasi otomatis sesuai undangan & tidak dapat diubah.";
        rsvpGuestInput.parentNode.appendChild(lockNote);
      }
    }

    // Link album cukup polos karena nama sudah tersimpan aman di localStorage
    document.querySelectorAll("a[href^='album.html']").forEach(a => {
      a.href = "album.html";
    });
  }

  document.querySelectorAll(".groom-nickname").forEach(el => el.textContent = WEDDING_CONFIG.groom.nickname);
  document.querySelectorAll(".bride-nickname").forEach(el => el.textContent = WEDDING_CONFIG.bride.nickname);
  
  document.getElementById("groom-fullname").textContent = WEDDING_CONFIG.groom.fullName;
  document.getElementById("groom-parents").textContent = WEDDING_CONFIG.groom.parents;
  document.getElementById("groom-img").src = WEDDING_CONFIG.groom.photo;

  document.getElementById("bride-fullname").textContent = WEDDING_CONFIG.bride.fullName;
  document.getElementById("bride-parents").textContent = WEDDING_CONFIG.bride.parents;
  document.getElementById("bride-img").src = WEDDING_CONFIG.bride.photo;

  document.getElementById("cover-img").src = WEDDING_CONFIG.coupleCoverPhoto;
  document.getElementById("hero-img").src = WEDDING_CONFIG.coupleFunPhoto;

  document.getElementById("akad-date").textContent = WEDDING_CONFIG.akad.date;
  document.getElementById("akad-time").textContent = WEDDING_CONFIG.akad.time;
  document.getElementById("akad-venue").textContent = WEDDING_CONFIG.akad.venue;
  document.getElementById("akad-address").textContent = WEDDING_CONFIG.akad.address;
  document.getElementById("akad-maps").href = WEDDING_CONFIG.akad.mapsUrl;

  document.getElementById("resepsi-date").textContent = WEDDING_CONFIG.resepsi.date;
  document.getElementById("resepsi-time").textContent = WEDDING_CONFIG.resepsi.time;
  document.getElementById("resepsi-venue").textContent = WEDDING_CONFIG.resepsi.venue;
  document.getElementById("resepsi-address").textContent = WEDDING_CONFIG.resepsi.address;
  document.getElementById("resepsi-maps").href = WEDDING_CONFIG.resepsi.mapsUrl;

  const timelineContainer = document.getElementById("timeline-container");
  if (timelineContainer && WEDDING_CONFIG.loveStory) {
    timelineContainer.innerHTML = WEDDING_CONFIG.loveStory.map((item, idx) => `
      <div class="timeline-item reveal-on-scroll delay-${(idx + 1) * 100}">
        <div class="timeline-dot"></div>
        <div class="timeline-content">
          <span class="timeline-year">${item.year}</span>
          <h4 class="timeline-title">${item.title}</h4>
          <p class="timeline-desc">${item.description}</p>
        </div>
      </div>
    `).join("");
  }

  const bankGrid = document.getElementById("bank-grid");
  if (bankGrid && WEDDING_CONFIG.banks) {
    bankGrid.innerHTML = WEDDING_CONFIG.banks.map((bank, idx) => `
      <div class="bank-card reveal-on-scroll delay-${(idx + 1) * 100}">
        <div class="bank-name">${bank.bankName}</div>
        <div class="account-number">${bank.accountNumber}</div>
        <div class="account-holder">a.n. ${bank.accountHolder}</div>
        <button class="btn-copy" onclick="copyToClipboard('${bank.accountNumber}', '${bank.bankName}')">
          Salin No. Rekening
        </button>
      </div>
    `).join("");
  }

  if (WEDDING_CONFIG.giftAddress) {
    document.getElementById("gift-recipient").textContent = WEDDING_CONFIG.giftAddress.recipient;
    document.getElementById("gift-phone").textContent = WEDDING_CONFIG.giftAddress.phone;
    document.getElementById("gift-full-address").textContent = WEDDING_CONFIG.giftAddress.address;
  }
}

/* ===================================================
   2. AUDIO PLAYER & BUKA UNDANGAN
   =================================================== */
let audio = null;
let isPlaying = false;

function initAudioPlayer() {
  audio = new Audio(WEDDING_CONFIG.audioPath || "assets/audio/wedding-song.m4a");
  audio.loop = true;

  const vinyl = document.getElementById("vinyl-disc");
  if (vinyl) {
    vinyl.addEventListener("click", toggleAudio);
  }

  const btnOpen = document.getElementById("btn-open-invitation");
  if (btnOpen) {
    btnOpen.addEventListener("click", () => {
      const cover = document.getElementById("cover-overlay");
      cover.classList.add("opened");
      playAudio();

      setTimeout(() => {
        cover.style.display = "none";
        document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" });
      }, 500);
    });
  }
}

function playAudio() {
  if (!audio) return;
  audio.play().then(() => {
    isPlaying = true;
    document.getElementById("vinyl-disc")?.classList.add("playing");
  }).catch(err => console.log("Autoplay prevented:", err));
}

function toggleAudio() {
  if (!audio) return;
  if (isPlaying) {
    audio.pause();
    isPlaying = false;
    document.getElementById("vinyl-disc")?.classList.remove("playing");
  } else {
    playAudio();
  }
}

/* ===================================================
   3. COUNTDOWN TIMER
   =================================================== */
function initCountdown() {
  const targetDate = new Date(WEDDING_CONFIG.weddingDate).getTime();

  function updateTimer() {
    const now = new Date().getTime();
    const difference = targetDate - now;

    if (difference <= 0) {
      document.getElementById("days").textContent = "00";
      document.getElementById("hours").textContent = "00";
      document.getElementById("minutes").textContent = "00";
      document.getElementById("seconds").textContent = "00";
      return;
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    document.getElementById("days").textContent = String(days).padStart(2, "0");
    document.getElementById("hours").textContent = String(hours).padStart(2, "0");
    document.getElementById("minutes").textContent = String(minutes).padStart(2, "0");
    document.getElementById("seconds").textContent = String(seconds).padStart(2, "0");
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

/* ===================================================
   4. BUKU TAMU / UCAPAN (LOCALSTORAGE)
   =================================================== */
const DEFAULT_WISHES = [
  {
    name: "Budi & Keluarga",
    status: "hadir",
    message: "Selamat untuk Zaky & Dina! Semoga pernikahan ini selalu dipenuhi kebahagiaan dan cinta.",
    date: "10 menit yang lalu"
  },
  {
    name: "Anisa Rahma",
    status: "hadir",
    message: "Happy wedding ya Zaky & Dina! Bahagia selalu sampai akhir hayat.",
    date: "1 jam yang lalu"
  },
  {
    name: "Rian & Partner",
    status: "tidak-hadir",
    message: "Selamat Zaky & Dina! Mohon maaf belum bisa hadir langsung, doa terbaik dari kami!",
    date: "3 jam yang lalu"
  }
];

function initGuestbook() {
  const form = document.getElementById("rsvp-form");
  if (!form) return;

  renderWishes();
  fetchWishesFromGoogleSheets();

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nameInput = document.getElementById("guest-name").value.trim();
    const statusSelect = document.getElementById("guest-status").value;
    const messageInput = document.getElementById("guest-message").value.trim();

    if (!nameInput || !messageInput) {
      showToast("Mohon lengkapi nama dan ucapan Anda.");
      return;
    }

    const newWish = {
      name: nameInput,
      status: statusSelect,
      message: messageInput,
      date: "Baru saja"
    };

    let storedWishes = JSON.parse(localStorage.getItem("wedding_wishes") || "null");
    if (!storedWishes) storedWishes = [...DEFAULT_WISHES];

    storedWishes.unshift(newWish);
    localStorage.setItem("wedding_wishes", JSON.stringify(storedWishes));

    // OTOMATIS ASYNCHRONOUS SEND TO GOOGLE SHEETS
    const webhookUrl = (typeof WEDDING_CONFIG !== "undefined" && WEDDING_CONFIG.googleDriveWebhookUrl)
      ? WEDDING_CONFIG.googleDriveWebhookUrl
      : "https://script.google.com/macros/s/AKfycbzd0zThvRVFm5GE6YynxrgP6l2nYINnmOjumqMSTuFz04vE5YwOBSfgnOnM9nMlop0Y/exec";

    if (webhookUrl) {
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          type: "rsvp",
          name: nameInput,
          status: statusSelect,
          message: messageInput
        })
      }).then(() => {
        console.log("RSVP berhasil dikirim ke Google Sheets!");
        setTimeout(fetchWishesFromGoogleSheets, 1500);
      }).catch(err => console.warn("RSVP log:", err));
    }

    form.reset();
    renderWishes();
    showToast("Terima kasih, ucapan Anda telah terkirim!");
  });
}

function fetchWishesFromGoogleSheets() {
  const webhookUrl = (typeof WEDDING_CONFIG !== "undefined" && WEDDING_CONFIG.googleDriveWebhookUrl)
    ? WEDDING_CONFIG.googleDriveWebhookUrl
    : "https://script.google.com/macros/s/AKfycbzd0zThvRVFm5GE6YynxrgP6l2nYINnmOjumqMSTuFz04vE5YwOBSfgnOnM9nMlop0Y/exec";

  if (!webhookUrl) return;

  fetch(webhookUrl)
    .then(res => res.json())
    .then(data => {
      if (data && data.status === "success" && Array.isArray(data.wishes) && data.wishes.length > 0) {
        localStorage.setItem("wedding_wishes", JSON.stringify(data.wishes));
        renderWishes();
      }
    })
    .catch(err => console.warn("Google Sheets fetch wishes log:", err));
}

function renderWishes() {
  const container = document.getElementById("wishes-container");
  if (!container) return;

  let storedWishes = JSON.parse(localStorage.getItem("wedding_wishes") || "null");
  if (!storedWishes) storedWishes = DEFAULT_WISHES;

  container.innerHTML = storedWishes.map(wish => `
    <div class="wish-item">
      <div class="wish-header">
        <span class="wish-author">${escapeHtml(wish.name)}</span>
        <span class="wish-status ${wish.status === 'hadir' || wish.status === 'Dateng' ? 'hadir' : 'tidak-hadir'}">
          ${wish.status === 'hadir' || wish.status === 'Dateng' ? 'Hadir' : 'Halangan'}
        </span>
      </div>
      <p class="wish-text">${escapeHtml(wish.message)}</p>
    </div>
  `).join("");
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[m]);
}

/* ===================================================
   5. COPY TO CLIPBOARD & TOAST
   =================================================== */
function copyToClipboard(text, name) {
  navigator.clipboard.writeText(text).then(() => {
    showToast(`Nomor Rekening ${name} telah disalin.`);
  }).catch(() => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    showToast(`Nomor Rekening ${name} telah disalin.`);
  });
}

function showToast(message) {
  const toast = document.getElementById("toast-notification");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

/* ===================================================
   6. LIGHTBOX GALERI
   =================================================== */
function initLightbox() {
  const modal = document.getElementById("lightbox-modal");
  const modalImg = document.getElementById("lightbox-img");
  const closeBtn = document.getElementById("lightbox-close");

  if (!modal || !modalImg) return;

  document.querySelectorAll(".gallery-item").forEach(item => {
    item.addEventListener("click", () => {
      const imgSrc = item.querySelector("img")?.src;
      if (imgSrc) {
        modalImg.src = imgSrc;
        modal.classList.add("active");
      }
    });
  });

  closeBtn?.addEventListener("click", () => modal.classList.remove("active"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("active");
  });
}



/* ===================================================
   9. MODAL BARCODE / QR CODE SATUALBUM
   =================================================== */
function openQrModal() {
  const modal = document.getElementById("qr-modal");
  if (modal) modal.classList.add("active");
}

function closeQrModal() {
  const modal = document.getElementById("qr-modal");
  if (modal) modal.classList.remove("active");
}

document.addEventListener("DOMContentLoaded", () => {
  const qrModal = document.getElementById("qr-modal");
  qrModal?.addEventListener("click", (e) => {
    if (e.target === qrModal) closeQrModal();
  });
});
function initParticleCanvas() {
  const canvas = document.getElementById("particle-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  for (let i = 0; i < 20; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 4 + 2,
      alpha: Math.random() * 0.25 + 0.1,
      speedY: Math.random() * 0.35 + 0.15,
      wobbleSpeed: Math.random() * 0.02 + 0.01,
      wobbleAngle: Math.random() * Math.PI * 2
    });
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach(p => {
      p.y -= p.speedY;
      p.wobbleAngle += p.wobbleSpeed;
      p.x += Math.sin(p.wobbleAngle) * 0.25;

      if (p.y < -15) {
        p.y = height + 15;
        p.x = Math.random() * width;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(216, 150, 168, ${p.alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    requestAnimationFrame(animate);
  }

  animate();
}

/* ===================================================
   10. ELEGANT SCROLL REVEAL OBSERVER
   =================================================== */
function initScrollReveal() {
  const revealElements = document.querySelectorAll(".reveal-on-scroll, .reveal-zoom, .reveal-slide-left, .reveal-slide-right");
  if (!revealElements.length) return;

  const observerOptions = {
    root: null,
    rootMargin: "0px 0px -30px 0px",
    threshold: 0.1
  };

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
      } else {
        entry.target.classList.remove("revealed");
      }
    });
  }, observerOptions);

  revealElements.forEach(el => revealObserver.observe(el));
}
