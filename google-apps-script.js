/**
 * ===================================================
 * GOOGLE APPS SCRIPT - ZAKY & DINA WEDDING
 * Integrasi:
 * 1. Google Sheets: Buku Tamu / Daftar Tamu Undangan
 * 2. Google Sheets: Data RSVP & Ucapan Selamat
 * 3. Google Drive: Shared Live Photo Album
 * 
 * SPREADSHEET ID: 1IWtFG8lAVZSTDJPlKeG4bYC6L8j1MJ6WlZBcCglB9Ps
 * DRIVE FOLDER ID: 1eYoURu3wO9U0gouLlvFx6F51xy11VesF
 * ===================================================
 */

var SPREADSHEET_ID = "1IWtFG8lAVZSTDJPlKeG4bYC6L8j1MJ6WlZBcCglB9Ps";
var DRIVE_FOLDER_ID = "1eYoURu3wO9U0gouLlvFx6F51xy11VesF";

/**
 * Handle HTTP GET Requests
 * Mengambil ucapan (RSVP) atau daftar tamu
 */
function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getWishes";
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    // 1. Ambil Data Tamu Undangan
    if (action === "getGuests") {
      var guestSheet = ss.getSheetByName("Daftar Tamu");
      var guests = [];
      if (guestSheet && guestSheet.getLastRow() > 1) {
        var guestData = guestSheet.getDataRange().getValues();
        for (var g = 1; g < guestData.length; g++) {
          if (guestData[g][1]) {
            guests.push({
              no: guestData[g][0],
              name: guestData[g][1],
              url: guestData[g][2] || "",
              date: guestData[g][3] || "",
              status: guestData[g][4] || "Siap Dikirim"
            });
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success", guests: guests }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Default: Ambil Ucapan RSVP untuk Tampilan Website
    var rsvpSheet = ss.getSheetByName("Data RSVP") || ss.getActiveSheet();
    var data = rsvpSheet.getDataRange().getValues();
    var wishes = [];

    for (var i = 1; i < data.length; i++) {
      if (data[i][0]) {
        wishes.push({
          name: data[i][0],
          status: data[i][1],
          message: data[i][2],
          time: data[i][3] || "Baru saja"
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
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    // ===================================================
    // 1. PENDAFTARAN / PENCATATAN OTOMATIS NAMA TAMU
    // ===================================================
    if (data.type === "addGuest" || data.type === "guest") {
      var guestSheet = ss.getSheetByName("Daftar Tamu");
      if (!guestSheet) {
        guestSheet = ss.insertSheet("Daftar Tamu");
      }

      // Jika sheet masih baru/kosong, buat header tabel estetik
      if (guestSheet.getLastRow() === 0) {
        guestSheet.appendRow(["No", "Nama Tamu Undangan", "Link Khusus Undangan", "Tanggal Dibuat", "Status Pengiriman"]);
        guestSheet.getRange(1, 1, 1, 5)
          .setFontWeight("bold")
          .setBackground("#3B6790")
          .setFontColor("#FFFFFF");
        guestSheet.setFrozenRows(1);
      }

      var guestName = (data.name || "").trim();
      if (!guestName || guestName === "Tamu Undangan") {
        return ContentService.createTextOutput(JSON.stringify({ status: "ignored", message: "Nama tamu kosong/default" }))
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

      // Periksa apakah nama tamu sudah pernah dicatat sebelumnya
      var existingData = guestSheet.getDataRange().getValues();
      var existingRow = -1;
      for (var r = 1; r < existingData.length; r++) {
        if (existingData[r][1] && existingData[r][1].toString().trim().toLowerCase() === guestName.toLowerCase()) {
          existingRow = r + 1;
          break;
        }
      }

      if (existingRow > 0) {
        // Update tautan & waktu jika nama sudah ada (tidak bikin duplikat)
        guestSheet.getRange(existingRow, 3).setValue(guestUrl);
        guestSheet.getRange(existingRow, 4).setValue(timeStr);
        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          action: "updated",
          message: "Data tamu '" + guestName + "' berhasil diperbarui di spreadsheet!"
        })).setMimeType(ContentService.MimeType.JSON);
      } else {
        // Tambah baris baru
        var nextNo = Math.max(1, guestSheet.getLastRow());
        guestSheet.appendRow([nextNo, guestName, guestUrl, timeStr, "Siap Dikirim"]);
        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          action: "created",
          message: "Tamu '" + guestName + "' berhasil dicatat otomatis di spreadsheet!"
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // ===================================================
    // 2. RSVP & UCAPAN DOA RESTU TAMU
    // ===================================================
    if (data.type === "rsvp") {
      var rsvpSheet = ss.getSheetByName("Data RSVP");
      if (!rsvpSheet) {
        // Cek jika sheet pertama default belum dinamai
        var firstSheet = ss.getActiveSheet();
        if (firstSheet.getName() !== "Daftar Tamu") {
          rsvpSheet = firstSheet;
          rsvpSheet.setName("Data RSVP");
        } else {
          rsvpSheet = ss.insertSheet("Data RSVP");
        }
      }

      if (rsvpSheet.getLastRow() === 0) {
        rsvpSheet.appendRow(["Nama Tamu", "Konfirmasi Kehadiran", "Ucapan & Doa Restu", "Waktu Kirim"]);
        rsvpSheet.getRange(1, 1, 1, 4)
          .setFontWeight("bold")
          .setBackground("#D896A8")
          .setFontColor("#FFFFFF");
        rsvpSheet.setFrozenRows(1);
      }

      var nowRsvp = new Date();
      var rsvpTime = nowRsvp.toLocaleDateString("id-ID", {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });

      rsvpSheet.appendRow([
        data.name || "Tamu Undangan",
        data.status === "hadir" ? "Dateng" : "Maaf lagi repot",
        data.message || "",
        rsvpTime
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "RSVP berhasil disimpan di Google Sheets!"
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
