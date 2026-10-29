/**
 * =========================================================================
 * GOOGLE APPS SCRIPT - ZAKY & DINA WEDDING
 * =========================================================================
 * STRUKTUR SPREADSHEET TEPAT 3 TAB:
 * 1. "tamu"            : Nomor | Nama | Link Undangan | Tgl Pembuatan | Kirim WhatsApp
 * 2. "album foto tamu" : Nama Tamu | Data Foto | Catatan Foto | Waktu Upload
 * 3. "amplop & kado"   : Nomor | Tanggal & Waktu | Nama Pengirim | Jenis Hadiah | Nominal (Rp) | Catatan / Doa
 *
 * SPREADSHEET ID : 1IWtFG8lAVZSTDJPlKeG4bYC6L8j1MJ6WlZBcCglB9Ps
 * DRIVE FOLDER ID : 1eYoURu3wO9U0gouLlvFx6F51xy11VesF
 * =========================================================================
 */

var SPREADSHEET_ID = "1IWtFG8lAVZSTDJPlKeG4bYC6L8j1MJ6WlZBcCglB9Ps";
var DRIVE_FOLDER_ID = "1eYoURu3wO9U0gouLlvFx6F51xy11VesF";

/**
 * FUNGSI UTAMA: PERBAIKI & RAPIKAN SPREADSHEET JADI 2 TAB BERSIH
 * Jalankan fungsi ini langsung dari editor Apps Script (pilih 'cleanAndSetupSpreadsheet' lalu klik 'Run'),
 * atau otomatis dipanggil lewat Web App URL.
 */
function cleanAndSetupSpreadsheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var allSheets = ss.getSheets();

  var rawPhotos = [];
  var rawGuests = [];
  var seenGuestNames = {};

  // 1. Pindai semua sheet yang ada untuk mengambil data yang mungkin bercampur
  for (var s = 0; s < allSheets.length; s++) {
    var curSheet = allSheets[s];
    var data = curSheet.getDataRange().getValues();

    for (var r = 0; r < data.length; r++) {
      var row = data[r];
      var rowStr = row.join(" ");

      // Abaikan header umum
      if (r === 0 && (rowStr.indexOf("Nama Tamu") !== -1 || rowStr.indexOf("Link Undangan") !== -1)) {
        continue;
      }

      var isGuest = false;
      var guestName = "";
      var guestUrl = "";
      var guestDate = "";

      // Deteksi baris Tamu Undangan (ada link zakykedua.github.io atau u= atau 'Siap Dikirim')
      for (var c = 0; c < row.length; c++) {
        var cellVal = (row[c] || "").toString().trim();
        if (cellVal.indexOf("zakykedua.github.io") !== -1 || cellVal.indexOf("?u=") !== -1) {
          isGuest = true;
          guestUrl = cellVal;
        }
      }

      if (isGuest) {
        // Cari nama tamu di baris ini
        for (var c2 = 0; c2 < row.length; c2++) {
          var val2 = (row[c2] || "").toString().trim();
          if (!val2) continue;
          if (val2 === guestUrl) continue;
          if (val2 === "Siap Dikirim") continue;
          if (val2.indexOf("WhatsApp") !== -1) continue;
          if (/^\d+$/.test(val2)) continue; // Hanya angka (nomor urut)
          if (val2.indexOf("202") !== -1 && (val2.indexOf("Okt") !== -1 || val2.indexOf(":") !== -1)) {
            guestDate = val2;
            continue;
          }
          if (!guestName && val2.length > 1) {
            guestName = val2;
          }
        }

        if (guestName) {
          var key = guestName.toLowerCase();
          if (!seenGuestNames[key]) {
            seenGuestNames[key] = true;
            rawGuests.push({
              name: guestName,
              url: guestUrl,
              date: guestDate || formatTanggalIndonesia(new Date())
            });
          }
        }
      } else {
        // Cek apakah ini baris Foto
        var colA = (row[0] || "").toString().trim();
        var colB = (row[1] || "").toString().trim();
        var colC = (row[2] || "").toString().trim();
        var colD = (row[3] || "").toString().trim();

        var isPhoto = false;
        if (colB.indexOf("data:image") !== -1 || colB.indexOf("googleusercontent.com") !== -1 || colB.indexOf("drive.google.com") !== -1) {
          isPhoto = true;
        }

        if (isPhoto) {
          rawPhotos.push([
            colA || "Tamu Undangan",
            colB,
            colC || "",
            colD || formatTanggalUpload(new Date())
          ]);
        }
      }
    }
  }

  // 2. Siapkan Sheet 1: "tamu"
  var tamuSheet = ss.getSheetByName("tamu");
  if (!tamuSheet) {
    // Cari apakah ada sheet bernama variasi tamu
    for (var i = 0; i < allSheets.length; i++) {
      if (allSheets[i].getName().toLowerCase().trim() === "tamu") {
        tamuSheet = allSheets[i];
        tamuSheet.setName("tamu");
        break;
      }
    }
  }
  if (!tamuSheet) {
    tamuSheet = ss.insertSheet("tamu", 0);
  }

  // Bersihkan dan format tab "tamu"
  tamuSheet.clear();
  tamuSheet.getRange(1, 1, 1, 5).setValues([[
    "Nomor",
    "Nama",
    "Link Undangan",
    "Tgl Pembuatan",
    "Kirim WhatsApp"
  ]]);

  // Styling Header Tab Tamu: Biru Elegan
  var headerTamu = tamuSheet.getRange(1, 1, 1, 5);
  headerTamu.setFontWeight("bold")
    .setBackground("#1B365D")
    .setFontColor("#FFFFFF")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
  tamuSheet.setRowHeight(1, 35);
  tamuSheet.setFrozenRows(1);

  // Set lebar kolom tamu agar rapi
  tamuSheet.setColumnWidth(1, 65);  // Nomor
  tamuSheet.setColumnWidth(2, 220); // Nama
  tamuSheet.setColumnWidth(3, 380); // Link Undangan
  tamuSheet.setColumnWidth(4, 160); // Tgl Pembuatan
  tamuSheet.setColumnWidth(5, 170); // Kirim WhatsApp

  // Masukkan data tamu
  for (var g = 0; g < rawGuests.length; g++) {
    var guest = rawGuests[g];
    var rowIdx = g + 2;
    var waFormula = getWaFormula(guest.name, guest.url);

    tamuSheet.getRange(rowIdx, 1).setValue(g + 1).setHorizontalAlignment("center");
    tamuSheet.getRange(rowIdx, 2).setValue(guest.name).setFontWeight("bold");
    tamuSheet.getRange(rowIdx, 3).setValue(guest.url);
    tamuSheet.getRange(rowIdx, 4).setValue(guest.date).setHorizontalAlignment("center");
    tamuSheet.getRange(rowIdx, 5).setValue(waFormula).setHorizontalAlignment("center");
    tamuSheet.setRowHeight(rowIdx, 28);
  }

  // 3. Siapkan Sheet 2: "album foto tamu"
  var albumSheet = ss.getSheetByName("album foto tamu");
  if (!albumSheet) {
    for (var j = 0; j < allSheets.length; j++) {
      var sName = allSheets[j].getName().toLowerCase().trim();
      if (sName === "album foto tamu" || sName === "album foto" || sName === "album") {
        albumSheet = allSheets[j];
        albumSheet.setName("album foto tamu");
        break;
      }
    }
  }
  if (!albumSheet) {
    albumSheet = ss.insertSheet("album foto tamu", 1);
  }

  // Bersihkan dan format tab "album foto tamu"
  albumSheet.clear();
  albumSheet.getRange(1, 1, 1, 4).setValues([[
    "Nama Tamu",
    "Data Foto",
    "Catatan Foto",
    "Waktu Upload"
  ]]);

  // Styling Header Tab Album: Burgundy / Maroon Mewah
  var headerAlbum = albumSheet.getRange(1, 1, 1, 4);
  headerAlbum.setFontWeight("bold")
    .setBackground("#881337")
    .setFontColor("#FFFFFF")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
  albumSheet.setRowHeight(1, 35);
  albumSheet.setFrozenRows(1);

  // Set lebar kolom album
  albumSheet.setColumnWidth(1, 180); // Nama Tamu
  albumSheet.setColumnWidth(2, 380); // Data Foto
  albumSheet.setColumnWidth(3, 220); // Catatan Foto
  albumSheet.setColumnWidth(4, 150); // Waktu Upload

  if (rawPhotos.length > 0) {
    albumSheet.getRange(2, 1, rawPhotos.length, 4).setValues(rawPhotos);
    for (var p = 0; p < rawPhotos.length; p++) {
      albumSheet.setRowHeight(p + 2, 28);
    }
  }

  // 4. Siapkan Sheet 3: "amplop & kado"
  var amplopSheet = getAmplopSheet(ss);

  // 5. Urutkan posisi tab: 1. tamu, 2. album foto tamu, 3. amplop & kado
  ss.setActiveSheet(tamuSheet);
  ss.moveActiveSheet(1);
  ss.setActiveSheet(albumSheet);
  ss.moveActiveSheet(2);
  ss.setActiveSheet(amplopSheet);
  ss.moveActiveSheet(3);

  // 6. Hapus sheet tambahan yang tidak digunakan jika ada
  var currentSheets = ss.getSheets();
  for (var k = 0; k < currentSheets.length; k++) {
    var checkName = currentSheets[k].getName().toLowerCase().trim();
    if (checkName !== "tamu" && checkName !== "album foto tamu" && checkName !== "amplop & kado") {
      try {
        if (currentSheets.length > 3) {
          ss.deleteSheet(currentSheets[k]);
        }
      } catch (e) {}
    }
  }

  return {
    status: "success",
    message: "Spreadsheet Zaky & Dina sukses dirapikan menjadi 3 tab terpisah!",
    totalTamu: rawGuests.length,
    totalFoto: rawPhotos.length
  };
}

/**
 * Tab 1: Mengambil Sheet "tamu"
 */
function getTamuSheet(ss) {
  var sheet = ss.getSheetByName("tamu");
  if (!sheet) {
    var sheets = ss.getSheets();
    for (var i = 0; i < sheets.length; i++) {
      if (sheets[i].getName().toLowerCase().trim() === "tamu") {
        sheet = sheets[i];
        break;
      }
    }
    if (!sheet) {
      sheet = ss.insertSheet("tamu", 0);
    }
  }
  sheet.setName("tamu");

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 5).setValues([[
      "Nomor",
      "Nama",
      "Link Undangan",
      "Tgl Pembuatan",
      "Kirim WhatsApp"
    ]]);
    sheet.getRange(1, 1, 1, 5)
      .setFontWeight("bold")
      .setBackground("#1B365D")
      .setFontColor("#FFFFFF")
      .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Tab 2: Mengambil Sheet "album foto tamu"
 */
function getAlbumSheet(ss) {
  var sheet = ss.getSheetByName("album foto tamu");
  if (!sheet) {
    var sheets = ss.getSheets();
    for (var i = 0; i < sheets.length; i++) {
      var n = sheets[i].getName().toLowerCase().trim();
      if (n === "album foto tamu" || n === "album" || n === "album foto") {
        sheet = sheets[i];
        break;
      }
    }
    if (!sheet) {
      sheet = ss.insertSheet("album foto tamu", 1);
    }
  }
  sheet.setName("album foto tamu");

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 4).setValues([[
      "Nama Tamu",
      "Data Foto",
      "Catatan Foto",
      "Waktu Upload"
    ]]);
    sheet.getRange(1, 1, 1, 4)
      .setFontWeight("bold")
      .setBackground("#881337")
      .setFontColor("#FFFFFF")
      .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Tab 3: Mengambil Sheet "amplop & kado"
 */
function getAmplopSheet(ss) {
  var sheet = ss.getSheetByName("amplop & kado");
  if (!sheet) {
    var sheets = ss.getSheets();
    for (var i = 0; i < sheets.length; i++) {
      var n = sheets[i].getName().toLowerCase().trim();
      if (n === "amplop & kado" || n === "amplop" || n === "kado" || n === "amplop digital") {
        sheet = sheets[i];
        break;
      }
    }
    if (!sheet) {
      sheet = ss.insertSheet("amplop & kado");
    }
  }
  sheet.setName("amplop & kado");

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 6).setValues([[
      "Nomor",
      "Tanggal & Waktu",
      "Nama Pengirim",
      "Jenis Hadiah",
      "Nominal (Rp)",
      "Catatan / Doa"
    ]]);
    sheet.getRange(1, 1, 1, 6)
      .setFontWeight("bold")
      .setBackground("#1B5E20") // Emerald Green Elegan
      .setFontColor("#FFFFFF")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");
    sheet.setRowHeight(1, 35);
    sheet.setFrozenRows(1);

    // Atur lebar kolom tab amplop & kado
    sheet.setColumnWidth(1, 65);  // Nomor
    sheet.setColumnWidth(2, 160); // Tanggal & Waktu
    sheet.setColumnWidth(3, 200); // Nama Pengirim
    sheet.setColumnWidth(4, 140); // Jenis Hadiah (QRIS / Kado Fisik)
    sheet.setColumnWidth(5, 150); // Nominal (Rp)
    sheet.setColumnWidth(6, 280); // Catatan / Doa
  }
  return sheet;
}

/**
 * Formula tautan WhatsApp instan langsung di sel spreadsheet
 */
function getWaFormula(guestName, guestUrl) {
  var text = "Assalamu’alaikum Warahmatullahi Wabarakatuh\n\n" +
    "Yth. *" + guestName + "*,\n\n" +
    "Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada hari bahagia pernikahan kami:\n\n" +
    "💍 *Zaky & Dina*\n" +
    "🗓️ *Sabtu, 20 Maret 2027 (Akad & Resepsi - Gedung Wanita Nganjuk)*\n" +
    "🗓️ *Sabtu, 27 Maret 2027 (Ngunduh Mantu - Pendopo Marsudi Utomo, Klaten)*\n\n" +
    "Detail acara, lokasi, dan konfirmasi kehadiran dapat diakses melalui tautan undangan berikut:\n" +
    "🔗 " + guestUrl + "\n\n" +
    "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir.\n\n" +
    "Wassalamu’alaikum Warahmatullahi Wabarakatuh\n" +
    "Kami yang berbahagia,\n" +
    "*Zaky & Dina*";

  var encoded = encodeURIComponent(text);
  return '=HYPERLINK("https://api.whatsapp.com/send?text=' + encoded + '", "💬 Kirim WhatsApp")';
}

function formatTanggalIndonesia(d) {
  return d.toLocaleDateString("id-ID", {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatTanggalUpload(d) {
  return d.toLocaleDateString("id-ID", {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Handle HTTP GET Requests
 */
function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "";
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    // 1. Ambil Foto Live Album untuk Sinkronisasi Album HP Tamu (action=getPhotos)
    if (action === "getPhotos") {
      var albumSheet = getAlbumSheet(ss);
      var rows = albumSheet.getDataRange().getValues();
      var photos = [];

      for (var p = 1; p < rows.length; p++) {
        if (rows[p][1]) {
          photos.push({
            guestName: rows[p][0] || "Tamu Undangan",
            url: rows[p][1],
            caption: rows[p][2] || "",
            time: rows[p][3] || "Baru saja"
          });
        }
      }

      photos.reverse();
      return ContentService.createTextOutput(JSON.stringify({ status: "success", photos: photos }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Ambil Daftar Tamu (action=getGuests)
    if (action === "getGuests") {
      var tamuSheet = getTamuSheet(ss);
      var tamuData = tamuSheet.getDataRange().getValues();
      var guests = [];

      for (var g = 1; g < tamuData.length; g++) {
        if (tamuData[g][1]) {
          guests.push({
            no: tamuData[g][0],
            name: tamuData[g][1],
            url: tamuData[g][2],
            date: tamuData[g][3]
          });
        }
      }

      return ContentService.createTextOutput(JSON.stringify({ status: "success", guests: guests }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Otomatis Rapikan Sheet jika dipanggil langsung atau action=fixSheet
    var cleanResult = cleanAndSetupSpreadsheet();

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Webhook Zaky & Dina Aktif & Spreadsheet Terverifikasi!",
      detail: cleanResult,
      tabs: ["tamu", "album foto tamu", "amplop & kado"]
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle HTTP POST Requests
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    // ===================================================
    // 1. FLOW GENERATE / INPUT NAMA TAMU (TAB: "tamu")
    // ===================================================
    if (data.type === "addGuest" || data.type === "guest") {
      var tamuSheet = getTamuSheet(ss);
      var guestName = (data.name || "").trim();

      if (!guestName || guestName === "Tamu Undangan") {
        return ContentService.createTextOutput(JSON.stringify({
          status: "ignored",
          message: "Nama tamu kosong atau default"
        })).setMimeType(ContentService.MimeType.JSON);
      }

      var guestUrl = data.url || "";
      var timeStr = formatTanggalIndonesia(new Date());
      var waFormula = getWaFormula(guestName, guestUrl);

      // Cek apakah nama tamu sudah ada agar tidak duplikat
      var values = tamuSheet.getDataRange().getValues();
      var existingRow = -1;

      for (var r = 1; r < values.length; r++) {
        var existingName = (values[r][1] || "").toString().trim().toLowerCase();
        if (existingName === guestName.toLowerCase()) {
          existingRow = r + 1;
          break;
        }
      }

      if (existingRow > 0) {
        // Update baris tamu yang sudah ada
        tamuSheet.getRange(existingRow, 3).setValue(guestUrl);  // Link Undangan
        tamuSheet.getRange(existingRow, 4).setValue(timeStr);   // Tgl Pembuatan
        tamuSheet.getRange(existingRow, 5).setValue(waFormula); // Kirim WhatsApp
        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          action: "updated",
          message: "Data tamu '" + guestName + "' berhasil diperbarui di tab tamu!"
        })).setMimeType(ContentService.MimeType.JSON);
      } else {
        // Tambahkan baris baru
        var nextNo = Math.max(1, tamuSheet.getLastRow());
        tamuSheet.appendRow([
          nextNo,
          guestName,
          guestUrl,
          timeStr,
          waFormula
        ]);
        var lastRow = tamuSheet.getLastRow();
        tamuSheet.setRowHeight(lastRow, 28);
        tamuSheet.getRange(lastRow, 1).setHorizontalAlignment("center");
        tamuSheet.getRange(lastRow, 2).setFontWeight("bold");
        tamuSheet.getRange(lastRow, 4).setHorizontalAlignment("center");
        tamuSheet.getRange(lastRow, 5).setHorizontalAlignment("center");

        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          action: "created",
          message: "Tamu '" + guestName + "' berhasil dicatat di tab tamu!"
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // ===================================================
    // 2. FLOW LIVE ALBUM FOTO (TAB: "album foto tamu" & GOOGLE DRIVE)
    // ===================================================
    if (data.image) {
      var mainFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      var uploaderName = (data.guestName || "Tamu Undangan").trim();
      var subFolders = mainFolder.getFoldersByName(uploaderName);
      var targetFolder;

      if (subFolders.hasNext()) {
        targetFolder = subFolders.next();
      } else {
        targetFolder = mainFolder.createFolder(uploaderName);
      }

      var base64Data = data.image.split(',')[1] || data.image;
      var decoded = Utilities.base64Decode(base64Data);
      var fileName = data.fileName || (uploaderName + "_" + Date.now() + ".jpg");
      var blob = Utilities.newBlob(decoded, "image/jpeg", fileName);

      var file = targetFolder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      if (data.caption) {
        file.setDescription("Catatan Momen: " + data.caption);
      }

      var directPhotoUrl = "https://lh3.googleusercontent.com/d/" + file.getId();
      var uploadTimeStr = formatTanggalUpload(new Date());

      // Catat ke Tab "album foto tamu": Nama Tamu, Data Foto, Catatan Foto, Waktu Upload
      var albumSheet = getAlbumSheet(ss);
      albumSheet.appendRow([
        uploaderName,
        directPhotoUrl,
        data.caption || "",
        uploadTimeStr
      ]);
      var lastPhotoRow = albumSheet.getLastRow();
      albumSheet.setRowHeight(lastPhotoRow, 28);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        fileId: file.getId(),
        viewUrl: directPhotoUrl
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ===================================================
    // 3. KONFIRMASI AMPLOP DIGITAL & KADO (TAB: "amplop & kado")
    // ===================================================
    if (data.type === "confirmGift" || data.type === "gift" || data.type === "amplop" || data.type === "kado") {
      var amplopSheet = getAmplopSheet(ss);
      var senderName = (data.name || "Tamu Undangan").trim();
      var giftType = (data.giftType || "QRIS").trim();
      var rawAmount = (data.amount || "").toString().trim();
      var note = (data.note || "").trim();
      var timeStr = formatTanggalIndonesia(new Date());

      // Format nominal jika diisi (khusus QRIS atau transfer)
      var displayAmount = "-";
      if (rawAmount) {
        var numOnly = rawAmount.replace(/[^0-9]/g, "");
        if (numOnly) {
          displayAmount = "Rp " + Number(numOnly).toLocaleString("id-ID");
        } else {
          displayAmount = rawAmount;
        }
      }

      var nextNo = Math.max(1, amplopSheet.getLastRow());
      amplopSheet.appendRow([
        nextNo,
        timeStr,
        senderName,
        giftType,
        displayAmount,
        note || "-"
      ]);

      var lastRow = amplopSheet.getLastRow();
      amplopSheet.setRowHeight(lastRow, 28);
      amplopSheet.getRange(lastRow, 1).setHorizontalAlignment("center");
      amplopSheet.getRange(lastRow, 2).setHorizontalAlignment("center");
      amplopSheet.getRange(lastRow, 3).setFontWeight("bold");
      amplopSheet.getRange(lastRow, 4).setHorizontalAlignment("center");
      amplopSheet.getRange(lastRow, 5).setHorizontalAlignment("right");

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "recorded",
        message: "Konfirmasi " + giftType + " dari " + senderName + " berhasil dicatat di tab amplop & kado!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ===================================================
    // 4. RSVP KEHADIRAN (OPSIONAL)
    // ===================================================
    if (data.type === "rsvp") {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "RSVP diterima"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "ignored",
      message: "Tipe request tidak dikenal"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
