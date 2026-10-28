/**
 * ===================================================
 * GOOGLE APPS SCRIPT - ZAKY & DINA WEDDING
 * Struktur 2 Tab Google Spreadsheet:
 * 1. "tamu" (Nomor, Nama, Link Undangan, Tgl Pembuatan, Kirim WhatsApp)
 * 2. "album foto tamu" (Nama Tamu, Data Foto, Catatan Foto, Waktu Upload)
 * 
 * SPREADSHEET ID: 1IWtFG8lAVZSTDJPlKeG4bYC6L8j1MJ6WlZBcCglB9Ps
 * DRIVE FOLDER ID: 1eYoURu3wO9U0gouLlvFx6F51xy11VesF
 * ===================================================
 */

var SPREADSHEET_ID = "1IWtFG8lAVZSTDJPlKeG4bYC6L8j1MJ6WlZBcCglB9Ps";
var DRIVE_FOLDER_ID = "1eYoURu3wO9U0gouLlvFx6F51xy11VesF";

/**
 * Tab 1: Mengambil / Menyiapkan Sheet "tamu"
 */
function getTamuSheet(ss) {
  var sheet = ss.getSheetByName("tamu");
  if (!sheet) {
    // Jika ada sheet pertama yang bukan "album foto tamu", rename jadi "tamu"
    var firstSheet = ss.getSheets()[0];
    if (firstSheet && firstSheet.getName() !== "album foto tamu") {
      sheet = firstSheet;
      sheet.setName("tamu");
    } else {
      sheet = ss.insertSheet("tamu");
    }
  }

  // Hapus tab lama "Daftar Tamu" jika masih ada agar bersih
  var oldSheet = ss.getSheetByName("Daftar Tamu");
  if (oldSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(oldSheet); } catch (e) {}
  }

  // Header 5 Kolom Sesuai Permintaan
  sheet.getRange(1, 1, 1, 5).setValues([[
    "Nomor",
    "Nama",
    "Link Undangan",
    "Tgl Pembuatan",
    "Kirim WhatsApp"
  ]]);
  sheet.getRange(1, 1, 1, 5)
    .setFontWeight("bold")
    .setBackground("#3B6790")
    .setFontColor("#FFFFFF");
  sheet.setFrozenRows(1);

  return sheet;
}

/**
 * Tab 2: Mengambil / Menyiapkan Sheet "album foto tamu"
 */
function getAlbumSheet(ss) {
  var sheet = ss.getSheetByName("album foto tamu");
  if (!sheet) {
    sheet = ss.insertSheet("album foto tamu");
  }

  // Header 4 Kolom Sesuai Permintaan
  sheet.getRange(1, 1, 1, 4).setValues([[
    "Nama Tamu",
    "Data Foto",
    "Catatan Foto",
    "Waktu Upload"
  ]]);
  sheet.getRange(1, 1, 1, 4)
    .setFontWeight("bold")
    .setBackground("#D896A8")
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

    // 3. Default: Respon Sehat (Status OK)
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Webhook Zaky & Dina Aktif",
      tabs: ["tamu", "album foto tamu"]
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
      var now = new Date();
      var timeStr = now.toLocaleDateString("id-ID", {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
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
      var nowUpload = new Date();
      var uploadTimeStr = nowUpload.toLocaleDateString("id-ID", {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Catat ke Tab "album foto tamu": Nama Tamu, Data Foto, Catatan Foto, Waktu Upload
      var albumSheet = getAlbumSheet(ss);
      albumSheet.appendRow([
        uploaderName,
        directPhotoUrl,
        data.caption || "",
        uploadTimeStr
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        fileId: file.getId(),
        viewUrl: directPhotoUrl
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ===================================================
    // 3. RSVP KEHADIRAN (OPSIONAL)
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
