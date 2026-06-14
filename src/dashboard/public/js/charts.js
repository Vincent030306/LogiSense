/**
 * LogiSense — Chart.js implementations
 */

Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = "'Inter', sans-serif";

let financeChartInstance = null;
let segmentChartInstance = null;

async function initCharts() {
    const revData = await api.getRevenueData();
    const segData = await api.getSegmentData();

    if (revData) renderFinanceChart(revData);
    if (segData) renderSegmentChart(segData);
}

function renderFinanceChart(data) {
    const ctx = document.getElementById('financeChart');
    if (!ctx) return;

    const labels = data.map(d => d.fiscal_month);
    const revenues = data.map(d => d.revenue);
    const profits = data.map(d => d.net_profit);

    financeChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Revenue',
                    data: revenues,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Net Profit',
                    data: profits,
                    borderColor: '#10b981',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'top', align: 'end' }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: {
                        callback: function(value) {
                            return 'Rp ' + (value / 1000000) + 'M';
                        }
                    }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

function renderSegmentChart(data) {
    const ctx = document.getElementById('segmentChart');
    if (!ctx) return;

    const labels = data.map(d => d.category);
    const values = data.map(d => d.revenue);

    segmentChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: { position: 'right' }
            }
        }
    });
}
