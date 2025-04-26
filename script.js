const mqttStatus = document.getElementById('mqttStatus');
const datetime = document.getElementById('datetime');

const dataEls1 = {
    voltR: document.getElementById('voltR'),
    voltS: document.getElementById('voltS'),
    voltT: document.getElementById('voltT'),
    ampR: document.getElementById('ampR'),
    ampS: document.getElementById('ampS'),
    ampT: document.getElementById('ampT'),
    wattR: document.getElementById('wattR'),
    wattS: document.getElementById('wattS'),
    wattT: document.getElementById('wattT'),
    kwhR: document.getElementById('kwhR'),
    kwhS: document.getElementById('kwhS'),
    kwhT: document.getElementById('kwhT')
};

const dataEls2 = {
    voltR: document.getElementById('voltR2'),
    voltS: document.getElementById('voltS2'),
    voltT: document.getElementById('voltT2'),
    ampR: document.getElementById('ampR2'),
    ampS: document.getElementById('ampS2'),
    ampT: document.getElementById('ampT2'),
    wattR: document.getElementById('wattR2'),
    wattS: document.getElementById('wattS2'),
    wattT: document.getElementById('wattT2'),
    kwhR: document.getElementById('kwhR2'),
    kwhS: document.getElementById('kwhS2'),
    kwhT: document.getElementById('kwhT2')
};

function updateClock() {
    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  
    const day = days[now.getDay()];
    const date = now.toLocaleDateString('id-ID');
    const time = now.toLocaleTimeString('id-ID', { hour12: false });
  
    document.getElementById('clock').textContent = `${day}, ${date} | ${time}`;
  }
  
  setInterval(updateClock, 1000);
  updateClock(); // Panggil sekali agar muncul langsung
  

function connectMQTT() {
    const client = mqtt.connect('wss://broker.emqx.io:8084/mqtt', {
        clientId: 'mon_' + Math.random().toString(16).substr(2, 8),
        keepalive: 60,
        clean: true,
        connectTimeout: 4000
    });

    client.on('connect', () => {
        mqttStatus.innerText = 'Connected';
        mqttStatus.classList.replace('text-red-500', 'text-green-500');
        client.subscribe('panel1/data');
        client.subscribe('panel2/data');
    });

    client.on('error', err => {
        mqttStatus.innerText = 'Error';
        console.error(err);
    });

    client.on('close', () => {
        mqttStatus.innerText = 'Disconnected';
        mqttStatus.classList.replace('text-green-500', 'text-red-500');
    });

    client.on('message', (topic, msg) => {
        try {
            const data = JSON.parse(msg.toString());
            const target = topic === 'panel1/data' ? dataEls1 : topic === 'panel2/data' ? dataEls2 : null;
            if (target) {
                Object.keys(target).forEach(key => {
                    if (data[key] !== undefined) target[key].innerText = data[key];
                });
            }
            if (topic === 'panel1/data') {
                updateVoltR(data.voltR);
            }
            if (topic === 'panel2/data') {
                updateVoltRPanel2(data.voltR); // Update Panel 2
              }
        } catch (e) {
            console.error('Parse error', e);
        }
    });
}

connectMQTT();

let lastVoltR = null;
let lastVoltUpdateTime = Date.now();

// Fungsi ini kamu panggil setiap kali kamu update voltR dari MQTT
function updateVoltR(value) {
  const element = document.getElementById('voltR');
  if (element) {
    element.textContent = value;
  }

  if (value !== lastVoltR) {
    lastVoltR = value;
    lastVoltUpdateTime = Date.now();
    updateESP1Status(true); // berubah = aktif
  }
}

// Cek setiap 5 detik, apakah voltR tidak berubah terlalu lama
setInterval(() => {
  const now = Date.now();
  if (now - lastVoltUpdateTime > 10000) {
    updateESP1Status(false); // lebih dari 10 detik tidak ada perubahan = offline
  }
}, 5000);

// Fungsi update status tampilan
function updateESP1Status(isOnline) {
  const dot = document.getElementById('esp1Status');
  const label = document.getElementById('esp1Label');
  if (isOnline) {
    dot.className = 'w-3 h-3 rounded-full bg-green-400 animate-ping';
    label.textContent = 'ESP32 Panel 1: Aktif';
    label.className = 'text-sm text-green-400';
  } else {
    dot.className = 'w-3 h-3 rounded-full bg-red-500';
    label.textContent = 'ESP32 Panel 1: Tidak Aktif';
    label.className = 'text-sm text-red-400';
  }
}

let lastVoltRPanel2 = null;
let lastVoltUpdateTimePanel2 = Date.now();

// Fungsi update untuk voltR Panel 2
function updateVoltRPanel2(value) {
  const element = document.getElementById('voltR2');
  if (element) {
    element.textContent = value;
  }

  if (value !== lastVoltRPanel2) {
    lastVoltRPanel2 = value;
    lastVoltUpdateTimePanel2 = Date.now();
    updateESP2Status(true); // berubah = aktif
  }
}

// Cek setiap 5 detik, apakah voltR Panel 2 tidak berubah terlalu lama
setInterval(() => {
  const now = Date.now();
  if (now - lastVoltUpdateTimePanel2 > 10000) {
    updateESP2Status(false); // lebih dari 10 detik tidak ada perubahan = offline
  }
}, 5000);

// Fungsi update status tampilan Panel 2
function updateESP2Status(isOnline) {
  const dot = document.getElementById('esp2Status');
  const label = document.getElementById('esp2Label');
  if (isOnline) {
    dot.className = 'w-3 h-3 rounded-full bg-green-400 animate-ping';
    label.textContent = 'ESP32 Panel 2: Aktif';
    label.className = 'text-sm text-green-400';
  } else {
    dot.className = 'w-3 h-3 rounded-full bg-red-500';
    label.textContent = 'ESP32 Panel 2: Tidak Aktif';
    label.className = 'text-sm text-red-400';
  }
}

function openSpreadsheet() {
  window.open('https://docs.google.com/spreadsheets/d/1mXYcpft7fxiFB4eqNkPcFJehQwfIHIH79DB5ZaAIqUY/edit?usp=sharing', '_blank');
}





