/* ==========================================================================
   3. ADMIN PAGE (admin.html)
   ========================================================================== */
function initAdminPage() {
  const tbody = document.querySelector('#ordersTable tbody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">กำลังโหลดข้อมูลคำสั่งซื้อ...</td></tr>';

  // เติม timestamp ต่อท้ายเพื่อป้องกัน Browser จำค่า CSV เก่า
  const freshCsvUrl = `${CSV_URL}&t=${Date.now()}`;

  fetch(freshCsvUrl)
    .then(response => {
      if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูล CSV ได้');
      return response.text();
    })
    .then(csvText => {
      const rows = parseCSV(csvText);

      // ตัดแถวหัวตาราง (index 0) และกรองแถวว่างออก
      const dataRows = rows.slice(1).filter(row => row.some(cell => cell.trim() !== ''));

      if (dataRows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">ยังไม่มีรายการสั่งซื้อ</td></tr>';
        return;
      }

      // เรียงจากรายการล่าสุดขึ้นก่อน
      dataRows.reverse();

      tbody.innerHTML = dataRows.map(row => {
        const timestamp = escapeHTML(row[0] || '-');
        const customerName = escapeHTML(row[1] || '-');
        const contact = escapeHTML((row[2] || '-').replace(/^'/, '')); // ตัด ' นำหน้าออกถ้ามี
        const items = escapeHTML(row[3] || '-');
        const rawTotal = Number(row[4]);
        const total = !isNaN(rawTotal) && row[4] !== '' ? `฿${rawTotal.toLocaleString()}` : escapeHTML(row[4] || '-');
        const note = escapeHTML(row[5] || '-');

        return `
          <tr>
            <td style="white-space: nowrap;">${timestamp}</td>
            <td>${customerName}</td>
            <td>${contact}</td>
            <td>${items}</td>
            <td style="white-space: nowrap;">${total}</td>
            <td>${note}</td>
          </tr>
        `;
      }).join('');
    })
    .catch(error => {
      console.error('Error loading CSV:', error);
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>';
    });
}