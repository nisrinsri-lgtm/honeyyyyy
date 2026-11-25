/* ==========================================================================
   HONEY SCENT — Shared Frontend Logic (script.js)
   ========================================================================== */

// ตั้งค่า URL สำหรับเชื่อมต่อ Google Apps Script และ Google Sheet CSV
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbypzA34vlC5KySlnnPEK4gZyoQg5jGDMAWvQgW6Nvz_aEfxhJXghc9CIHm8cShCCSTy/exec';
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS_thwMbd3aGLqonGkMxBgfSMXRo4zIPKBuO4t9xk96Kj6dalqaxSQEs2qb4ZFekAdtZ2lB2RGjap8q/pub?gid=0&single=true&output=csv';

document.addEventListener('DOMContentLoaded', () => {
  // 1. ทำงานเมื่ออยู่หน้า product.html (ตรวจสอบจาก element #product-list)
  if (document.getElementById('product-list')) {
    initProductPage();
  }

  // 2. ทำงานเมื่ออยู่หน้า order.html (ตรวจสอบจาก element #orderForm)
  if (document.getElementById('orderForm')) {
    initOrderPage();
  }

  // 3. ทำงานเมื่ออยู่หน้า admin.html (ตรวจสอบจาก element #ordersTable)
  if (document.getElementById('ordersTable')) {
    initAdminPage();
  }
});

/* ==========================================================================
   1. PRODUCT PAGE (product.html)
   ========================================================================== */
function initProductPage() {
  const filterBar = document.getElementById('filter-bar');
  const productList = document.getElementById('product-list');

  // อ่านค่า ?mood=xxx จาก URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  let activeMood = (urlParams.get('mood') || 'all').toLowerCase();

  const moods = [
    { key: 'all', label: 'ทั้งหมด' },
    { key: 'fresh', label: 'Fresh' },
    { key: 'sweet', label: 'Sweet' },
    { key: 'confident', label: 'Confident' },
    { key: 'romance', label: 'Romance' }
  ];

  // สร้างปุ่มกรองตาม Mood
  function renderFilterButtons() {
    if (!filterBar) return;
    filterBar.innerHTML = moods.map(m => {
      const isActive = activeMood === m.key ? 'active' : '';
      const dotHtml = m.key !== 'all'
        ? `<span class="dot" style="background-color: var(--mood-${m.key});"></span>`
        : '';
      return `<button type="button" class="filter-btn ${isActive}" data-mood="${m.key}">${dotHtml}${m.label}</button>`;
    }).join('');

    // ผูก Event คลิกปุ่มกรอง
    filterBar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeMood = btn.getAttribute('data-mood');
        renderFilterButtons();
        renderProducts(allProducts);
      });
    });
  }

  // แสดงผลการ์ดสินค้า
  function renderProducts(products) {
    const filtered = activeMood === 'all'
      ? products
      : products.filter(p => p.mood.toLowerCase() === activeMood);

    if (filtered.length === 0) {
      productList.innerHTML = '<p style="text-align:center; grid-column: 1 / -1; color: var(--text-secondary);">ไม่พบสินค้าในหมวดหมู่นี้</p>';
      return;
    }

    productList.innerHTML = filtered.map(product => {
      const orderUrl = `order.html?item=${encodeURIComponent(product.name)}&price=${encodeURIComponent(product.price)}`;
      return `
        <article class="product-card" data-mood="${product.mood}">
          <div class="product-image-wrap">
            <img src="${product.image}" alt="${product.name}" loading="lazy">
            <span class="product-size-tag">${product.size}</span>
          </div>
          <div class="product-body">
            <div class="product-mood-label">
              <span class="dot" style="background-color: var(--mood-${product.mood});"></span>
              <span>${product.mood}</span>
            </div>
            <h3 class="product-title">${product.name}</h3>
            <p class="product-desc">${product.description}</p>
            <div class="product-footer">
              <span class="product-price">฿${Number(product.price).toLocaleString()}</span>
              <a href="${orderUrl}" class="btn btn-sm">สั่งซื้อ</a>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  let allProducts = [];
  renderFilterButtons();

  // โหลดข้อมูลสินค้าจาก products.json
  fetch('products.json')
    .then(response => {
      if (!response.ok) throw new Error('ไม่สามารถโหลดไฟล์ products.json ได้');
      return response.json();
    })
    .then(data => {
      allProducts = data;
      renderProducts(allProducts);
    })
    .catch(error => {
      console.error('Error loading products:', error);
      productList.innerHTML = '<p style="text-align:center; grid-column: 1 / -1; color: var(--text-secondary);">เกิดข้อผิดพลาดในการโหลดรายการสินค้า</p>';
    });
}

/* ==========================================================================
   2. ORDER PAGE (order.html)
   ========================================================================== */
function initOrderPage() {
  const orderForm = document.getElementById('orderForm');
  const itemsInput = document.getElementById('items');
  const totalInput = document.getElementById('total');

  // อ่านค่า item และ price จาก URL parameter แล้วเติมลงฟอร์มอัตโนมัติ
  const urlParams = new URLSearchParams(window.location.search);
  const itemParam = urlParams.get('item');
  const priceParam = urlParams.get('price');

  if (itemParam && itemsInput) {
    itemsInput.value = itemParam;
  }
  if (priceParam && totalInput) {
    totalInput.value = priceParam;
  }

  // จัดการเมื่อกดปุ่ม "ยืนยันสั่งซื้อ"
  orderForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const submitBtn = orderForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'กำลังส่งคำสั่งซื้อ...';
    }

    const payload = {
      customerName: document.getElementById('customerName').value.trim(),
      contact: document.getElementById('contact').value.trim(),
      items: document.getElementById('items').value.trim(),
      total: document.getElementById('total').value.trim(),
      note: document.getElementById('note').value.trim()
    };

    // ส่งข้อมูลแบบ POST เป็น JSON string ธรรมดา (ไม่ตั้ง headers เอง และไม่ใช้ no-cors)
    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    .then(() => {
      window.location.href = 'thankyou.html';
    })
    .catch(error => {
      console.error(error);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'ยืนยันสั่งซื้อ';
      }
    });
  });
}

/* ==========================================================================
   3. ADMIN PAGE (admin.html)
   ========================================================================== */
function initAdminPage() {
  const tbody = document.querySelector('#ordersTable tbody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">กำลังโหลดข้อมูลคำสั่งซื้อ...</td></tr>';

  fetch(CSV_URL)
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
        const contact = escapeHTML(row[2] || '-');
        const items = escapeHTML(row[3] || '-');
        const total = escapeHTML(row[4] || '-');
        const note = escapeHTML(row[5] || '-');

        return `
          <tr>
            <td>${timestamp}</td>
            <td>${customerName}</td>
            <td>${contact}</td>
            <td>${items}</td>
            <td>${total}</td>
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

// ฟังก์ชัน Parse CSV แบบเขียนเอง รองรับเครื่องหมายคำพูด (Quotes), คอมม่าในข้อความ และการขึ้นบรรทัดใหม่
function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentVal += '"';
        i++; // ข้ามเครื่องหมายคำพูดซ้อน ""
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // รองรับ CRLF (\r\n)
      }
      currentRow.push(currentVal.trim());
      rows.push(currentRow);
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  // เก็บข้อมูลตัวสุดท้ายถ้ายังมีค้างอยู่
  if (currentVal !== '' || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    rows.push(currentRow);
  }

  return rows;
}

// ป้องกัน XSS เวลาแสดงผลข้อมูลจาก CSV ลงในตาราง HTML
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}