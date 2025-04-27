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

function updateChartFromDataEls1() {
  const voltR = parseFloat(dataEls1.voltR.textContent) || 0;
  const voltS = parseFloat(dataEls1.voltS.textContent) || 0;
  const voltT = parseFloat(dataEls1.voltT.textContent) || 0;
  const ampR = parseFloat(dataEls1.ampR.textContent) || 0;
  const ampS = parseFloat(dataEls1.ampS.textContent) || 0;
  const ampT = parseFloat(dataEls1.ampT.textContent) || 0;

  updateChartPanel1(voltR, voltS, voltT, ampR, ampS, ampT);
}


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

function updateChartFromDataEls2() {
  const voltR = parseFloat(dataEls2.voltR.textContent) || 0;
  const voltS = parseFloat(dataEls2.voltS.textContent) || 0;
  const voltT = parseFloat(dataEls2.voltT.textContent) || 0;
  const ampR = parseFloat(dataEls2.ampR.textContent) || 0;
  const ampS = parseFloat(dataEls2.ampS.textContent) || 0;
  const ampT = parseFloat(dataEls2.ampT.textContent) || 0;

  updateChartPanel2(voltR, voltS, voltT, ampR, ampS, ampT);
}

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
        updateChartFromDataEls1();
      }
      if (topic === 'panel2/data') {
        updateVoltRPanel2(data.voltR); // Update Panel 2
        updateChartFromDataEls2();
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
  window.open('https://docs.google.com/spreadsheets/d/1mXYcpft7fxiFB4eqNkPcFJehQwfIHIH79DB5ZaAIqUY/edit?gid=0#gid=0', '_blank');
}


function updateChartPanel1(voltR, voltS, voltT, ampR, ampS, ampT) {
  const timeNow = new Date().toLocaleTimeString();

  chartPanel1.data.labels.push(timeNow);
  chartPanel1.data.datasets[0].data.push(voltR);
  chartPanel1.data.datasets[1].data.push(voltS);
  chartPanel1.data.datasets[2].data.push(voltT);
  chartPanel1.data.datasets[3].data.push(ampR);
  chartPanel1.data.datasets[4].data.push(ampS);
  chartPanel1.data.datasets[5].data.push(ampT);

  if (chartPanel1.data.labels.length > 10) {
    chartPanel1.data.labels.shift();
    chartPanel1.data.datasets.forEach(dataset => dataset.data.shift());
  }

  chartPanel1.update();
}

function updateChartPanel2(voltageR, voltageS, voltageT, currentR, currentS, currentT) {
  const timeNow = new Date().toLocaleTimeString();

  chartPanel2.data.labels.push(timeNow);
  chartPanel2.data.datasets[0].data.push(voltageR);
  chartPanel2.data.datasets[1].data.push(voltageS);
  chartPanel2.data.datasets[2].data.push(voltageT);
  chartPanel2.data.datasets[3].data.push(currentR);
  chartPanel2.data.datasets[4].data.push(currentS);
  chartPanel2.data.datasets[5].data.push(currentT);

  if (chartPanel2.data.labels.length > 10) {
    chartPanel2.data.labels.shift();
    chartPanel2.data.datasets.forEach(dataset => dataset.data.shift());
  }

  chartPanel2.update();
}

// Chart untuk Panel 1
const ctxPanel1 = document.getElementById('chartPanel1').getContext('2d');
const chartPanel1 = new Chart(ctxPanel1, {
  type: 'line',
  data: {
    labels: [], // timestamps atau data waktu
    datasets: [
      {
        label: 'Tegangan R',
        borderColor: 'red',
        data: [],
        fill: false
      },
      {
        label: 'Tegangan S',
        borderColor: 'green',
        data: [],
        fill: false
      },
      {
        label: 'Tegangan T',
        borderColor: 'blue',
        data: [],
        fill: false
      },
      {
        label: 'Arus R',
        borderColor: 'orange',
        borderDash: [5, 5],
        data: [],
        fill: false
      },
      {
        label: 'Arus S',
        borderColor: 'purple',
        borderDash: [5, 5],
        data: [],
        fill: false
      },
      {
        label: 'Arus T',
        borderColor: 'cyan',
        borderDash: [5, 5],
        data: [],
        fill: false
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: true,
    animation: {
      duration: 1200,
      easing: 'easeInOutSine'
    },
    interaction: {
      mode: 'nearest',
      intersect: false,
    },
    elements: {
      line: {
        tension: 0.4, // Smooth curve
        borderWidth: 3,
        borderJoinStyle: 'round',
        borderCapStyle: 'round',
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        shadowBlur: 10,
        shadowColor: 'rgba(255,255,255,0.5)'
      },
      point: {
        radius: 2,
        hoverRadius: 5,
        backgroundColor: '#ffffff',
        borderWidth: 2
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'white',
          font: {
            size: 10,
            weight: 'normal'
          },
          boxWidth: 10,
          boxHeight: 8
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        titleFont: { size: 12 },
        bodyFont: { size: 10 },
        cornerRadius: 6
      }
    },
    scales: {
      x: {
        ticks: {
          color: 'rgba(255,255,255,0.7)',
          font: {
            size: 10
          }
        },
        grid: {
          color: 'rgba(255,255,255,0.1)'
        },
        title: {
          display: true,
          text: 'Waktu',
          color: 'white',
          font: {
            size: 12
          }
        }
      },
      y: {
        ticks: {
          color: 'rgba(255,255,255,0.7)',
          font: {
            size: 10
          }
        },
        grid: {
          color: 'rgba(255,255,255,0.1)'
        },
        title: {
          display: true,
          text: 'Nilai',
          color: 'white',
          font: {
            size: 12
          }
        }
      }
    }
  } 
});

// Chart untuk Panel 2
const ctxPanel2 = document.getElementById('chartPanel2').getContext('2d');
const chartPanel2 = new Chart(ctxPanel2, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      {
        label: 'Tegangan R',
        borderColor: 'red',
        data: [],
        fill: false
      },
      {
        label: 'Tegangan S',
        borderColor: 'green',
        data: [],
        fill: false
      },
      {
        label: 'Tegangan T',
        borderColor: 'blue',
        data: [],
        fill: false
      },
      {
        label: 'Arus R',
        borderColor: 'orange',
        borderDash: [5, 5],
        data: [],
        fill: false
      },
      {
        label: 'Arus S',
        borderColor: 'purple',
        borderDash: [5, 5],
        data: [],
        fill: false
      },
      {
        label: 'Arus T',
        borderColor: 'cyan',
        borderDash: [5, 5],
        data: [],
        fill: false
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: true,
    animation: {
      duration: 1200,
      easing: 'easeInOutSine'
    },
    interaction: {
      mode: 'nearest',
      intersect: false,
    },
    elements: {
      line: {
        tension: 0.4, // Smooth curve
        borderWidth: 3,
        borderJoinStyle: 'round',
        borderCapStyle: 'round',
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        shadowBlur: 10,
        shadowColor: 'rgba(255,255,255,0.5)'
      },
      point: {
        radius: 2,
        hoverRadius: 5,
        backgroundColor: '#ffffff',
        borderWidth: 2
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'white',
          font: {
            size: 10,
            weight: 'normal'
          },
          boxWidth: 10,
          boxHeight: 8
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        titleFont: { size: 12 },
        bodyFont: { size: 10 },
        cornerRadius: 6
      }
    },
    scales: {
      x: {
        ticks: {
          color: 'rgba(255,255,255,0.7)',
          font: {
            size: 10
          }
        },
        grid: {
          color: 'rgba(255,255,255,0.1)'
        },
        title: {
          display: true,
          text: 'Waktu',
          color: 'white',
          font: {
            size: 12
          }
        }
      },
      y: {
        ticks: {
          color: 'rgba(255,255,255,0.7)',
          font: {
            size: 10
          }
        },
        grid: {
          color: 'rgba(255,255,255,0.1)'
        },
        title: {
          display: true,
          text: 'Nilai',
          color: 'white',
          font: {
            size: 12
          }
        }
      }
    }
  }  
});






