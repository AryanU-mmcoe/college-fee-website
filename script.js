// script.js - MMCOE Fee Receipt UI logic
const studentsFile = 'students.json'; // local file in repo root

const $ = id => document.getElementById(id);
const toastEl = document.getElementById('toast');
const rc = document.getElementById('receiptCard');
const receiptBody = document.getElementById('receiptBody');

function showToast(msg, timeout = 3000) {
  toastEl.innerText = msg;
  toastEl.classList.add('show');
  toastEl.setAttribute('aria-hidden','false');
  setTimeout(() => { toastEl.classList.remove('show'); toastEl.setAttribute('aria-hidden','true'); }, timeout);
}

async function loadStudents() {
  try {
    const r = await fetch(studentsFile, {cache: "no-store"});
    if (!r.ok) throw new Error('students.json missing or not reachable');
    return await r.json();
  } catch (e) {
    console.error(e);
    showToast('Error loading student database (students.json).');
    return null;
  }
}

function calcAge(dobStr) {
  if (!dobStr) return '-';
  const dob = new Date(dobStr);
  if (isNaN(dob)) return '-';
  const diff = Date.now() - dob.getTime();
  const ageDt = new Date(diff);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
}

function formatCurrency(n) {
  return '₹' + Number(n).toLocaleString('en-IN', {maximumFractionDigits: 0});
}

function normalizePrn(prn) {
  return String(prn).trim().toUpperCase();
}

function isValidPrn(prn) {
  // PRN format: B25<BRANCH><4digits> e.g. B25CE1059
  return /^B25[A-Z]{2}\d{4}$/.test(prn);
}

document.getElementById('btnFetch').addEventListener('click', async (e) => {
  e.preventDefault();
  const prnRaw = $('prn').value || '';
  const nameInput = $('name').value || '';
  const prn = normalizePrn(prnRaw);

  if (!prn) { showToast('Enter PRN (or select student)'); return; }

  // Optionally validate format
  if (!isValidPrn(prn)) {
    // basic warning
    showToast('PRN format looks off. Expected B25<BRANCH><4digits> e.g. B25CS0001');
    // continue attempt anyway
  }

  const db = await loadStudents();
  if (!db) return;

  // Try direct PRN lookup
  let student = db[prn];

  // If user typed name instead, try fuzzy name match
  if (!student && nameInput) {
    const q = nameInput.trim().toLowerCase();
    student = Object.values(db).find(s => (s.name || '').toLowerCase().includes(q));
  }

  // last resort: try case-insensitive key search
  if (!student) {
    const keys = Object.keys(db);
    const matchKey = keys.find(k => k.toUpperCase() === prn.toUpperCase());
    if (matchKey) student = db[matchKey];
  }

  if (!student) {
    alert('Student Not Found!');
    rc.setAttribute('aria-hidden','true');
    rc.style.display = 'none';
    return;
  }

  // compute derived fields
  const remaining = (Number(student.totalFees) || 0) - (Number(student.feesPaid) || 0);
  const dob = student.dob || '';
  const age = calcAge(dob);

  // show receipt
  receiptBody.innerHTML = `
    <div class="row"><div class="left">Student Name</div><div class="right">${student.name}</div></div>
    <div class="row"><div class="left">PRN</div><div class="right">${student.prn}</div></div>
    <div class="row"><div class="left">DOB / Age</div><div class="right">${dob} / ${age} yrs</div></div>
    <div class="row"><div class="left">Aadhar</div><div class="right">${student.aadhar || '-'}</div></div>
    <div class="row"><div class="left">Mobile</div><div class="right">${student.mobile || '-'}</div></div>

    <div class="row"><div class="left">Branch</div><div class="right">${student.branch}</div></div>
    <div class="row"><div class="left">Class</div><div class="right">${student.class}</div></div>

    <div class="summary">
      <div style="display:flex;justify-content:space-between"><div>Total Fees</div><div>${formatCurrency(student.totalFees)}</div></div>
      <div style="display:flex;justify-content:space-between"><div>Fees Paid</div><div>${formatCurrency(student.feesPaid)}</div></div>
      <div style="display:flex;justify-content:space-between;font-weight:700;margin-top:8px"><div>Remaining</div><div>${formatCurrency(remaining)}</div></div>
    </div>
  `;

  rc.style.display = 'block';
  rc.removeAttribute('aria-hidden');
  showToast('Receipt ready — use Print / Download');
});

// print
document.getElementById('btnPrint').addEventListener('click', () => {
  window.print();
});

// PDF download using html2pdf
document.getElementById('btnPdf').addEventListener('click', () => {
  const el = document.getElementById('receipt');
  if (!el.innerHTML.trim()) { showToast('Nothing to export'); return; }

  const opt = {
    margin: 10,
    filename: `MMCOE_Fee_Receipt_${Date.now()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().from(el).set(opt).save();
});

// clear fields
document.getElementById('btnClear').addEventListener('click', () => {
  $('name').value = '';
  $('prn').value = '';
  $('date').value = '';
  $('class').value = '';
  $('branch').value = '';
  rc.style.display = 'none';
  rc.setAttribute('aria-hidden','true');
});
