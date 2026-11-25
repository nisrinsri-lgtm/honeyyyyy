function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // จัดรูปแบบวันเวลาให้เป็นโซนเวลาไทย (dd/MM/yyyy HH:mm:ss)
    var timestamp = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");

    sheet.appendRow([
      timestamp,
      data.customerName || "-",
      "'" + (data.contact || "-"), // ใส่ ' นำหน้าเพื่อป้องกัน Google Sheet ตัดเลข 0 ตัวหน้าของเบอร์โทรทิ้ง
      data.items || "-",
      data.total || 0,
      data.note || "-"
    ]);

    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.message).setMimeType(ContentService.MimeType.TEXT);
  }
}