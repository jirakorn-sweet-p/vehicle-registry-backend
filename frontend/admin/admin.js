// admin.js
(function () {
  const TOKEN_KEY = 'vr_admin_token';
  const USER_KEY = 'vr_admin_username';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setSession(token, username) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, username);
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  async function apiFetch(path, options = {}) {
    const token = getToken();
    const res = await fetch(`${window.API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });

    if (res.status === 401) {
      clearSession();
      window.location.href = 'login.html';
      throw new Error('Unauthorized');
    }

    return res;
  }

  // ---------- LOGIN PAGE ----------
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    // ถ้า login อยู่แล้วให้ไปหน้า dashboard เลย
    if (getToken()) {
      window.location.href = 'dashboard.html';
    }

    const alertBox = document.getElementById('alertBox');
    const loginBtn = document.getElementById('loginBtn');

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      alertBox.innerHTML = '';
      loginBtn.disabled = true;
      loginBtn.innerHTML = '<span class="spinner"></span>กำลังเข้าสู่ระบบ...';

      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;

      try {
        const res = await fetch(`${window.API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        const data = await res.json();

        if (!res.ok) {
          alertBox.innerHTML = `<div class="msg msg-error">${data.error || 'เข้าสู่ระบบไม่สำเร็จ'}</div>`;
          return;
        }

        setSession(data.token, data.username);
        window.location.href = 'dashboard.html';
      } catch (err) {
        console.error(err);
        alertBox.innerHTML = `<div class="msg msg-error">ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้</div>`;
      } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'เข้าสู่ระบบ';
      }
    });
  }

  // ---------- DASHBOARD PAGE ----------
  const tableBody = document.getElementById('tableBody');
  if (tableBody) {
    if (!getToken()) {
      window.location.href = 'login.html';
      return;
    }

    document.getElementById('whoami').textContent = localStorage.getItem(USER_KEY) || '';
    document.getElementById('logoutBtn').addEventListener('click', () => {
      clearSession();
      window.location.href = 'login.html';
    });

    const alertBox = document.getElementById('alertBox');
    const detailCard = document.getElementById('detailCard');
    const detailContent = document.getElementById('detailContent');

    const ownerLabel = (v) => (v.owner_type === 'self' ? 'ตัวเอง' : 'ผู้อื่น');

    function renderDetail(person) {
      const cars = person.vehicles.filter((v) => v.vehicle_type === 'car');
      const motos = person.vehicles.filter((v) => v.vehicle_type === 'motorcycle');

      function vehicleTable(list, label) {
        if (list.length === 0) return `<p class="muted">ไม่มี${label}</p>`;
        return `
          <div class="table-wrap" style="margin-bottom:16px;">
            <table>
              <thead><tr><th>#</th><th>ยี่ห้อ</th><th>สี</th><th>ทะเบียน</th><th>จังหวัด</th><th>ผู้ครอบครอง</th></tr></thead>
              <tbody>
                ${list.map((v, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${v.brand}</td>
                    <td>${v.color}</td>
                    <td>${v.plate}</td>
                    <td>${v.province}</td>
                    <td>${v.owner_name} (${ownerLabel(v)})</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      detailContent.innerHTML = `
        <p><strong>${person.rank} ${person.first_name} ${person.last_name}</strong> — ${person.unit} — โทร ${person.phone}</p>
        <div class="detail-section">
          <h4>รถยนต์ (${cars.length} คัน)</h4>
          ${vehicleTable(cars, 'รถยนต์')}
          <h4>รถจักรยานยนต์ (${motos.length} คัน)</h4>
          ${vehicleTable(motos, 'รถจักรยานยนต์')}
        </div>
        <button class="btn-secondary btn-small" id="closeDetailBtn">ปิดรายละเอียด</button>
      `;
      detailCard.classList.remove('hidden');
      document.getElementById('closeDetailBtn').addEventListener('click', () => {
        detailCard.classList.add('hidden');
      });
      detailCard.scrollIntoView({ behavior: 'smooth' });
    }

    async function viewDetail(id) {
      try {
        const res = await apiFetch(`/api/personnel/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        renderDetail(data);
      } catch (err) {
        console.error(err);
        alertBox.innerHTML = `<div class="msg msg-error">ไม่สามารถโหลดรายละเอียดได้</div>`;
      }
    }

    async function deletePerson(id) {
      if (!confirm('ยืนยันการลบข้อมูลนี้หรือไม่?')) return;
      try {
        const res = await apiFetch(`/api/personnel/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        loadData();
      } catch (err) {
        console.error(err);
        alertBox.innerHTML = `<div class="msg msg-error">ไม่สามารถลบข้อมูลได้</div>`;
      }
    }

    function formatDate(d) {
      const date = new Date(d);
      return date.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
    }

    async function loadData() {
      tableBody.innerHTML = `<tr><td colspan="8">กำลังโหลดข้อมูล...</td></tr>`;
      try {
        const res = await apiFetch('/api/personnel');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        if (data.length === 0) {
          tableBody.innerHTML = `<tr><td colspan="8">ยังไม่มีข้อมูล</td></tr>`;
          return;
        }

        tableBody.innerHTML = data.map((p) => `
          <tr>
            <td>${p.rank}</td>
            <td>${p.first_name} ${p.last_name}</td>
            <td>${p.unit}</td>
            <td>${p.phone}</td>
            <td><span class="badge">${p.car_count}</span></td>
            <td><span class="badge">${p.motorcycle_count}</span></td>
            <td>${formatDate(p.created_at)}</td>
            <td>
              <button class="btn-secondary btn-small" data-view="${p.id}">ดูรายละเอียด</button>
              <button class="btn-danger" data-delete="${p.id}">ลบ</button>
            </td>
          </tr>
        `).join('');

        tableBody.querySelectorAll('[data-view]').forEach((btn) => {
          btn.addEventListener('click', () => viewDetail(btn.dataset.view));
        });
        tableBody.querySelectorAll('[data-delete]').forEach((btn) => {
          btn.addEventListener('click', () => deletePerson(btn.dataset.delete));
        });
      } catch (err) {
        console.error(err);
        tableBody.innerHTML = `<tr><td colspan="8">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>`;
      }
    }

    loadData();
  }
})();
