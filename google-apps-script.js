/**
 * ===================================================
 * GOOGLE APPS SCRIPT - ZAKY & DINA WEDDING
 * Integrasi 1 Tab Tunggal:
 * - Buku Tamu & Link Khusus Undangan
 * - Tombol Klik Kirim WhatsApp Langsung di Sheet
 * - Konfirmasi Kehadiran (RSVP) & Doa Restu
 * - Upload Foto Live Album ke Google Drive
 * 
 * SPREADSHEET ID: 1IWtFG8lAVZSTDJPlKeG4bYC6L8j1MJ6WlZBcCglB9Ps
 * DRIVE FOLDER ID: 1eYoURu3wO9U0gouLlvFx6F51xy11VesF
 * ===================================================
 */

var SPREADSHEET_ID = "1IWtFG8lAVZSTDJPlKeG4bYC6L8j1MJ6WlZBcCglB9Ps";
var DRIVE_FOLDER_ID = "1eYoURu3wO9U0gouLlvFx6F51xy11VesF";

/**
 * Helper untuk mengambil Sheet Utama tunggal & menghapus tab tambahan jika ada
 */
function getMainSheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheets = ss.getSheets();

  // 1. Pilih sheet utama (prioritaskan yang BUKAN 'Daftar Tamu')
  var sheet = sheets[0];
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getName() !== "Daftar Tamu") {
      sheet = sheets[i];
      break;
    }
  }

  // 2. Hapus tab "Daftar Tamu" jika ada tab lain agar hanya tersisa 1 tab tunggal
  var extraSheet = ss.getSheetByName("Daftar Tamu");
  if (extraSheet && sheets.length > 1) {
    try {
      ss.deleteSheet(extraSheet);
    } catch (e) {}
  }

  // 3. Pastikan Header baris 1 TEPAT 7 KOLOM
  sheet.getRange(1, 1, 1, 7).setValues([[
    "No",
    "Nama Tamu",
    "Status / Kehadiran",
    "Link Undangan",
    "Ucapan & Doa Restu",
    "Waktu",
    "Kirim WhatsApp Langsung"
  ]]);
  sheet.getRange(1, 1, 1, 7)
    .setFontWeight("bold")
    .setBackground("#3B6790")
    .setFontColor("#FFFFFF");
  sheet.setFrozenRows(1);

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
    "🗓️ *Sabtu & Minggu, 20 & 27 Maret 2027*\n\n" +
    "Detail acara, lokasi, dan konfirmasi kehadiran dapat diakses melalui tautan undangan berikut:\n" +
    "🔗 " + guestUrl + "\n\n" +
    "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir.\n\n" +
    "Wassalamu’alaikum Warahmatullahi Wabarakatuh\n" +
    "Kami yang berbahagia,\n" +
    "*Zaky & Dina*";

  var encoded = encodeURIComponent(text);
  return '=HYPERLINK("https://api.whatsapp.com/send?text=' + encoded + '", "💬 Kirim WhatsApp")';
}

/**
 * Handle HTTP GET Requests
 * Mengambil ucapan selamat (hanya yang memiliki pesan doa restu)
 */
function doGet(e) {
  try {
    var sheet = getMainSheet();
    var data = sheet.getDataRange().getValues();
    var wishes = [];

    // Baca mulai baris ke-2 (melewati baris header)
    for (var i = 1; i < data.length; i++) {
      var name = data[i][1] || data[i][0];
      var status = data[i][2] || "Dateng";
      var message = data[i][4] || "";
      var time = data[i][5] || "Baru saja";

      // Hanya tampilkan di ucapan website jika benar-benar ada ucapan doa
      if (message && !message.toString().startsWith("http") && status !== "Siap Dikirim") {
        wishes.push({
          name: name,
          status: status,
          message: message,
          time: time
        });
      }
    }

    wishes.reverse();
    return ContentService.createTextOutput(JSON.stringify({ status: "success", wishes: wishes }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString(), wishes: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle HTTP POST Requests
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getMainSheet();

    // ===================================================
    // 1. INPUT / PENCATATAN NAMA TAMU UNDANGAN (DARI GENERATOR)
    // ===================================================
    if (data.type === "addGuest" || data.type === "guest") {
      var guestName = (data.name || "").trim();
      if (!guestName || guestName === "Tamu Undangan") {
        return ContentService.createTextOutput(JSON.stringify({ status: "ignored", message: "Nama tamu kosong" }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      var guestUrl = data.url || "";
      var now = new Date();
      var timeStr = now.toLocaleDateString("id-ID", {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      var waFormula = getWaFormula(guestName, guestUrl);

      // Cek apakah nama tamu sudah ada agar tidak membuat baris duplikat
      var allData = sheet.getDataRange().getValues();
      var existingRow = -1;

      for (var r = 1; r < allData.length; r++) {
        var existingName = (allData[r][1] || allData[r][0] || "").toString().trim().toLowerCase();
        if (existingName === guestName.toLowerCase()) {
          existingRow = r + 1;
          break;
        }
      }

      if (existingRow > 0) {
        // Update baris yang sudah ada
        sheet.getRange(existingRow, 4).setValue(guestUrl); // Link Undangan
        sheet.getRange(existingRow, 6).setValue(timeStr);  // Waktu
        sheet.getRange(existingRow, 7).setValue(waFormula); // Link WA
        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          action: "updated",
          message: "Data tamu '" + guestName + "' berhasil diperbarui di sheet!"
        })).setMimeType(ContentService.MimeType.JSON);
      } else {
        // Tambahkan baris baru
        var nextNo = Math.max(1, sheet.getLastRow());
        sheet.appendRow([
          nextNo,
          guestName,
          "Siap Dikirim",
          guestUrl,
          "",
          timeStr,
          waFormula
        ]);
        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          action: "created",
          message: "Tamu '" + guestName + "' berhasil dicatat dengan link WhatsApp!"
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // ===================================================
    // 2. RSVP & UCAPAN DOA RESTU TAMU
    // ===================================================
    if (data.type === "rsvp") {
      var rsvpName = (data.name || "Tamu Undangan").trim();
      var rsvpStatus = data.status === "hadir" ? "Dateng" : "Maaf lagi repot";
      var rsvpMsg = data.message || "";
      var nowRsvp = new Date();
      var rsvpTime = nowRsvp.toLocaleDateString("id-ID", {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Cek apakah tamu ini sudah tercatat sebelumnya di sheet
      var rows = sheet.getDataRange().getValues();
      var foundRow = -1;

      for (var k = 1; k < rows.length; k++) {
        var rowName = (rows[k][1] || rows[k][0] || "").toString().trim().toLowerCase();
        if (rowName === rsvpName.toLowerCase()) {
          foundRow = k + 1;
          break;
        }
      }

      if (foundRow > 0) {
        sheet.getRange(foundRow, 3).setValue(rsvpStatus); // Status Kehadiran
        sheet.getRange(foundRow, 5).setValue(rsvpMsg);    // Ucapan Doa
        sheet.getRange(foundRow, 6).setValue(rsvpTime);   // Waktu Kirim
      } else {
        var num = Math.max(1, sheet.getLastRow());
        sheet.appendRow([
          num,
          rsvpName,
          rsvpStatus,
          "",
          rsvpMsg,
          rsvpTime,
          "-"
        ]);
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "RSVP berhasil disimpan di sheet!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ===================================================
    // 3. FOTO LIVE ALBUM (GOOGLE DRIVE FOLDER)
    // ===================================================
    if (data.image) {
      var mainFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      var uploaderName = data.guestName || "Tamu Undangan";
      var subFolders = mainFolder.getFoldersByName(uploaderName);
      var targetFolder;

      if (subFolders.hasNext()) {
        targetFolder = subFolders.next();
      } else {
        targetFolder = mainFolder.createFolder(uploaderName);
      }

      var base64Data = data.image.split(',')[1] || data.image;
      var decoded = Utilities.base64Decode(base64Data);
      var blob = Utilities.newBlob(decoded, "image/jpeg", data.fileName || "foto.jpg");

      var file = targetFolder.createFile(blob);
      if (data.caption) {
        file.setDescription("Catatan Momen: " + data.caption);
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        fileId: file.getId(),
        viewUrl: file.getUrl()
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
