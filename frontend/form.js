// form.js
(function () {
  const carCountInput = document.getElementById('carCount');
  const motoCountInput = document.getElementById('motoCount');
  const carContainer = document.getElementById('carContainer');
  const motoContainer = document.getElementById('motoContainer');
  const form = document.getElementById('registrationForm');
  const alertBox = document.getElementById('alertBox');
  const submitBtn = document.getElementById('submitBtn');

  const PROVINCES = [
    "กรุงเทพมหานคร","กระบี่","กาญจนบุรี","กาฬสินธุ์","กำแพงเพชร","ขอนแก่น","จันทบุรี","ฉะเชิงเทรา",
    "ชลบุรี","ชัยนาท","ชัยภูมิ","ชุมพร","เชียงราย","เชียงใหม่","ตรัง","ตราด","ตาก","นครนายก",
    "นครปฐม","นครพนม","นครราชสีมา","นครศรีธรรมราช","นครสวรรค์","นนทบุรี","นราธิวาส","น่าน",
    "บึงกาฬ","บุรีรัมย์","ปทุมธานี","ประจวบคีรีขันธ์","ปราจีนบุรี","ปัตตานี","พระนครศรีอยุธยา",
    "พะเยา","พังงา","พัทลุง","พิจิตร","พิษณุโลก","เพชรบุรี","เพชรบูรณ์","แพร่","ภูเก็ต","มหาสารคาม",
    "มุกดาหาร","แม่ฮ่องสอน","ยโสธร","ยะลา","ร้อยเอ็ด","ระนอง","ระยอง","ราชบุรี","ลพบุรี","ลำปาง",
    "ลำพูน","เลย","ศรีสะเกษ","สกลนคร","สงขลา","สตูล","สมุทรปราการ","สมุทรสงคราม","สมุทรสาคร",
    "สระแก้ว","สระบุรี","สิงห์บุรี","สุโขทัย","สุพรรณบุรี","สุราษฎร์ธานี","สุรินทร์","หนองคาย",
    "หนองบัวลำภู","อ่างทอง","อำนาจเจริญ","อุดรธานี","อุตรดิตถ์","อุทัยธานี","อุบลราชธานี"
  ];

  function provinceOptions() {
    return PROVINCES.map((p) => `<option value="${p}">${p}</option>`).join('');
  }

  function buildVehicleBlock(type, index) {
    const label = type === 'car' ? 'รถยนต์' : 'รถจักรยานยนต์';
    const prefix = `${type}-${index}`;
    const div = document.createElement('div');
    div.className = 'vehicle-block';
    div.dataset.type = type;
    div.innerHTML = `
      <h3>${label} คันที่ ${index + 1}</h3>
      <div class="form-row">
        <div>
          <label>ยี่ห้อ *</label>
          <input type="text" name="${prefix}-brand" required />
        </div>
        <div>
          <label>สี *</label>
          <input type="text" name="${prefix}-color" required />
        </div>
      </div>
      <div class="form-row">
        <div>
          <label>ทะเบียน *</label>
          <input type="text" name="${prefix}-plate" required />
        </div>
        <div>
          <label>จังหวัด *</label>
          <select name="${prefix}-province" required>
            <option value="">-- เลือกจังหวัด --</option>
            ${provinceOptions()}
          </select>
        </div>
      </div>
      <label>ผู้ครอบครองรถ *</label>
      <div class="owner-choice">
        <label><input type="radio" name="${prefix}-ownerType" value="self" checked /> ตัวเอง</label>
        <label><input type="radio" name="${prefix}-ownerType" value="other" /> ผู้อื่น</label>
      </div>
      <div class="owner-other-wrap hidden">
        <label>ระบุชื่อผู้ครอบครองรถ *</label>
        <input type="text" name="${prefix}-ownerName" placeholder="ชื่อ-นามสกุลผู้ครอบครองรถ" />
      </div>
    `;

    const radios = div.querySelectorAll(`input[name="${prefix}-ownerType"]`);
    const otherWrap = div.querySelector('.owner-other-wrap');
    const ownerNameInput = div.querySelector(`input[name="${prefix}-ownerName"]`);
    radios.forEach((r) => {
      r.addEventListener('change', () => {
        if (r.value === 'other' && r.checked) {
          otherWrap.classList.remove('hidden');
          ownerNameInput.required = true;
        } else if (r.value === 'self' && r.checked) {
          otherWrap.classList.add('hidden');
          ownerNameInput.required = false;
          ownerNameInput.value = '';
        }
      });
    });

    return div;
  }

  function renderVehicleBlocks(container, type, count) {
    container.innerHTML = '';
    const n = Math.max(0, Math.min(20, parseInt(count, 10) || 0));
    for (let i = 0; i < n; i++) {
      container.appendChild(buildVehicleBlock(type, i));
    }
  }

  carCountInput.addEventListener('input', () => {
    renderVehicleBlocks(carContainer, 'car', carCountInput.value);
  });

  motoCountInput.addEventListener('input', () => {
    renderVehicleBlocks(motoContainer, 'moto', motoCountInput.value);
  });

  function collectVehicles(container, type) {
    const blocks = container.querySelectorAll('.vehicle-block');
    const vehicles = [];
    blocks.forEach((block) => {
      const getVal = (suffix) => {
        const el = block.querySelector(`[name$="-${suffix}"]`);
        return el ? el.value.trim() : '';
      };
      const ownerTypeEl = block.querySelector('input[type="radio"]:checked');
      vehicles.push({
        brand: getVal('brand'),
        color: getVal('color'),
        plate: getVal('plate'),
        province: getVal('province'),
        ownerType: ownerTypeEl ? ownerTypeEl.value : 'self',
        ownerName: getVal('ownerName'),
      });
    });
    return vehicles;
  }

  function showAlert(type, text) {
    alertBox.innerHTML = `<div class="msg msg-${type}">${text}</div>`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertBox.innerHTML = '';

    const payload = {
      rank: document.getElementById('rank').value,
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      unit: document.getElementById('unit').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      cars: collectVehicles(carContainer, 'car'),
      motorcycles: collectVehicles(motoContainer, 'moto'),
    };

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span>กำลังบันทึก...';

    try {
      const res = await fetch(`${window.API_BASE_URL}/api/personnel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        const details = data.details ? `<ul>${data.details.map((d) => `<li>${d}</li>`).join('')}</ul>` : '';
        showAlert('error', `${data.error || 'เกิดข้อผิดพลาด'}${details}`);
        return;
      }

      showAlert('success', 'บันทึกข้อมูลเรียบร้อยแล้ว ขอบคุณครับ/ค่ะ');
      form.reset();
      carContainer.innerHTML = '';
      motoContainer.innerHTML = '';
      carCountInput.value = 0;
      motoCountInput.value = 0;
    } catch (err) {
      console.error(err);
      showAlert('error', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'บันทึกข้อมูล';
    }
  });
})();
