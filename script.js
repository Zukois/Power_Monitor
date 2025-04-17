// Inisialisasi MQTT
const client = mqtt.connect("wss://broker.emqx.io:8084/mqtt");

client.on("connect", () => {
  console.log("MQTT connected");
  document.getElementById("mqttStatus").textContent = "🟢 Connected";
  client.subscribe("panel1/data", { qos: 0 });
  client.subscribe("panel2/data", { qos: 0 });
});

client.on("error", (err) => {
  console.error("MQTT error", err);
  document.getElementById("mqttStatus").textContent = "🔴 Connection Error";
});

client.on("offline", () => {
  console.warn("MQTT offline");
  document.getElementById("mqttStatus").textContent = "🔴 Offline";
});

client.on("reconnect", () => {
  console.log("MQTT reconnecting...");
  document.getElementById("mqttStatus").textContent = "🟠 Reconnecting...";
});

// Grafik setup
const voltageCharts = {};
const currentCharts = {};

["1", "2"].forEach((panel) => {
  const vCtx = document.getElementById(`voltageChart${panel}`).getContext("2d");
  const cCtx = document.getElementById(`currentChart${panel}`).getContext("2d");

  voltageCharts[panel] = new Chart(vCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        { 
          label: "VR", 
          data: [], 
          borderColor: "red", 
          fill: false, 
          tension: 0.4 // Menambahkan kelengkungan pada garis
        },
        { 
          label: "VS", 
          data: [], 
          borderColor: "green", 
          fill: false, 
          tension: 0.4 // Menambahkan kelengkungan pada garis
        },
        { 
          label: "VT", 
          data: [], 
          borderColor: "blue", 
          fill: false, 
          tension: 0.4 // Menambahkan kelengkungan pada garis
        }
      ]
    },
    options: {
      responsive: true,
      animation: {
        duration: 500, // Durasi animasi lebih halus
        easing: "easeInOutQuad" // Easing animasi
      },
      scales: {
        y: { 
          title: { display: true, text: "Volt (V)" },
          ticks: { beginAtZero: false }
        },
        x: { 
          title: { display: true, text: "Waktu" },
          ticks: { autoSkip: true }
        }
      }
    }
  });

  currentCharts[panel] = new Chart(cCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        { 
          label: "IR", 
          data: [], 
          borderColor: "red", 
          fill: false, 
          tension: 0.4 // Menambahkan kelengkungan pada garis
        },
        { 
          label: "IS", 
          data: [], 
          borderColor: "green", 
          fill: false, 
          tension: 0.4 // Menambahkan kelengkungan pada garis
        },
        { 
          label: "IT", 
          data: [], 
          borderColor: "blue", 
          fill: false, 
          tension: 0.4 // Menambahkan kelengkungan pada garis
        }
      ]
    },
    options: {
      responsive: true,
      animation: {
        duration: 500, // Durasi animasi lebih halus
        easing: "easeInOutQuad" // Easing animasi
      },
      scales: {
        y: { 
          title: { display: true, text: "Arus (A)" },
          ticks: { beginAtZero: false }
        },
        x: { 
          title: { display: true, text: "Waktu" },
          ticks: { autoSkip: true }
        }
      }
    }
  });
});


// Menerima pesan MQTT
client.on("message", (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    const panel = topic.includes("panel1") ? "1" : "2";

    // Update tampilan tegangan dan arus
    document.getElementById(`voltageR${panel}`).textContent = `Fasa R: ${data.vr} V`;
    document.getElementById(`voltageS${panel}`).textContent = `Fasa S: ${data.vs} V`;
    document.getElementById(`voltageT${panel}`).textContent = `Fasa T: ${data.vt} V`;
    document.getElementById(`currentR${panel}`).textContent = `Fasa R: ${data.ir} A`;
    document.getElementById(`currentS${panel}`).textContent = `Fasa S: ${data.is} A`;
    document.getElementById(`currentT${panel}`).textContent = `Fasa T: ${data.it} A`;

    // Hitung daya per fase dan total
    const pr = data.vr * data.ir;
    const ps = data.vs * data.is;
    const pt = data.vt * data.it;
    const total = pr + ps + pt;

    const powerEls = document.querySelectorAll(`#powerPanel${panel} div`);
    powerEls[0].textContent = `Fasa R: ${pr.toFixed(1)} W`;
    powerEls[1].textContent = `Fasa S: ${ps.toFixed(1)} W`;
    powerEls[2].textContent = `Fasa T: ${pt.toFixed(1)} W`;
    powerEls[3].textContent = `Total: ${total.toFixed(1)} W`;

    // Tambahkan ke grafik
    const now = new Date();
    const label = now.toLocaleTimeString();

    const vChart = voltageCharts[panel];
    const cChart = currentCharts[panel];

    vChart.data.labels.push(label);
    vChart.data.datasets[0].data.push(data.vr);
    vChart.data.datasets[1].data.push(data.vs);
    vChart.data.datasets[2].data.push(data.vt);

    cChart.data.labels.push(label);
    cChart.data.datasets[0].data.push(data.ir);
    cChart.data.datasets[1].data.push(data.is);
    cChart.data.datasets[2].data.push(data.it);

    // Batasin data 20 terakhir biar nggak berat
    if (vChart.data.labels.length > 20) {
      vChart.data.labels.shift();
      vChart.data.datasets.forEach(ds => ds.data.shift());
    }
    if (cChart.data.labels.length > 20) {
      cChart.data.labels.shift();
      cChart.data.datasets.forEach(ds => ds.data.shift());
    }

    vChart.update();
    cChart.update();

  } catch (err) {
    console.error("MQTT data error:", err);
  }
});

function updateTime() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();
    let day = now.getDate();
    let month = now.getMonth() + 1; // Bulan dimulai dari 0, jadi kita tambahkan 1
    let year = now.getFullYear();
  
    // Menambahkan leading zero pada jam, menit, dan detik jika kurang dari 10
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;
  
    // Menampilkan waktu dalam format HH:MM:SS dan tanggal dalam format DD/MM/YYYY
    const time = `${hours}:${minutes}:${seconds}`;
    const date = `${day < 10 ? '0' + day : day}/${month < 10 ? '0' + month : month}/${year}`;
  
    // Update waktu di elemen HTML
    document.getElementById('datetime1').textContent = `${time} | ${date}`;
    document.getElementById('datetime2').textContent = `${time} | ${date}`;
  }
  
  // Update waktu setiap detik
  setInterval(updateTime, 1000);
  
