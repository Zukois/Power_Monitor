const broker = 'wss://broker.emqx.io:8084/mqtt';
const client = mqtt.connect(broker);
const mqttStatusEl = document.getElementById("mqtt-status");
let tegangan = { R: 0, S: 0, T: 0 };
let arus = { R: 0, S: 0, T: 0 };


// DOM Elements
const vR = document.getElementById("vR");
const vS = document.getElementById("vS");
const vT = document.getElementById("vT");
const iR = document.getElementById("iR");
const iS = document.getElementById("iS");
const iT = document.getElementById("iT");
const logData = []; // Simpan semua data logging

function exportCSV() {
    if (logData.length === 0) {
        alert("Belum ada data untuk diekspor!");
        return;
    }

    const header = [
        "Waktu", "Tegangan R", "Tegangan S", "Tegangan T",
        "Arus R", "Arus S", "Arus T",
        "Daya R", "Daya S", "Daya T"
    ];

    const rows = logData.map(row => [
        row.time, row.vR, row.vS, row.vT,
        row.iR, row.iS, row.iT,
        row.pR, row.pS, row.pT
    ]);

    const csvContent = [header, ...rows]
        .map(e => e.join(","))
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "log_data_R_S_T.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Line Chart Setup
const ctx = document.getElementById("lineChart").getContext("2d");
const chartData = {
    labels: [],
    datasets: [
        {
            label: "Tegangan R",
            borderColor: "#f87171",
            backgroundColor: "rgba(248,113,113,0.1)",
            data: [],
            tension: 0.4
        },
        {
            label: "Tegangan S",
            borderColor: "#60a5fa",
            backgroundColor: "rgba(96,165,250,0.1)",
            data: [],
            tension: 0.4
        },
        {
            label: "Tegangan T",
            borderColor: "#34d399",
            backgroundColor: "rgba(52,211,153,0.1)",
            data: [],
            tension: 0.4
        }
    ]
};

const lineChart = new Chart(ctx, {
    type: "line",
    data: chartData,
    options: {
        responsive: true,
        plugins: { legend: { labels: { color: "#ccc" } } },
        scales: {
            y: { beginAtZero: true, ticks: { color: "#ccc" }, grid: { color: "#333" } },
            x: { ticks: { color: "#ccc" }, grid: { display: false } }
        }
    }
});

const currentCtx = document.getElementById("currentChart").getContext("2d");

const currentData = {
    labels: [],
    datasets: [
        {
            label: "Arus R",
            borderColor: "#facc15", // kuning
            backgroundColor: "rgba(250,204,21,0.1)",
            data: [],
            tension: 0.4
        },
        {
            label: "Arus S",
            borderColor: "#fb923c", // oranye
            backgroundColor: "rgba(251,146,60,0.1)",
            data: [],
            tension: 0.4
        },
        {
            label: "Arus T",
            borderColor: "#f472b6", // pink
            backgroundColor: "rgba(244,114,182,0.1)",
            data: [],
            tension: 0.4
        }
    ]
};

const currentChart = new Chart(currentCtx, {
    type: "line",
    data: currentData,
    options: {
        responsive: true,
        plugins: { legend: { labels: { color: "#ccc" } } },
        scales: {
            y: { beginAtZero: true, ticks: { color: "#ccc" }, grid: { color: "#333" } },
            x: { ticks: { color: "#ccc" }, grid: { display: false } }
        }
    }
});


// MQTT Connect
client.on("connect", () => {
    console.log("Connected to broker");
    mqttStatusEl.textContent = "MQTT Status: Connected";
    mqttStatusEl.classList.remove("bg-red-600");
    mqttStatusEl.classList.add("bg-green-600");
    client.subscribe("sensor/tegangan");
    client.subscribe("sensor/arus");
});

// MQTT Message Handling
client.on("message", (topic, message) => {
    const payload = JSON.parse(message.toString());
    const time = new Date().toLocaleTimeString();

    if (topic === "sensor/tegangan") {
        vR.textContent = payload.R;
        vS.textContent = payload.S;
        vT.textContent = payload.T;
        tegangan = payload;
        // Push data ke grafik
        chartData.labels.push(time);
        chartData.datasets[0].data.push(payload.R);
        chartData.datasets[1].data.push(payload.S);
        chartData.datasets[2].data.push(payload.T);

        // Keep last 20 data
        if (chartData.labels.length > 20) {
            chartData.labels.shift();
            chartData.datasets.forEach(d => d.data.shift());
        }

        lineChart.update();
        updateTotalPower();
    }

    if (topic === "sensor/arus") {
        iR.textContent = payload.R;
        iS.textContent = payload.S;
        iT.textContent = payload.T;
        arus = payload;
        const time = new Date().toLocaleTimeString();
        currentData.labels.push(time);
        currentData.datasets[0].data.push(payload.R);
        currentData.datasets[1].data.push(payload.S);
        currentData.datasets[2].data.push(payload.T);

        if (currentData.labels.length > 20) {
            currentData.labels.shift();
            currentData.datasets.forEach(d => d.data.shift());
        }

        currentChart.update();
        updateTotalPower();
    }

    client.on("close", () => {
        console.log("MQTT disconnected");
        mqttStatusEl.textContent = "MQTT Status: Disconnected";
        mqttStatusEl.classList.remove("bg-green-600");
        mqttStatusEl.classList.add("bg-red-600");
    });

    function updateTotalPower() {
        const pR = Math.round(tegangan.R * arus.R);
        const pS = Math.round(tegangan.S * arus.S);
        const pT = Math.round(tegangan.T * arus.T);
        const total = pR + pS + pT;

        document.getElementById("powerR").textContent = pR;
        document.getElementById("powerS").textContent = pS;
        document.getElementById("powerT").textContent = pT;
        document.getElementById("totalPower").textContent = total;
    }

    logData.push({
        time: new Date().toLocaleString(),
        vR: tegangan.R,
        vS: tegangan.S,
        vT: tegangan.T,
        iR: arus.R,
        iS: arus.S,
        iT: arus.T,
        pR: Math.round(tegangan.R * arus.R),
        pS: Math.round(tegangan.S * arus.S),
        pT: Math.round(tegangan.T * arus.T)
    });


});

