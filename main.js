/* ============================================================
   STORAGE HELPERS (FIREBASE FIRESTORE)
============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// TODO: Ganti value di bawah ini dengan config dari Firebase kamu
const firebaseConfig = {
  apiKey: "AIzaSyAcQzxOr0eVuHdmVlAhp9BQW-dFnkVI3ik",
  authDomain: "undangan-nikah-d3ad9.firebaseapp.com",
  projectId: "undangan-nikah-d3ad9",
  storageBucket: "undangan-nikah-d3ad9.firebasestorage.app",
  messagingSenderId: "765540783932",
  appId: "1:765540783932:web:1be93c1ee8076c7fd7b039"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const COLLECTION_NAME = "undangan_data";

async function storeGet(key, shared){
  try {
    const docRef = doc(db, COLLECTION_NAME, key);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data().value : null;
  } catch(e) { 
    return null; 
  }
}

async function storeSet(key, value, shared){
  try {
    const docRef = doc(db, COLLECTION_NAME, key);
    await setDoc(docRef, { value: value });
    return true;
  } catch(e) { 
    console.error('storage set failed', e); 
    return null; 
  }
}

async function storeDelete(key, shared){
  try {
    const docRef = doc(db, COLLECTION_NAME, key);
    await deleteDoc(docRef);
    return true;
  } catch(e) { 
    return null; 
  }
}

async function storeList(prefix, shared){
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const keys = [];
    querySnapshot.forEach((docSnap) => {
      if (docSnap.id.startsWith(prefix)) {
        keys.push(docSnap.id);
      }
    });
    return keys;
  } catch(e) { 
    return []; 
  }
}

function uid(){ return 'g_' + Math.random().toString(36).slice(2,9); }
function slugify(str){
  return str.toString().toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g,'')
    .replace(/\s+/g,'-')
    .replace(/-+/g,'-')
    .replace(/^-|-$/g,'') || 'tamu';
}

function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2200);
}

/* ============================================================
   WEDDING INFO (shared)
============================================================ */
const DEFAULT_INFO = {
  groomName:'Nama Pria',
  brideName:'Nama Wanita',
  date:'', // yyyy-mm-dd
  time:'10.00 - 13.00 WIB',
  venue:'Nama Tempat / Gedung',
  address:'Alamat lengkap lokasi acara akan tampil di sini',
  mapsUrl:'',
  baseUrl:'',
  greeting:'Tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk berkenan hadir memberikan doa restu',
  messageTemplate: 'Yth. Bapak/Ibu/Saudara/i {nama},\n\nTanpa mengurangi rasa hormat, kami mengundang Anda untuk hadir di acara akad pernikahan kami:\n\n{mempelai}\n📅 {tanggal}\n🕐 {waktu}\n📍 {tempat}\n\nUntuk detail acara & konfirmasi kehadiran, silakan buka undangan digital kami:\n{link}\n\nMerupakan suatu kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir memberikan doa restu.\n\nTerima kasih banyak 🙏',
  photo:''
};
let weddingInfo = {...DEFAULT_INFO};

async function loadWeddingInfo(){
  const raw = await storeGet('wedding-info', true);
  if(raw){ try{ weddingInfo = {...DEFAULT_INFO, ...JSON.parse(raw)}; }catch(e){} }
  return weddingInfo;
}
async function saveWeddingInfo(info){
  weddingInfo = info;
  await storeSet('wedding-info', JSON.stringify(info), true);
}

function renderWeddingInfoToGuestView(){
  document.getElementById('coverCoupleTitle').textContent = weddingInfo.groomName + ' & ' + weddingInfo.brideName;
  document.getElementById('groomNameDisp').textContent = weddingInfo.groomName;
  document.getElementById('brideNameDisp').textContent = weddingInfo.brideName;
  document.getElementById('greetingLine').textContent = weddingInfo.greeting;
  document.getElementById('venueNameDisp').textContent = weddingInfo.venue;
  document.getElementById('venueAddressDisp').textContent = weddingInfo.address;

  if(weddingInfo.date){
    const d = new Date(weddingInfo.date + 'T00:00:00');
    const opts = {weekday:'long', year:'numeric', month:'long', day:'numeric'};
    document.getElementById('eventDateDisp').textContent = d.toLocaleDateString('id-ID', opts);
  } else {
    document.getElementById('eventDateDisp').textContent = 'Tanggal menyusul';
  }
  document.getElementById('eventTimeDisp').textContent = weddingInfo.time;

  const mapsBtn = document.getElementById('mapsBtn');
  mapsBtn.onclick = ()=>{ if(weddingInfo.mapsUrl){ window.open(weddingInfo.mapsUrl,'_blank'); } else { showToast('Link peta belum tersedia'); } };

  const img = document.getElementById('couplePhoto');
  const ph = document.getElementById('photoPlaceholder');
  if(weddingInfo.photo){
    img.src = weddingInfo.photo; img.classList.remove('hidden'); ph.classList.add('hidden');
  } else {
    img.classList.add('hidden'); ph.classList.remove('hidden');
  }

  startCountdown();
}

let countdownTimer = null;
function startCountdown(){
  if(countdownTimer) clearInterval(countdownTimer);
  if(!weddingInfo.date) return;
  const target = new Date(weddingInfo.date + 'T00:00:00').getTime();
  function tick(){
    const diff = target - Date.now();
    if(diff <= 0){
      document.getElementById('cdDays').textContent = '00';
      document.getElementById('cdHours').textContent = '00';
      document.getElementById('cdMinutes').textContent = '00';
      document.getElementById('cdSeconds').textContent = '00';
      clearInterval(countdownTimer);
      return;
    }
    const d = Math.floor(diff/(1000*60*60*24));
    const h = Math.floor((diff/(1000*60*60))%24);
    const m = Math.floor((diff/(1000*60))%60);
    const s = Math.floor((diff/1000)%60);
    document.getElementById('cdDays').textContent = String(d).padStart(2,'0');
    document.getElementById('cdHours').textContent = String(h).padStart(2,'0');
    document.getElementById('cdMinutes').textContent = String(m).padStart(2,'0');
    document.getElementById('cdSeconds').textContent = String(s).padStart(2,'0');
  }
  tick();
  countdownTimer = setInterval(tick, 1000);
}

/* ============================================================
   GUEST RECORDS (shared)
============================================================ */
function defaultGuest(id, name, maxMakan, maxSouvenir, phone){
  return {id, name, phone: phone || '', maxMakan:Number(maxMakan), usedMakan:0, maxSouvenir:Number(maxSouvenir), usedSouvenir:0, rsvpStatus:'', rsvpCount:1};
}
async function getGuest(id){
  const raw = await storeGet('guest:'+id, true);
  if(!raw) return null;
  try{ return JSON.parse(raw); }catch(e){ return null; }
}
async function saveGuest(g){
  await storeSet('guest:'+g.id, JSON.stringify(g), true);
}
async function listAllGuests(){
  const keys = await storeList('guest:', true);
  const guests = [];
  for(const k of keys){
    const raw = await storeGet(k, true);
    if(raw){ try{ guests.push(JSON.parse(raw)); }catch(e){} }
  }
  return guests.sort((a,b)=> a.name.localeCompare(b.name));
}

/* ============================================================
   GUEST VIEW LOGIC
============================================================ */
let currentGuest = null;
let allGuestsCache = [];
function hidePageLoader(){
  const loader = document.getElementById('pageLoader');
  if(loader){
    loader.classList.add('fade-out');
    setTimeout(() => {
      loader.remove();
    }, 550);
  }
}

function dismissLoader(startTime){
  const elapsed = Date.now() - startTime;
  const minDelay = 450; // Jeda minimal agar transisi tetap halus
  if(elapsed < minDelay){
    setTimeout(hidePageLoader, minDelay - elapsed);
  } else {
    hidePageLoader();
  }
}

async function initGuestCover(){
  const startTime = Date.now();

  // Ikat tombol Buka Undangan sejak awal agar tidak ter-skip oleh 'return'
  document.getElementById('openInvitationBtn').onclick = openInvitation;

  try {
    // 1. Pastikan info pernikahan terload lebih dulu
    await loadWeddingInfo();
    renderWeddingInfoToGuestView();
    
    // 2. Ambil semua cache data tamu dari Firebase
    allGuestsCache = await listAllGuests();

    // 3. Cek apakah ada parameter nama tamu di URL (?to=slug)
    const params = new URLSearchParams(window.location.search);
    const toId = params.get('to');
    
    if(toId){
      document.getElementById('adminToggle').classList.add('hidden');
      const g = await getGuest(toId);
      if(g){ 
        // Ambil data terbaru dari DB, lalu tampilkan card & tombol buka
        selectGuest(g); 
        return; 
      }
    }

    // Jika buka link umum (bukan link tamu), tampilkan tombol Panitia
    document.getElementById('adminToggle').classList.remove('hidden');

    // Jika tidak ada parameter URL yang valid, tampilkan opsi lookup panitia
    document.getElementById('noLinkNotice').classList.remove('hidden');
    
    // Hapus event listener lama jika ada, ganti dengan yang bersih
    const staffToggle = document.getElementById('staffLookupToggle');
    staffToggle.onclick = () => {
      document.getElementById('noLinkNotice').classList.add('hidden');
      document.getElementById('searchWrap').classList.remove('hidden');
    };

    const input = document.getElementById('guestSearchInput');
    const suggestBox = document.getElementById('suggestList');

    input.oninput = () => {
      const q = input.value.trim().toLowerCase();
      document.getElementById('selectedGuestCard').classList.add('hidden');
      document.getElementById('openInvitationBtn').classList.add('hidden');
      currentGuest = null;
      
      if(!q){ suggestBox.classList.add('hidden'); return; }
      
      const matches = allGuestsCache.filter(g => g.name.toLowerCase().includes(q)).slice(0,8);
      suggestBox.innerHTML = '';
      
      if(matches.length === 0){
        suggestBox.innerHTML = '<div class="suggest-empty">Nama tidak ditemukan</div>';
      } else {
        matches.forEach(g=>{
          const item = document.createElement('div');
          item.className = 'suggest-item';
          item.textContent = g.name;
          item.onclick = async ()=>{ 
            // Ambil data paling fresh dari Firebase saat nama diklik
            const freshGuest = await getGuest(g.id);
            selectGuest(freshGuest || g); 
            suggestBox.classList.add('hidden'); 
            input.value = g.name; 
          };
          suggestBox.appendChild(item);
        });
      }
      suggestBox.classList.remove('hidden');
    };
  } finally {
    dismissLoader(startTime);
  }
}

function selectGuest(g){
  currentGuest = g;
  document.getElementById('selectedGuestCard').classList.remove('hidden');
  document.getElementById('selectedGuestName').textContent = g.name;
  document.getElementById('openInvitationBtn').classList.remove('hidden');
}

async function openInvitation(){
  if(!currentGuest) return;
  document.getElementById('adminToggle').classList.add('hidden');
  document.getElementById('coverScreen').classList.add('hidden');
  document.getElementById('invitationScreen').classList.remove('hidden');
  await renderRsvpState();
  await renderQrCodes();
}

/* RSVP */
let rsvpChoice = null;
let rsvpCount = 1;

function getMaxRsvpLimit(){
  if(!currentGuest) return 1;
  return Math.max(1, Number(currentGuest.maxMakan) || 1);
}

document.querySelectorAll('.rsvp-chip').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.rsvp-chip').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    rsvpChoice = btn.dataset.val;
    document.getElementById('countRow').classList.toggle('hidden', rsvpChoice !== 'hadir');
  });
});
document.getElementById('countMinus').addEventListener('click', ()=>{
  rsvpCount = Math.max(1, rsvpCount - 1);
  document.getElementById('countVal').textContent = rsvpCount;
});
document.getElementById('countPlus').addEventListener('click', ()=>{
  const maxLimit = getMaxRsvpLimit();
  if(rsvpCount >= maxLimit){
    showToast('Maksimal kehadiran sesuai jatah undangan: ' + maxLimit + ' orang');
    return;
  }
  rsvpCount = Math.min(maxLimit, rsvpCount + 1);
  document.getElementById('countVal').textContent = rsvpCount;
});
document.getElementById('submitRsvpBtn').addEventListener('click', async ()=>{
  if(!currentGuest){ return; }
  if(!rsvpChoice){ showToast('Pilih status kehadiran terlebih dahulu'); return; }
  const maxLimit = getMaxRsvpLimit();
  currentGuest.rsvpStatus = rsvpChoice;
  currentGuest.rsvpCount = rsvpChoice === 'hadir' ? Math.min(maxLimit, Math.max(1, rsvpCount)) : 0;
  await saveGuest(currentGuest);
  renderRsvpStatusBox();
  showToast('Konfirmasi kehadiran terkirim');
});

function renderRsvpStatusBox(){
  const box = document.getElementById('rsvpStatusBox');
  box.classList.remove('hidden');
  let msg = '';
  if(currentGuest.rsvpStatus === 'hadir'){
    msg = 'Anda mengonfirmasi bahwa akan hadir adalah ' + currentGuest.rsvpCount + ' orang';
  } else if(currentGuest.rsvpStatus === 'tidak'){
    msg = 'Anda mengonfirmasi tidak dapat hadir';
  } else if(currentGuest.rsvpStatus === 'ragu'){
    msg = 'Anda memilih masih ragu-ragu, mohon konfirmasi kembali sebelum hari-H';
  }
  box.textContent = msg;
}

async function renderRsvpState(){
  const maxLimit = getMaxRsvpLimit();
  const hintEl = document.getElementById('rsvpMaxHint');
  if(hintEl){
    hintEl.textContent = '(Maks. ' + maxLimit + ' orang)';
  }

  if(currentGuest.rsvpStatus){
    document.querySelectorAll('.rsvp-chip').forEach(b=>{
      if(b.dataset.val === currentGuest.rsvpStatus) b.classList.add('active');
    });
    rsvpChoice = currentGuest.rsvpStatus;
    rsvpCount = Math.min(maxLimit, Math.max(1, currentGuest.rsvpCount || 1));
    document.getElementById('countVal').textContent = rsvpCount;
    document.getElementById('countRow').classList.toggle('hidden', rsvpChoice !== 'hadir');
    renderRsvpStatusBox();
  } else {
    rsvpCount = 1;
    document.getElementById('countVal').textContent = rsvpCount;
  }
}

/* QR rendering */
async function renderQrCodes(){
  const g = currentGuest;
  document.getElementById('qrSouvenir').innerHTML = '';
  document.getElementById('qrMakan').innerHTML = '';

  new QRCode(document.getElementById('qrSouvenir'), {
    text: 'WD:'+g.id+':SOUV', width:120, height:120, colorDark:'#0F2117', colorLight:'#ffffff'
  });
  new QRCode(document.getElementById('qrMakan'), {
    text: 'WD:'+g.id+':MAKAN', width:120, height:120, colorDark:'#0F2117', colorLight:'#ffffff'
  });

  updateQrMeta();
}
function updateQrMeta(){
  const g = currentGuest;
  const souvLeft = g.maxSouvenir - g.usedSouvenir;
  const makanLeft = g.maxMakan - g.usedMakan;
  document.getElementById('qrSouvenirMeta').textContent = souvLeft + ' dari ' + g.maxSouvenir + ' tersisa';
  document.getElementById('qrMakanMeta').textContent = makanLeft + ' dari ' + g.maxMakan + ' tersisa';
}

/* ============================================================
   ADMIN VIEW
============================================================ */
const ADMIN_PIN = '2026';

document.getElementById('adminToggle').addEventListener('click', ()=>{
  document.getElementById('adminToggle').classList.add('hidden');
  document.getElementById('guestView').classList.add('hidden');
  document.getElementById('adminView').classList.remove('hidden');
});
document.getElementById('backToGuestBtn').addEventListener('click', exitAdmin);
document.getElementById('exitAdminBtn').addEventListener('click', exitAdmin);
function exitAdmin(){
  stopScanning();
  document.getElementById('adminView').classList.add('hidden');
  document.getElementById('guestView').classList.remove('hidden');
  const params = new URLSearchParams(window.location.search);
  const isInvitationOpen = !document.getElementById('invitationScreen').classList.contains('hidden');
  if(!params.get('to') && !isInvitationOpen){
    document.getElementById('adminToggle').classList.remove('hidden');
  } else {
    document.getElementById('adminToggle').classList.add('hidden');
  }
}

document.getElementById('pinSubmit').addEventListener('click', async ()=>{
  const val = document.getElementById('pinInput').value;
  if(val === ADMIN_PIN){
    document.getElementById('pinGate').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
    await populateSettingsForm();
    await renderGuestList();
  } else {
    showToast('PIN salah');
  }
});

document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('panel-'+btn.dataset.tab).classList.add('active');
    if(btn.dataset.tab !== 'scan'){ stopScanning(); }
    if(btn.dataset.tab === 'guests'){ renderGuestList(); }
  });
});

/* --- settings form --- */
async function populateSettingsForm(){
  await loadWeddingInfo();
  document.getElementById('f_groom').value = weddingInfo.groomName;
  document.getElementById('f_bride').value = weddingInfo.brideName;
  document.getElementById('f_date').value = weddingInfo.date;
  document.getElementById('f_time').value = weddingInfo.time;
  document.getElementById('f_venue').value = weddingInfo.venue;
  document.getElementById('f_address').value = weddingInfo.address;
  document.getElementById('f_maps').value = weddingInfo.mapsUrl;
  document.getElementById('f_baseurl').value = weddingInfo.baseUrl;
  document.getElementById('f_greeting').value = weddingInfo.greeting;
  document.getElementById('f_msgtemplate').value = weddingInfo.messageTemplate;
  const preview = document.getElementById('photoPreview');
  if(weddingInfo.photo){ preview.src = weddingInfo.photo; preview.classList.remove('hidden'); }
}

document.getElementById('f_photo').addEventListener('change', (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (ev)=>{
    const img = new Image();
    img.onload = ()=>{
      const canvas = document.createElement('canvas');
      const maxDim = 700;
      let w = img.width, h = img.height;
      if(w > h && w > maxDim){ h = h*(maxDim/w); w = maxDim; }
      else if(h > maxDim){ w = w*(maxDim/h); h = maxDim; }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img,0,0,w,h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
      document.getElementById('photoPreview').src = dataUrl;
      document.getElementById('photoPreview').classList.remove('hidden');
      weddingInfo._pendingPhoto = dataUrl;
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

document.getElementById('saveSettingsBtn').addEventListener('click', async ()=>{
  const info = {
    groomName: document.getElementById('f_groom').value.trim() || DEFAULT_INFO.groomName,
    brideName: document.getElementById('f_bride').value.trim() || DEFAULT_INFO.brideName,
    date: document.getElementById('f_date').value,
    time: document.getElementById('f_time').value.trim() || DEFAULT_INFO.time,
    venue: document.getElementById('f_venue').value.trim() || DEFAULT_INFO.venue,
    address: document.getElementById('f_address').value.trim() || DEFAULT_INFO.address,
    mapsUrl: document.getElementById('f_maps').value.trim(),
    baseUrl: document.getElementById('f_baseurl').value.trim().replace(/\/$/, ''),
    greeting: document.getElementById('f_greeting').value.trim() || DEFAULT_INFO.greeting,
    messageTemplate: document.getElementById('f_msgtemplate').value.trim() || DEFAULT_INFO.messageTemplate,
    photo: weddingInfo._pendingPhoto || weddingInfo.photo || ''
  };
  await saveWeddingInfo(info);
  showToast('Pengaturan acara disimpan');
});

function normalizePhone(phone){
  let digits = String(phone||'').replace(/[^0-9]/g,'');
  if(!digits) return '';
  if(digits.startsWith('0')) digits = '62' + digits.slice(1);
  if(!digits.startsWith('62')) digits = '62' + digits;
  return digits;
}

function buildGuestMessage(g, baseLink){
  const tpl = weddingInfo.messageTemplate || DEFAULT_INFO.messageTemplate;
  let tanggalText = 'Tanggal menyusul';
  if(weddingInfo.date){
    const d = new Date(weddingInfo.date + 'T00:00:00');
    tanggalText = d.toLocaleDateString('id-ID', {weekday:'long', year:'numeric', month:'long', day:'numeric'});
  }
  return tpl
    .replaceAll('{nama}', g.name)
    .replaceAll('{mempelai}', weddingInfo.groomName + ' & ' + weddingInfo.brideName)
    .replaceAll('{tanggal}', tanggalText)
    .replaceAll('{waktu}', weddingInfo.time)
    .replaceAll('{tempat}', weddingInfo.venue)
    .replaceAll('{alamat}', weddingInfo.address)
    .replaceAll('{link}', baseLink + '?to=' + g.id);
}

/* --- guest management --- */
let adminGuestSearchQuery = '';
let adminGuestCurrentPage = 1;
const ADMIN_GUEST_PAGE_SIZE = 10;

function setupAdminGuestSearch(){
  const input = document.getElementById('adminGuestSearchInput');
  if(!input || input._hasListener) return;
  input._hasListener = true;
  input.addEventListener('input', ()=>{
    adminGuestSearchQuery = input.value.trim().toLowerCase();
    adminGuestCurrentPage = 1;
    renderGuestListUI();
  });
}

function getFilteredGuests(){
  if(!adminGuestSearchQuery) return allGuestsCache;
  return allGuestsCache.filter(g => {
    const nameMatch = (g.name || '').toLowerCase().includes(adminGuestSearchQuery);
    const phoneMatch = (g.phone || '').includes(adminGuestSearchQuery);
    return nameMatch || phoneMatch;
  });
}

document.getElementById('refreshGuestsBtn').addEventListener('click', renderGuestList);
document.getElementById('copyAllMsgBtn').addEventListener('click', async ()=>{
  const guests = getFilteredGuests();
  if(guests.length === 0){ showToast('Belum ada tamu yang sesuai'); return; }
  const baseLink = weddingInfo.baseUrl ? weddingInfo.baseUrl : (window.location.origin + window.location.pathname);
  const allText = guests.map(g=>{
    const phoneLine = g.phone ? ('No. WA: ' + g.phone + '\n') : '';
    return '=== ' + g.name + ' ===\n' + phoneLine + buildGuestMessage(g, baseLink);
  }).join('\n\n----------------------------\n\n');
  navigator.clipboard?.writeText(allText).then(()=>showToast('Semua pesan disalin (' + guests.length + ' tamu)')).catch(()=>showToast('Gagal menyalin, coba satu-persatu'));
});
document.getElementById('addGuestBtn').addEventListener('click', async ()=>{
  const name = document.getElementById('ng_name').value.trim();
  const phone = document.getElementById('ng_phone').value.trim();
  const makan = document.getElementById('ng_makan').value || 0;
  const souv = document.getElementById('ng_souvenir').value || 0;
  if(!name){ showToast('Isi nama tamu terlebih dahulu'); return; }
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let counter = 2;
  while(await getGuest(slug)){
    slug = baseSlug + '-' + counter;
    counter++;
  }
  const g = defaultGuest(slug, name, makan, souv, phone);
  await saveGuest(g);
  document.getElementById('ng_name').value = '';
  document.getElementById('ng_phone').value = '';
  showToast('Tamu ditambahkan');
  await renderGuestList();
});

function renderRsvpSummary(guests){
  const summaryWrap = document.getElementById('rsvpSummaryWrap');
  const hadirGuests = guests.filter(g=>g.rsvpStatus==='hadir');
  const tidakGuests = guests.filter(g=>g.rsvpStatus==='tidak');
  const raguGuests = guests.filter(g=>g.rsvpStatus==='ragu');
  const belumGuests = guests.filter(g=>!g.rsvpStatus);
  const totalHadirOrang = hadirGuests.reduce((sum,g)=> sum + (g.rsvpCount||0), 0);

  summaryWrap.innerHTML = `
    <div class="stat-card hadir">
      <div class="stat-num">${totalHadirOrang}</div>
      <div class="stat-label">Orang akan hadir (${hadirGuests.length} tamu)</div>
    </div>
    <div class="stat-card tidak">
      <div class="stat-num">${tidakGuests.length}</div>
      <div class="stat-label">Tamu tidak hadir</div>
    </div>
    <div class="stat-card ragu">
      <div class="stat-num">${raguGuests.length}</div>
      <div class="stat-label">Tamu masih ragu</div>
    </div>
    <div class="stat-card belum">
      <div class="stat-num">${belumGuests.length}</div>
      <div class="stat-label">Belum konfirmasi</div>
    </div>
  `;
}

function renderGuestListUI(){
  const wrap = document.getElementById('guestListWrap');
  const paginationWrap = document.getElementById('guestPaginationWrap');
  const baseLink = weddingInfo.baseUrl ? weddingInfo.baseUrl : (window.location.origin + window.location.pathname);
  
  const filtered = getFilteredGuests();
  const totalGuests = filtered.length;

  if(allGuestsCache.length === 0){
    wrap.innerHTML = '<div class="empty-state">Belum ada tamu. Tambahkan tamu pertama di atas.</div>';
    if(paginationWrap) paginationWrap.classList.add('hidden');
    return;
  }

  if(filtered.length === 0){
    wrap.innerHTML = `<div class="empty-state">Tidak ada tamu yang cocok dengan pencarian "${escapeHtml(adminGuestSearchQuery)}".</div>`;
    if(paginationWrap) paginationWrap.classList.add('hidden');
    return;
  }

  const totalPages = Math.ceil(totalGuests / ADMIN_GUEST_PAGE_SIZE) || 1;
  if(adminGuestCurrentPage > totalPages) adminGuestCurrentPage = totalPages;
  if(adminGuestCurrentPage < 1) adminGuestCurrentPage = 1;

  const startIndex = (adminGuestCurrentPage - 1) * ADMIN_GUEST_PAGE_SIZE;
  const pageGuests = filtered.slice(startIndex, startIndex + ADMIN_GUEST_PAGE_SIZE);

  wrap.innerHTML = '';
  pageGuests.forEach(g=>{
    const item = document.createElement('div');
    item.className = 'guest-list-item';
    const rsvpBadgeClass = g.rsvpStatus === 'hadir' ? 'rsvp-yes' : g.rsvpStatus === 'tidak' ? 'rsvp-no' : 'rsvp-none';
    const rsvpLabel = g.rsvpStatus === 'hadir' ? ('Hadir (' + g.rsvpCount + ')') : g.rsvpStatus === 'tidak' ? 'Tidak Hadir' : g.rsvpStatus === 'ragu' ? 'Ragu-ragu' : 'Belum konfirmasi';
    const phoneDigits = normalizePhone(g.phone);
    item.innerHTML = `
      <div class="gl-top">
        <div class="gl-name">${escapeHtml(g.name)}</div>
      </div>
      <div class="gl-badges">
        <span class="badge ${rsvpBadgeClass}">${rsvpLabel}</span>
        <span class="badge">Makan ${g.usedMakan}/${g.maxMakan}</span>
        <span class="badge">Souvenir ${g.usedSouvenir}/${g.maxSouvenir}</span>
      </div>
      <div class="gl-link">${baseLink}?to=${g.id}</div>
      <div style="display:flex;gap:6px;margin-top:8px;align-items:center;">
        <input type="text" class="phone-input" placeholder="No. WA (opsional)" value="${escapeHtml(g.phone||'')}" style="flex:1;padding:8px 10px;border:1px solid var(--bone-dim);border-radius:8px;font-size:12px;">
        <button class="btn btn-ghost btn-small save-phone-btn">Simpan</button>
      </div>
      <div class="gl-actions">
        <button class="btn btn-outline-gold btn-small copy-link-btn">Salin Link</button>
        <button class="btn btn-outline-gold btn-small copy-msg-btn">Salin Pesan</button>
        ${phoneDigits ? '<button class="btn btn-primary btn-small send-wa-btn">Kirim WA</button>' : ''}
        <button class="btn btn-ghost btn-small reset-btn">Reset Kuota</button>
        <button class="btn btn-danger btn-small delete-btn">Hapus</button>
      </div>
    `;
    item.querySelector('.copy-link-btn').addEventListener('click', ()=>{
      navigator.clipboard?.writeText(baseLink+'?to='+g.id).then(()=>showToast('Link disalin')).catch(()=>showToast('Gagal menyalin, salin manual'));
    });
    item.querySelector('.copy-msg-btn').addEventListener('click', ()=>{
      const msg = buildGuestMessage(g, baseLink);
      navigator.clipboard?.writeText(msg).then(()=>showToast('Pesan disalin, siap ditempel ke WhatsApp')).catch(()=>showToast('Gagal menyalin, salin manual'));
    });
    const sendWaBtn = item.querySelector('.send-wa-btn');
    if(sendWaBtn){
      sendWaBtn.addEventListener('click', ()=>{
        const msg = buildGuestMessage(g, baseLink);
        window.open('https://wa.me/'+phoneDigits+'?text='+encodeURIComponent(msg), '_blank');
      });
    }
    item.querySelector('.save-phone-btn').addEventListener('click', async ()=>{
      const val = item.querySelector('.phone-input').value.trim();
      g.phone = val;
      await saveGuest(g);
      showToast('No. WA disimpan');
      await renderGuestList();
    });
    item.querySelector('.reset-btn').addEventListener('click', async ()=>{
      g.usedMakan = 0; g.usedSouvenir = 0;
      await saveGuest(g);
      showToast('Kuota direset');
      await renderGuestList();
    });
    item.querySelector('.delete-btn').addEventListener('click', async ()=>{
      await storeDelete('guest:'+g.id, true);
      showToast('Tamu dihapus');
      await renderGuestList();
    });
    wrap.appendChild(item);
  });

  // Render pagination controls
  if(totalPages > 1){
    paginationWrap.classList.remove('hidden');
    paginationWrap.innerHTML = `
      <button class="btn btn-ghost btn-small prev-page-btn" ${adminGuestCurrentPage <= 1 ? 'disabled' : ''}>&laquo; Sebelumnya</button>
      <span class="page-info">Hal ${adminGuestCurrentPage} / ${totalPages} (${totalGuests} tamu)</span>
      <button class="btn btn-ghost btn-small next-page-btn" ${adminGuestCurrentPage >= totalPages ? 'disabled' : ''}>Berikutnya &raquo;</button>
    `;

    paginationWrap.querySelector('.prev-page-btn')?.addEventListener('click', ()=>{
      if(adminGuestCurrentPage > 1){
        adminGuestCurrentPage--;
        renderGuestListUI();
        document.getElementById('adminGuestSearchInput')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
    paginationWrap.querySelector('.next-page-btn')?.addEventListener('click', ()=>{
      if(adminGuestCurrentPage < totalPages){
        adminGuestCurrentPage++;
        renderGuestListUI();
        document.getElementById('adminGuestSearchInput')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  } else {
    paginationWrap.classList.add('hidden');
  }
}

async function renderGuestList(){
  setupAdminGuestSearch();
  const guests = await listAllGuests();
  allGuestsCache = guests;
  renderRsvpSummary(guests);
  renderGuestListUI();
}
function escapeHtml(s){
  const d = document.createElement('div'); d.textContent = s; return d.innerHTML;
}

/* --- scanner --- */
let scanStream = null;
let scanLoopId = null;
let lastScanCode = null;
let lastScanTime = 0;

document.getElementById('startScanBtn').addEventListener('click', startScanning);
document.getElementById('stopScanBtn').addEventListener('click', stopScanning);

async function startScanning(){
  const video = document.getElementById('scanVideo');
  const canvas = document.getElementById('scanCanvas');
  try{
    scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
  }catch(e){
    if(e.name === 'NotAllowedError' || e.name === 'SecurityError'){
      showToast('Kamera diblokir. Buka undangan lewat link Publish, bukan dari jendela preview di chat.');
    } else if(e.name === 'NotFoundError'){
      showToast('Tidak ada kamera yang terdeteksi di perangkat ini.');
    } else {
      showToast('Gagal mengakses kamera: ' + e.message);
    }
    return;
  }
  video.srcObject = scanStream;
  video.classList.remove('hidden');
  document.getElementById('startScanBtn').classList.add('hidden');
  document.getElementById('stopScanBtn').classList.remove('hidden');

  const ctx = canvas.getContext('2d');
  function loop(){
    if(video.readyState === video.HAVE_ENOUGH_DATA){
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0,0,canvas.width,canvas.height);
      const code = jsQR(imgData.data, imgData.width, imgData.height);
      if(code && code.data){
        handleScannedCode(code.data);
      }
    }
    scanLoopId = requestAnimationFrame(loop);
  }
  scanLoopId = requestAnimationFrame(loop);
}

function stopScanning(){
  if(scanLoopId){ cancelAnimationFrame(scanLoopId); scanLoopId = null; }
  if(scanStream){ scanStream.getTracks().forEach(t=>t.stop()); scanStream = null; }
  document.getElementById('scanVideo').classList.add('hidden');
  document.getElementById('startScanBtn').classList.remove('hidden');
  document.getElementById('stopScanBtn').classList.add('hidden');
}

/* ============================================================
   SCAN CONFIRMATION MODAL (popup ala transaksi)
============================================================ */
let scanModalTimer = null;

function playBeep(freq, duration, type){
  try{
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if(!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration/1000);
    osc.start();
    osc.stop(ctx.currentTime + duration/1000);
    osc.onended = ()=>ctx.close();
  }catch(e){}
}

function vibrate(pattern){
  try{ if(navigator.vibrate) navigator.vibrate(pattern); }catch(e){}
}

function closeScanModal(){
  document.getElementById('scanModalOverlay').classList.add('hidden');
  if(scanModalTimer){ clearTimeout(scanModalTimer); scanModalTimer = null; }
}
document.getElementById('scanModalClose').addEventListener('click', closeScanModal);
document.getElementById('scanModalOverlay').addEventListener('click', (e)=>{
  if(e.target.id === 'scanModalOverlay') closeScanModal();
});

function showScanModal({status, name, typeLabel, message, quotaText, autoCloseMs}){
  const overlay = document.getElementById('scanModalOverlay');
  const icon = document.getElementById('scanModalIcon');
  const nameEl = document.getElementById('scanModalName');
  const typeEl = document.getElementById('scanModalType');
  const msgEl = document.getElementById('scanModalMessage');
  const quotaEl = document.getElementById('scanModalQuota');
  const progressBar = document.getElementById('scanModalProgressBar');

  icon.className = 'scan-modal-icon ' + status;
  icon.textContent = status === 'ok' ? '✓' : status === 'full' ? '✕' : '?';
  nameEl.textContent = name;
  typeEl.textContent = typeLabel;
  msgEl.textContent = message;
  quotaEl.textContent = quotaText;
  quotaEl.style.display = quotaText ? 'inline-block' : 'none';

  // restart progress bar animation
  progressBar.style.animation = 'none';
  void progressBar.offsetWidth;
  progressBar.style.animation = `scanProgress ${(autoCloseMs||2400)/1000}s linear forwards`;

  overlay.classList.remove('hidden');

  if(status === 'ok'){
    playBeep(1046, 130, 'sine');
    vibrate(80);
  } else if(status === 'full'){
    playBeep(220, 260, 'square');
    vibrate([90,60,90]);
  } else {
    playBeep(320, 200, 'triangle');
    vibrate(120);
  }

  if(scanModalTimer){ clearTimeout(scanModalTimer); }
  scanModalTimer = setTimeout(closeScanModal, autoCloseMs || 2400);
}

async function handleScannedCode(data){
  const now = Date.now();
  if(data === lastScanCode && (now - lastScanTime) < 3000){ return; }
  lastScanCode = data; lastScanTime = now;

  const parts = data.split(':');
  if(parts.length !== 3 || parts[0] !== 'WD'){
    showScanModal({
      status:'notfound', name:'Kode tidak dikenali', typeLabel:'QR TIDAK VALID',
      message:'Kode ini bukan kode undangan yang valid.', quotaText:''
    });
    return;
  }
  const [, guestId, type] = parts;
  const g = await getGuest(guestId);
  if(!g){
    showScanModal({
      status:'notfound', name:'Tamu tidak ditemukan', typeLabel:'DATA TIDAK ADA',
      message:'ID tamu pada kode ini tidak terdaftar di sistem.', quotaText:''
    });
    return;
  }

  if(type === 'MAKAN'){
    if(g.usedMakan >= g.maxMakan){
      showScanModal({
        status:'full', name:g.name, typeLabel:'JATAH MAKAN',
        message:'Jatah makan sudah habis diambil.',
        quotaText: g.usedMakan + ' / ' + g.maxMakan + ' terpakai'
      });
    } else {
      g.usedMakan += 1;
      await saveGuest(g);
      showScanModal({
        status:'ok', name:g.name, typeLabel:'JATAH MAKAN',
        message:'Berhasil! Makan berhasil diambil.',
        quotaText: 'Sisa ' + (g.maxMakan - g.usedMakan) + ' dari ' + g.maxMakan
      });
    }
  } else if(type === 'SOUV'){
    if(g.usedSouvenir >= g.maxSouvenir){
      showScanModal({
        status:'full', name:g.name, typeLabel:'JATAH SOUVENIR',
        message:'Jatah souvenir sudah habis diambil.',
        quotaText: g.usedSouvenir + ' / ' + g.maxSouvenir + ' terpakai'
      });
    } else {
      g.usedSouvenir += 1;
      await saveGuest(g);
      showScanModal({
        status:'ok', name:g.name, typeLabel:'JATAH SOUVENIR',
        message:'Berhasil! Souvenir berhasil diambil.',
        quotaText: 'Sisa ' + (g.maxSouvenir - g.usedSouvenir) + ' dari ' + g.maxSouvenir
      });
    }
  } else {
    showScanModal({
      status:'notfound', name:g.name, typeLabel:'JENIS TIDAK DIKENALI',
      message:'Jenis kode pada QR ini tidak dikenali sistem.', quotaText:''
    });
  }
}

/* ============================================================
   INIT
============================================================ */
initGuestCover();
