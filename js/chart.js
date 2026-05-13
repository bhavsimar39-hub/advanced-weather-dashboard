/* ============================================================
   ATMOS — CHART MODULE
   Gradient line chart with multi-data-type support
   ============================================================ */

let weatherChart;
let lastData = null;

const CHART_STYLES = {
  temp: {
    label: "Temperature (°C)",
    color: "79,172,254",
    getData: (d) => d.forecast.forecastday.map((day) => day.day.avgtemp_c),
  },
  rain: {
    label: "Rain Chance (%)",
    color: "167,139,250",
    getData: (d) => d.forecast.forecastday.map((day) => day.day.daily_chance_of_rain),
  },
  humidity: {
    label: "Humidity (%)",
    color: "251,191,36",
    getData: (d) => d.forecast.forecastday.map((day) => day.day.avghumidity),
  },
};

export function createChart(data, type = "temp") {
  lastData = data;
  const canvas = document.getElementById("weatherChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const labels = data.forecast.forecastday.map((day) =>
    new Date(day.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
  );

  const style = CHART_STYLES[type] || CHART_STYLES.temp;
  const values = style.getData(data);

  // Gradient fill
  const gradient = ctx.createLinearGradient(0, 0, 0, 280);
  gradient.addColorStop(0, `rgba(${style.color},0.35)`);
  gradient.addColorStop(1, `rgba(${style.color},0)`);

  if (weatherChart) weatherChart.destroy();

  weatherChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: style.label,
          data: values,
          borderColor: `rgba(${style.color},1)`,
          backgroundColor: gradient,
          borderWidth: 2.5,
          tension: 0.45,
          fill: true,
          pointBackgroundColor: `rgba(${style.color},1)`,
          pointBorderColor: "#0d1424",
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(13,20,36,0.95)",
          borderColor: `rgba(${style.color},0.3)`,
          borderWidth: 1,
          titleColor: "#8896b3",
          bodyColor: "#f0f4ff",
          titleFont: { family: "DM Sans", size: 11 },
          bodyFont: { family: "DM Mono", size: 14, weight: "500" },
          padding: 14,
          cornerRadius: 12,
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,0.04)", drawBorder: false },
          ticks: {
            color: "#4a567a",
            font: { family: "DM Sans", size: 11 },
          },
          border: { display: false },
        },
        y: {
          grid: { color: "rgba(255,255,255,0.04)", drawBorder: false },
          ticks: {
            color: "#4a567a",
            font: { family: "DM Mono", size: 11 },
          },
          border: { display: false },
        },
      },
    },
  });
}

export function switchChartType(type) {
  if (lastData) createChart(lastData, type);
}