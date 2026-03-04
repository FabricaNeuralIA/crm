// --- dashboard.js (FINAL) ---

const GET_DASHBOARD_DATA_PATH = "/dashboard-data";

const statusColors = {
  'Sem retorno': '#1e40af',
  'FollowUp 10m': '#1d4ed8',
  'FollowUp 1h': '#1e3a8a',
  'Encaminhado': '#dc2626',
  'Finalizado': '#b91c1c',     // Cor existente
  'Perdido': '#991b1b',
  'null': '#22c55e',
  'Atendimento': '#dc2626',
  'Agendado': '#1d4ed8',
  
  // <-- MODIFICADO: Novas cores para a coluna 'atendimento'
  'aberto': '#3b82f6',     // Azul
  'abandonado': '#f97316', // Laranja
};

let statusPieChartInstance = null;
let performanceBarChartInstance = null;
let conversionGaugeChartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById('stat-total-leads')) {
    fetchDashboardData();
  }
});

async function fetchDashboardData() {
  try {
    const rawDataArray = await apiFetch(GET_DASHBOARD_DATA_PATH);
    if (!rawDataArray?.length) throw new Error("Nenhum dado retornado.");

    const mergedData = rawDataArray[0];

    const data = {
      totalLeads: parseInt(mergedData.total_leads, 10) || 0,
      novosLeads7d: parseInt(mergedData.novos_leads_7d, 10) || 0,
      encaminhados7d: parseInt(mergedData.encaminhados_7d, 10) || 0,
      encaminhadosTotal: parseInt(mergedData.encaminhados_total, 10) || 0,
      perdidosFinalizados: parseInt(mergedData.perdidos_finalizados, 10) || 0,
      statusCountsRaw: [],
      leadsPorDiaRaw: []
    };

    // <-- MODIFICADO: Agora usa 'lista_atendimento' da API
    // Lista Status (baseado na coluna 'atendimento')
    if (Array.isArray(mergedData.lista_atendimento)) {
      data.statusCountsRaw = mergedData.lista_atendimento
        .map(i => ({
          status: i.atendimento, // <-- Espera um campo 'atendimento'
          count: parseInt(i.count, 10) || 0
        }))
        .filter(i => i.count > 0 && i.status !== null); // Garante que não tem nulos
    }
    // FIM DA MODIFICAÇÃO

    // Leads por Dia (ordenado)
    if (Array.isArray(mergedData.leads_por_dia)) {
      data.leadsPorDiaRaw = mergedData.leads_por_dia
        .map(i => ({ day: i.day, count: parseInt(i.count, 10) || 0 }))
        .filter(i => i.day)
        .sort((a, b) => new Date(a.day) - new Date(b.day));
    }

    updateStats(data);
    renderStatusChart(data.statusCountsRaw); 
    renderPerformanceBarChart(data.leadsPorDiaRaw);
    renderConversionGaugeChart(data.encaminhadosTotal, data.totalLeads);

  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    alert("Erro ao carregar dashboard. Veja o console.");
  }
}

function updateStats(data) {
  document.getElementById('stat-total-leads').textContent = data.totalLeads;
  document.getElementById('stat-novos-leads').textContent = data.novosLeads7d;
  document.getElementById('stat-encaminhados-7d').textContent = data.encaminhados7d;
  document.getElementById('stat-encaminhados-total').textContent = data.encaminhadosTotal;
  document.getElementById('stat-perdidos').textContent = data.perdidosFinalizados;
}

function renderStatusChart(statusCountsRaw) {
  const canvas = document.getElementById('statusPieChart'); 
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (statusPieChartInstance) statusPieChartInstance.destroy();

  // <-- MODIFICADO: Filtro removido para mostrar todos os status
  // (ex: 'aberto', 'finalizado', 'abandonado')
  if (!statusCountsRaw.length) { 
    ctx.font = "16px Arial";
    ctx.fillStyle = "#9ca3af";
    ctx.textAlign = "center";
    ctx.fillText("Sem dados de atendimento", canvas.width / 2, canvas.height / 2);
    return;
  }

  const labels = statusCountsRaw.map(i => i.status);
  const values = statusCountsRaw.map(i => i.count);
  const colors = labels.map(l => statusColors[l] || '#dc2626'); // Usa as novas cores

  statusPieChartInstance = new Chart(ctx, {
    type: 'bar',
    data: { 
      labels, 
      datasets: [{ 
        data: values, 
        backgroundColor: colors 
      }] 
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { 
        y: { 
          beginAtZero: true,
          ticks: {
            precision: 0 
          }
        } 
      },
      plugins: {
        legend: { display: false }, 
        tooltip: {
          callbacks: {
            label: ctx => {
              const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
              const val = ctx.parsed.y;
              const perc = total > 0 ? ((val / total) * 100).toFixed(1) + '%' : '0%';
              return `${ctx.label}: ${val} (${perc})`;
            }
          }
        }
      }
    }
  });
}

function renderPerformanceBarChart(leadsPorDiaRaw) {
  const canvas = document.getElementById('performanceBarChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (performanceBarChartInstance) performanceBarChartInstance.destroy();

  if (!leadsPorDiaRaw.length) {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#9ca3af";
    ctx.textAlign = "center";
    ctx.fillText("Sem dados", canvas.width / 2, canvas.height / 2);
    return;
  }

  const labels = leadsPorDiaRaw.map(i => new Date(i.day).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }));
  const values = leadsPorDiaRaw.map(i => i.count);

  performanceBarChartInstance = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Novos Leads', data: values, backgroundColor: '#3b82f6' }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}

function renderConversionGaugeChart(encaminhadosTotal, totalLeads) {
  const canvas = document.getElementById('trendLineChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (conversionGaugeChartInstance) conversionGaugeChartInstance.destroy();

  const taxa = totalLeads > 0 ? (encaminhadosTotal / totalLeads) * 100 : 0;
  const taxaFinal = Math.min(taxa, 100);
  const taxaStr = taxaFinal.toFixed(1) + '%';

  conversionGaugeChartInstance = new Chart(ctx, {
    type: 'doughnut',
  	data: {
      datasets: [{
        data: [taxaFinal, 100 - taxaFinal],
        backgroundColor: ['#3b82f6', '#e5e7eb'],
        borderWidth: 0,
        circumference: 180,
        rotation: 270,
        cutout: '80%',
        borderRadius: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      animation: { animateRotate: true, duration: 1500, easing: 'easeOutQuart' }
},
    plugins: [{
      id: 'centerPercentage',
      afterDraw(chart) {
        const { ctx, chartArea: { width, height } } = chart;
        const centerX = width / 2;
  	  const centerY = height / 2 + 15;
        ctx.save();
        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = '#1e40af';
        ctx.textAlign = 'center';
    	ctx.textBaseline = 'middle';
        ctx.fillText(taxaStr, centerX, centerY);
        ctx.restore();
      }
    }]
  });
}