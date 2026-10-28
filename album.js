/**
 * ===================================================
 * LOGIKA KAMERA INSTANT & ALBUM FOTO PER ORANG
 * Zaky & Dina Wedding Live Photo Dump
 * Pengunci Identitas & Kuota 7 Foto Per Perangkat/HP
 * ===================================================
 */

const DEFAULT_GUEST_ALBUMS = [
  {
    guestName: "Rian & Teman-Teman",
    photos: [
      {
        id: "p1_1",
        url: "assets/images/couple_cover.jpg",
        caption: "Happy Wedding Zaky & Dina! Sakinah Mawaddah Warahmah!",
        deviceId: "dev_sample_1",
        filter: "ocean",
        time: "10m lalu"
      },
      {
        id: "p1_2",
        url: "assets/images/couple_rings.jpg",
        caption: "Akhirnya sah mas Zaky & mba Dina! 🎉",
        deviceId: "dev_sample_1",
        filter: "warm",
        time: "5m lalu"
      }
    ]
  },
  {
    guestName: "Anisa Rahma",
    photos: [
      {
        id: "p2_1",
        url: "assets/images/dina.jpg",
        caption: "Mba Dina cantik bangett masyaAllah! Seneng banget bisa dateng ❤️",
        deviceId: "dev_sample_2",
        filter: "none",
        time: "25m lalu"
      }
    ]
  },
  {
    guestName: "Budi Santoso",
    photos: [
      {
        id: "p3_1",
        url: "assets/images/zaky.jpg",
        caption: "Gagah mas Zaky! Selamat ya kawan!",
        deviceId: "dev_sample_3",
        filter: "bw",
        time: "1j lalu"
      }
    ]
  }
];

let mediaStream = null;
let currentSelectedFilter = "none";
let currentCapturedDataUrl = null;
let currentFacingMode = "environment"; // default kamera belakang
let pendingDownloadItem = null;

document.addEventListener("DOMContentLoaded", () => {
  initGuestAlbumApp();
});

function getDeviceId() {
  let id = localStorage.getItem("zaky_dina_device_id");
  if (!id) {
    id = "dev_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now();
    localStorage.setItem("zaky_dina_device_id", id);
  }
  return id;
}

function initGuestAlbumApp() {
  getDeviceId();
  initGuestNameAndLock();
  renderGuestAlbums();
  fetchPhotosFromCloud();
  updateDeviceQuotaBadge();
  initCameraControls();
  initFilterPills();
  initFileUploadHandler();
  initDownloadChoiceModal();
  checkQrWelcomeModal();
}

function initGuestNameAndLock() {
  const urlParams = new URLSearchParams(window.location.search);
  let guestNameParam = urlParams.get("to") || urlParams.get("n") || urlParams.get("nama") || urlParams.get("tamu") || urlParams.get("guest");

  // Fallback ke localStorage jika parameter URL kosong (misal saat dibuka kembali dari index.html)
  if (!guestNameParam) {
    const savedName = localStorage.getItem("zaky_dina_current_guest_name") || localStorage.getItem("zaky_dina_locked_guest_name");
    if (savedName && savedName !== "Tamu Undangan") {
      guestNameParam = savedName;
      try {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set("to", savedName);
        window.history.replaceState(null, "", newUrl.toString());
      } catch (e) {}
    }
  }

  let parsedName = "Tamu Undangan";
  if (guestNameParam) {
    try {
      parsedName = decodeURIComponent(guestNameParam.replace(/\+/g, " "));
    } catch (e) {
      parsedName = guestNameParam.replace(/\+/g, " ");
    }
  }

  const nameInput = document.getElementById("global-guest-name");
  const lockInfo = document.getElementById("identity-lock-info");
  const lockedTag = document.querySelector(".locked-tag");

  // Update tombol "← Kembali ke Undangan" agar selalu membawa parameter nama tamu ke index.html
  const backBtn = document.querySelector(".btn-back");
  if (backBtn) {
    if (parsedName && parsedName !== "Tamu Undangan") {
      backBtn.href = "index.html?to=" + encodeURIComponent(parsedName);
    } else {
      backBtn.href = "index.html";
    }
  }

  if (parsedName && parsedName !== "Tamu Undangan") {
    // IDENTITAS RESMI DARI LINK UNDANGAN ATAU STORAGE: KUNCI PENUH
    try {
      localStorage.setItem("zaky_dina_current_guest_name", parsedName);
      localStorage.setItem("zaky_dina_locked_guest_name", parsedName);
    } catch (e) {}

    if (nameInput) {
      nameInput.value = parsedName;
      nameInput.readOnly = true;
      nameInput.classList.add("form-input-locked");
      nameInput.title = "Nama tamu terkunci sesuai undangan resmi Zaky & Dina";
    }

    if (lockedTag) {
      lockedTag.style.display = "inline-block";
    }

    if (lockInfo) {
      lockInfo.innerHTML = '🔒 <strong>Identitas Terverifikasi:</strong> Nama dikunci otomatis sesuai link undangan resmi dan tidak dapat diubah.';
      lockInfo.style.color = "var(--blue-primary)";
    }
  } else {
    // JIKA TAMU SCAN QR LANGSUNG TANPA LINK (MISAL DI MEJA RESEPSI): BISA ISI NAMA 1x LALU TERKUNCI
    if (nameInput) {
      nameInput.value = "";
      nameInput.placeholder = "Ketik nama Anda di sini (cth: Rian)...";
      nameInput.readOnly = false;
      nameInput.classList.remove("form-input-locked");
      nameInput.title = "Ketik nama Anda untuk menyimpan foto";

      nameInput.addEventListener("change", () => {
        const val = nameInput.value.trim();
        if (val) {
          try {
            localStorage.setItem("zaky_dina_current_guest_name", val);
            localStorage.setItem("zaky_dina_locked_guest_name", val);
          } catch (e) {}
          initGuestNameAndLock();
        }
      });
    }

    if (lockedTag) {
      lockedTag.style.display = "none";
    }

    if (lockInfo) {
      lockInfo.innerHTML = '💡 Ketik nama Anda. Nama akan langsung terkunci permanen setelah Anda mengirim foto pertama.';
      lockInfo.style.color = "var(--text-muted)";
    }
  }
}

/* ===================================================
   MODAL KHUSUS SCAN QR CODE (ISI NAMA SEBELUM MULAI)
   =================================================== */
function checkQrWelcomeModal() {
  const urlParams = new URLSearchParams(window.location.search);
  const isFromQr = urlParams.get("from") === "qr" || urlParams.get("qr") === "1" || urlParams.get("scan") === "true";
  const guestNameParam = urlParams.get("to") || urlParams.get("n") || urlParams.get("nama") || urlParams.get("tamu") || urlParams.get("guest");

  // Jika URL sudah membawa nama tamu khusus dari undangan (?to=Budi), tidak perlu modal
  if (guestNameParam && guestNameParam !== "Tamu Undangan") {
    return;
  }

  // Cek apakah di perangkat ini sudah tersimpan nama sebelumnya
  const savedName = localStorage.getItem("zaky_dina_locked_guest_name") || localStorage.getItem("zaky_dina_current_guest_name");

  // Jika scan dari QR (atau belum ada nama sama sekali yang tersimpan)
  if (isFromQr || !savedName || savedName === "Tamu Undangan") {
    if (!savedName || savedName === "Tamu Undangan") {
      const modal = document.getElementById("modal-qr-welcome");
      const input = document.getElementById("qr-guest-input");
      if (modal) {
        modal.classList.add("active");
        setTimeout(() => {
          if (input) input.focus();
        }, 350);
      }
    } else if (isFromQr) {
      showToastNotification(`Selamat datang kembali, ${savedName}! 📸`);
    }
  }
}

function handleQrWelcomeSubmit(e) {
  if (e) e.preventDefault();

  const input = document.getElementById("qr-guest-input");
  const guestName = input ? input.value.trim() : "";

  if (!guestName) {
    alert("Mohon masukkan nama Anda terlebih dahulu.");
    return;
  }

  try {
    localStorage.setItem("zaky_dina_current_guest_name", guestName);
    localStorage.setItem("zaky_dina_locked_guest_name", guestName);
  } catch (err) {}

  // Tutup modal selamat datang
  const modal = document.getElementById("modal-qr-welcome");
  if (modal) {
    modal.classList.remove("active");
  }

  // Refresh tampilan & kunci identitas di halaman
  initGuestNameAndLock();

  // Tampilkan notifikasi & nyalakan kamera HP otomatis
  showToastNotification(`Selamat datang, ${guestName}! Kamera aktif ✨`);
  setTimeout(() => {
    if (typeof startCameraStream === "function") {
      startCameraStream();
    }
  }, 300);
}

function getStoredAlbums() {
  const stored = localStorage.getItem("zaky_dina_guest_albums");
  return stored ? JSON.parse(stored) : DEFAULT_GUEST_ALBUMS;
}

function saveStoredAlbums(albums) {
  try {
    localStorage.setItem("zaky_dina_guest_albums", JSON.stringify(albums));
  } catch (e) {
    console.warn("Storage quota limit reached, pruning old photos:", e);
    if (albums.length > 10) albums = albums.slice(0, 10);
    localStorage.setItem("zaky_dina_guest_albums", JSON.stringify(albums));
  }
}

function getDevicePhotoCount() {
  const deviceId = getDeviceId();
  const lockedName = localStorage.getItem("zaky_dina_locked_guest_name");
  const albums = getStoredAlbums();

  let count = 0;
  albums.forEach(group => {
    if (lockedName && group.guestName.toLowerCase() === lockedName.toLowerCase()) {
      count += group.photos.length;
    } else {
      group.photos.forEach(p => {
        if (p.deviceId === deviceId) count++;
      });
    }
  });

  return count;
}

function updateDeviceQuotaBadge() {
  const badge = document.getElementById("device-quota-badge");
  const count = getDevicePhotoCount();
  if (badge) {
    badge.textContent = `Kuota: ${count} / 7 Foto`;
    if (count >= 7) {
      badge.style.background = "rgba(239, 68, 68, 0.15)";
      badge.style.color = "#DC2626";
      badge.textContent = `Kuota: 7 / 7 (Maksimal)`;
    } else {
      badge.style.background = "rgba(216, 150, 168, 0.15)";
      badge.style.color = "var(--pink-primary)";
    }
  }
}

/* ===================================================
   1. RENDER ALBUM POLAROID PER ORANG
   =================================================== */
function renderGuestAlbums() {
  const listContainer = document.getElementById("guest-groups-list");
  if (!listContainer) return;

  const albums = getStoredAlbums();

  listContainer.innerHTML = albums.map(group => `
    <div class="guest-polaroid-card">
      <div class="guest-header">
        <h3 class="guest-name-title">📸 ${escapeHtml(group.guestName)}</h3>
        <span class="guest-limit-badge">${group.photos.length} / 7 Foto</span>
      </div>

      <div class="polaroid-slider">
        ${group.photos.map(photo => `
          <div class="polaroid-frame">
            <div class="polaroid-img-box">
              <img src="${photo.url}" alt="${escapeHtml(photo.caption)}" style="${getFilterStyle(photo.filter)}">
            </div>
            ${photo.caption ? `<p class="polaroid-caption">"${escapeHtml(photo.caption)}"</p>` : `<p class="polaroid-caption" style="opacity: 0.4; font-style: italic;">(Tanpa Caption)</p>`}
            <div class="polaroid-footer">
              <button type="button" class="btn-download" onclick="openDownloadChoiceModal('${photo.url}', '${escapeHtml(group.guestName)}-${photo.id}.jpg', '${escapeHtml(photo.caption)}', '${photo.filter}')">
                Simpan 📥
              </button>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `).join("");

  updateDeviceQuotaBadge();
}

function fetchPhotosFromCloud() {
  const webhookUrl = (typeof WEDDING_CONFIG !== "undefined" && WEDDING_CONFIG.googleDriveWebhookUrl)
    ? WEDDING_CONFIG.googleDriveWebhookUrl
    : "https://script.google.com/macros/s/AKfycbwXHFr2JN8Vm9s1fccMMWZxU1mWFb46rsxHdofvVuF-Hqzf2iJ4HIEHpwifcopUQmf5/exec";

  if (!webhookUrl) return;

  fetch(webhookUrl + "?action=getPhotos")
    .then(res => res.json())
    .then(data => {
      if (data && data.status === "success" && Array.isArray(data.photos) && data.photos.length > 0) {
        mergeCloudPhotosToLocal(data.photos);
      }
    })
    .catch(err => console.warn("Log fetch photos cloud:", err));
}

function mergeCloudPhotosToLocal(cloudPhotos) {
  let localAlbums = getStoredAlbums();

  cloudPhotos.forEach(cPhoto => {
    const guestName = cPhoto.guestName || "Tamu Undangan";
    let group = localAlbums.find(g => g.guestName.toLowerCase() === guestName.toLowerCase());

    if (!group) {
      group = { guestName: guestName, photos: [] };
      localAlbums.push(group);
    }

    const exists = group.photos.some(p => p.url === cPhoto.url || (p.caption && p.caption === cPhoto.caption && p.caption !== ""));
    if (!exists) {
      group.photos.unshift({
        id: "cloud_" + Math.random().toString(36).substr(2, 9),
        url: cPhoto.url,
        caption: cPhoto.caption || "",
        deviceId: "cloud",
        filter: "none",
        time: cPhoto.time || "Baru saja"
      });
    }
  });

  saveStoredAlbums(localAlbums);
  renderGuestAlbums();
}

/* ===================================================
   2. OPSI SIMPAN FOTO (POLAROID FRAME VS FOTO ASLI)
   =================================================== */
function openDownloadChoiceModal(url, filename, caption, filter) {
  pendingDownloadItem = { url, filename, caption, filter };
  const modalChoice = document.getElementById("modal-download-choice");
  if (modalChoice) {
    modalChoice.classList.add("active");
  }
}

function initDownloadChoiceModal() {
  const modalChoice = document.getElementById("modal-download-choice");
  const closeBtn = document.getElementById("close-download-choice");
  const btnPolaroid = document.getElementById("btn-dl-polaroid");
  const btnRaw = document.getElementById("btn-dl-raw");

  closeBtn?.addEventListener("click", () => {
    modalChoice?.classList.remove("active");
  });

  modalChoice?.addEventListener("click", (e) => {
    if (e.target === modalChoice) modalChoice.classList.remove("active");
  });

  btnPolaroid?.addEventListener("click", () => {
    modalChoice?.classList.remove("active");
    if (pendingDownloadItem) {
      generateAndDownloadPolaroidCanvas(pendingDownloadItem);
    }
  });

  btnRaw?.addEventListener("click", () => {
    modalChoice?.classList.remove("active");
    if (pendingDownloadItem) {
      triggerDirectDownload(pendingDownloadItem.url, pendingDownloadItem.filename);
    }
  });
}

function triggerDirectDownload(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "foto-instant.jpg";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function generateAndDownloadPolaroidCanvas(item) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, 800, 1000);

    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 798, 998);

    ctx.save();
    if (item.filter === 'ocean') {
      ctx.filter = 'saturate(1.1) hue-rotate(-10deg) brightness(1.03)';
    } else if (item.filter === 'warm') {
      ctx.filter = 'sepia(0.25) saturate(1.2) contrast(1.05)';
    } else if (item.filter === 'bw') {
      ctx.filter = 'grayscale(1) contrast(1.1)';
    }

    ctx.drawImage(img, 40, 40, 720, 720);
    ctx.restore();

    ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, 720, 720);

    if (item.caption && item.caption.trim() !== "") {
      ctx.fillStyle = "#2D3748";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "46px 'Reenie Beanie', cursive, sans-serif";
      ctx.fillText(`"${item.caption.trim()}"`, 400, 890);
    } else {
      ctx.fillStyle = "#A0AEC0";
      ctx.textAlign = "center";
      ctx.font = "28px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText("Zaky & Dina Wedding • 2027", 400, 890);
    }

    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    triggerDirectDownload(dataUrl, "Polaroid-" + (item.filename || "foto.jpg"));
  };
  img.src = item.url;
}

function getFilterStyle(filter) {
  switch (filter) {
    case 'ocean': return 'filter: saturate(1.1) hue-rotate(-10deg) brightness(1.03);';
    case 'warm': return 'filter: sepia(0.25) saturate(1.2) contrast(1.05);';
    case 'bw': return 'filter: grayscale(1) contrast(1.1);';
    default: return '';
  }
}

/* ===================================================
   3. KAMERA LIVE & MODAL HANDLERS
   =================================================== */
function initCameraControls() {
  const btnStartCam = document.getElementById("btn-start-cam");
  const btnSnap = document.getElementById("btn-snap-photo");
  const btnFlipCam = document.getElementById("btn-flip-cam");

  btnStartCam?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (getDevicePhotoCount() >= 7) {
      alert("Anda sudah mencapai batas kuota maksimal 7 foto per HP/perangkat ini.");
      return;
    }
    startCameraStream();
  });

  btnFlipCam?.addEventListener("click", async (e) => {
    e.stopPropagation();
    currentFacingMode = (currentFacingMode === "environment") ? "user" : "environment";
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      mediaStream = null;
    }
    await startCameraStream();
  });

  btnSnap?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (getDevicePhotoCount() >= 7) {
      alert("Anda sudah mencapai batas kuota maksimal 7 foto per HP/perangkat ini.");
      return;
    }
    const videoStream = document.getElementById("camera-stream");
    if (mediaStream && videoStream && videoStream.style.display !== "none") {
      snapFromCameraStream();
    } else {
      startCameraStream().then(() => {
        setTimeout(snapFromCameraStream, 600);
      });
    }
  });

  const modalSave = document.getElementById("modal-save");
  const closeSave = document.getElementById("close-save");
  const btnSavePhoto = document.getElementById("btn-save-photo");

  closeSave?.addEventListener("click", () => {
    modalSave?.classList.remove("active");
  });

  modalSave?.addEventListener("click", (e) => {
    if (e.target === modalSave) modalSave.classList.remove("active");
  });

  btnSavePhoto?.addEventListener("click", (e) => {
    e.preventDefault();
    handleSaveNewPhoto();
  });
}

async function startCameraStream() {
  const videoStream = document.getElementById("camera-stream");
  const placeholder = document.getElementById("camera-placeholder");

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("Browser/Perangkat Anda belum mengizinkan akses kamera langsung. Mengalihkan ke Galeri HP...");
    document.getElementById("file-input")?.click();
    return;
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }

  let stream = null;

  // 1. Coba exact constraint untuk switch kamera depan/belakang di HP
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: currentFacingMode } },
      audio: false
    });
  } catch (e1) {
    // 2. Coba ideal constraint (fallback HP/Tablet)
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: currentFacingMode } },
        audio: false
      });
    } catch (e2) {
      // 3. Coba facing mode sederhana
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: currentFacingMode },
          audio: false
        });
      } catch (e3) {
        // 4. Fallback umum jika hanya ada 1 kamera / webcam
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        } catch (e4) {
          console.warn("Camera stream failed all constraints:", e4);
        }
      }
    }
  }

  if (stream) {
    mediaStream = stream;
    if (videoStream) {
      videoStream.muted = true; // Wajib untuk izin autoplay video di HP iOS/Android!
      videoStream.srcObject = stream;
      videoStream.style.display = "block";

      if (currentFacingMode === "user") {
        videoStream.style.transform = "scaleX(-1)";
      } else {
        videoStream.style.transform = "none";
      }

      try {
        await videoStream.play();
      } catch (err) {
        console.error("Video play error:", err);
      }
    }
    if (placeholder) {
      placeholder.style.display = "none";
    }
  } else {
    alert("Kamera HP tidak dapat diakses atau izin ditolak. Silakan gunakan tombol '📁 Galeri HP' untuk mengunggah foto.");
    document.getElementById("file-input")?.click();
  }
}

function snapFromCameraStream() {
  const video = document.getElementById("camera-stream");
  const canvas = document.getElementById("camera-canvas");
  if (!video || !canvas) return;

  const vWidth = video.videoWidth || 600;
  const vHeight = video.videoHeight || 600;

  const size = Math.min(vWidth, vHeight);
  const sx = (vWidth - size) / 2;
  const sy = (vHeight - size) / 2;

  canvas.width = 600;
  canvas.height = 600;

  const ctx = canvas.getContext("2d");

  if (currentFacingMode === "user") {
    ctx.translate(600, 0);
    ctx.scale(-1, 1);
  }

  ctx.drawImage(video, sx, sy, size, size, 0, 0, 600, 600);

  // Kompresi foto ke JPEG 0.72 (~35KB-45KB per foto) agar website sangat ringan!
  currentCapturedDataUrl = canvas.toDataURL("image/jpeg", 0.72);
  openSaveModal(currentCapturedDataUrl);
}

/* ===================================================
   4. FILTER SELECTION
   =================================================== */
function initFilterPills() {
  const pills = document.querySelectorAll(".filter-pill");
  const video = document.getElementById("camera-stream");

  pills.forEach(pill => {
    pill.addEventListener("click", () => {
      pills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      currentSelectedFilter = pill.getAttribute("data-filter");

      if (video) {
        const mirrorCss = (currentFacingMode === "user") ? "transform: scaleX(-1);" : "";
        video.style.cssText = `display: block; ${mirrorCss} ${getFilterStyle(currentSelectedFilter)}`;
      }

      const previewImg = document.getElementById("save-preview-img");
      if (previewImg) {
        previewImg.style.cssText = `width: 100%; height: 100%; object-fit: cover; ${getFilterStyle(currentSelectedFilter)}`;
      }
    });
  });
}

/* ===================================================
   5. FILE UPLOAD FROM GALLERY FALLBACK
   =================================================== */
function initFileUploadHandler() {
  const fileInput = document.getElementById("file-input");
  fileInput?.addEventListener("change", (e) => {
    if (getDevicePhotoCount() >= 7) {
      alert("Anda sudah mencapai batas kuota maksimal 7 foto per HP/perangkat ini.");
      return;
    }
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        // High efficiency image compression canvas
        const img = new Image();
        img.onload = () => {
          const cvs = document.createElement("canvas");
          cvs.width = 600; cvs.height = 600;
          const cx = cvs.getContext("2d");
          const size = Math.min(img.width, img.height);
          cx.drawImage(img, (img.width - size)/2, (img.height - size)/2, size, size, 0, 0, 600, 600);
          currentCapturedDataUrl = cvs.toDataURL("image/jpeg", 0.72);
          openSaveModal(currentCapturedDataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
}

function openSaveModal(imgUrl) {
  const modalSave = document.getElementById("modal-save");
  const previewImg = document.getElementById("save-preview-img");
  const nameInput = document.getElementById("guest-name-input");
  const globalInput = document.getElementById("global-guest-name");
  const lockedName = localStorage.getItem("zaky_dina_locked_guest_name") || localStorage.getItem("zaky_dina_current_guest_name");
  const captionInput = document.getElementById("guest-caption-input");

  if (previewImg) {
    previewImg.src = imgUrl;
    previewImg.style.cssText = `width: 100%; height: 100%; object-fit: cover; ${getFilterStyle(currentSelectedFilter)}`;
  }

  const effectiveName = lockedName || globalInput?.value.trim() || "";
  if (nameInput) {
    if (effectiveName && effectiveName !== "Tamu Undangan") {
      nameInput.value = effectiveName;
      nameInput.readOnly = true;
      nameInput.classList.add("form-input-locked");
      nameInput.title = "Nama tamu terkunci sesuai undangan resmi";
    } else {
      nameInput.value = "";
      nameInput.placeholder = "Masukkan nama Anda...";
      nameInput.readOnly = false;
      nameInput.classList.remove("form-input-locked");
    }
  }

  if (captionInput) {
    captionInput.value = "";
  }

  if (modalSave) {
    modalSave.classList.add("active");
  }
}

/* ===================================================
   6. SIMPAN FOTO BARU & CEK PERANGKAT (MAKS. 7 FOTO)
   =================================================== */
function handleSaveNewPhoto() {
  if (getDevicePhotoCount() >= 7) {
    alert("Mohon maaf, Anda telah mencapai batas kuota maksimal 7 foto per tamu. Terima kasih!");
    document.getElementById("modal-save")?.classList.remove("active");
    return;
  }

  const lockedName = localStorage.getItem("zaky_dina_locked_guest_name") || localStorage.getItem("zaky_dina_current_guest_name");
  const nameInput = document.getElementById("guest-name-input");
  const globalInput = document.getElementById("global-guest-name");
  let guestName = lockedName || nameInput?.value.trim() || globalInput?.value.trim() || "Tamu Undangan";

  const captionInput = document.getElementById("guest-caption-input");
  const captionText = captionInput ? captionInput.value.trim() : "";

  if (!currentCapturedDataUrl) {
    alert("Mohon jepret atau pilih foto terlebih dahulu.");
    return;
  }

  if (guestName && guestName !== "Tamu Undangan" && !lockedName) {
    try {
      localStorage.setItem("zaky_dina_locked_guest_name", guestName);
      localStorage.setItem("zaky_dina_current_guest_name", guestName);
      initGuestNameAndLock();
    } catch (e) {}
  }

  let albums = getStoredAlbums();
  let group = albums.find(g => g.guestName.toLowerCase() === guestName.toLowerCase());

  if (!group) {
    group = {
      guestName: guestName,
      photos: []
    };
    albums.unshift(group);
  }

  const newPhoto = {
    id: "p_" + Date.now(),
    url: currentCapturedDataUrl,
    caption: captionText,
    deviceId: getDeviceId(),
    filter: currentSelectedFilter,
    time: "Baru saja"
  };

  group.photos.unshift(newPhoto);
  saveStoredAlbums(albums);

  // OTOMATIS ASYNCHRONOUS UPLOAD KE GOOGLE DRIVE
  const driveUrl = (typeof WEDDING_CONFIG !== "undefined" && WEDDING_CONFIG.googleDriveWebhookUrl)
    ? WEDDING_CONFIG.googleDriveWebhookUrl
    : "https://script.google.com/macros/s/AKfycbzd0zThvRVFm5GE6YynxrgP6l2nYINnmOjumqMSTuFz04vE5YwOBSfgnOnM9nMlop0Y/exec";

  if (driveUrl) {
    uploadToGoogleDrive(newPhoto, guestName, driveUrl);
  }

  document.getElementById("modal-save")?.classList.remove("active");

  renderGuestAlbums();
  showToastNotification(`Foto berhasil ditambahkan ke album ${guestName}! (${getDevicePhotoCount()}/7 Foto)`);
}

function uploadToGoogleDrive(photo, guestName, webhookUrl) {
  if (!webhookUrl) return;

  const payload = {
    image: photo.url,
    guestName: guestName || "Tamu Undangan",
    caption: photo.caption || "",
    fileName: `${guestName}_${Date.now()}.jpg`
  };

  fetch(webhookUrl, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  }).then(() => {
    console.log("Foto berhasil dikirim ke Google Drive & Cloud Shared Album!");
  }).catch(err => {
    console.warn("Log pengiriman Google Drive:", err);
  });
}

function showToastNotification(msg) {
  const toast = document.getElementById("album-toast");
  if (toast) {
    toast.textContent = msg;
    toast.style.transform = "translateX(-50%) translateY(0)";
    toast.style.opacity = "1";
    setTimeout(() => {
      toast.style.transform = "translateX(-50%) translateY(100px)";
      toast.style.opacity = "0";
    }, 3500);
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[m]);
}
