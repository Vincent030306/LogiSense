/**
 * LogiSense — Main Frontend Application Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    initNavigation();
    
    // Load initial data
    await loadDashboardSummary();
    await loadAILessons();
    initCharts();
    
    // Setup WebSocket
    initWebSocket();
});

// ─── Navigation ──────────────────────────────────────────────────
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.view-section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');
            
            // Update nav active state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Update title
            document.getElementById('current-page-title').innerText = item.querySelector('span').innerText;

            // Show section
            sections.forEach(sec => sec.classList.remove('active'));
            const targetSec = document.getElementById('view-' + targetId);
            if (targetSec) {
                targetSec.classList.add('active');
                
                // Lazy load data for specific tabs
                if (targetId === 'fleet') loadFleet();
                if (targetId === 'finance') loadFinance();
                if (targetId === 'wa-cs') loadWA();
            }
        });
    });
}

// ─── Data Loading ────────────────────────────────────────────────
async function loadDashboardSummary() {
    const data = await api.getSummary();
    if (!data) return;

    // Update KPIs
    document.getElementById('kpi-revenue').innerText = formatRp(data.revenue.total_revenue || 0);
    document.getElementById('kpi-active-trips').innerText = data.orders.active;
    
    const utilPct = data.fleet.vehicles ? (data.orders.active / data.fleet.vehicles) * 100 : 0;
    document.getElementById('kpi-fleet-util').innerText = Math.round(utilPct) + '%';
    
    document.getElementById('kpi-ai-savings').innerText = formatRp(data.ai.savings);
    document.getElementById('kpi-margin').innerText = formatPct(data.revenue.avg_margin || 0);
}

async function loadAILessons() {
    const lessons = await api.getLessons();
    if (!lessons) return;

    const container = document.getElementById('lessons-container');
    if (!container) return;
    container.innerHTML = '';

    lessons.slice(0, 5).forEach(lesson => {
        const div = document.createElement('div');
        div.className = 'lesson-card';
        div.innerHTML = `
            <div class="category">${lesson.category} • Conf: ${(lesson.confidence * 100).toFixed(0)}%</div>
            <p>${lesson.rule}</p>
        `;
        container.appendChild(div);
    });
}

async function loadFleet() {
    const fleet = await api.getFleet();
    if (!fleet) return;
    const tbody = document.querySelector('#fleet-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    fleet.forEach(v => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${v.id}</td>
            <td><b>${v.plate_number}</b></td>
            <td>${v.type}</td>
            <td>${v.driver_name || '-'}</td>
            <td>${v.capacity_kg} kg</td>
            <td><span class="status-badge idle">Available</span></td>
        `;
        tbody.appendChild(tr);
    });
}

async function loadFinance() {
    const orders = await api.getOrders(20);
    if (!orders) return;
    const tbody = document.querySelector('#finance-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    orders.forEach(o => {
        const tr = document.createElement('tr');
        const marginPct = ((o.gross_margin || 0) * 100).toFixed(1);
        const marginColor = marginPct > 10 ? 'var(--color-success)' : (marginPct > 0 ? 'var(--color-warning)' : 'var(--color-danger)');
        tr.innerHTML = `
            <td>${new Date(o.date).toLocaleDateString('id-ID')}</td>
            <td>${o.id}</td>
            <td>${o.customer_name || 'Retail'}</td>
            <td class="money">${formatRp(o.revenue_excl_ppn)}</td>
            <td class="money">${formatRp(o.direct_costs || 0)}</td>
            <td style="color: ${marginColor}; font-weight: bold;">${marginPct}%</td>
        `;
        tbody.appendChild(tr);
    });
}

async function loadWA() {
    const msgs = await api.getChatMessages();
    const container = document.getElementById('wa-chat-container');
    if (!container) return;
    container.innerHTML = '';
    if (!msgs || msgs.length === 0) {
        container.innerHTML = '<div style="text-align:center; color: var(--color-text-muted); padding: 40px;">Belum ada chat yang tersimpan di sesi ini.</div>';
        return;
    }
    // Render messages if chat_messages table was populated
}

// ─── WebSocket & Live Feed ───────────────────────────────────────
let ws = null;

function initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/live`;
    
    ws = new WebSocket(wsUrl);
    const statusEl = document.getElementById('ws-status');

    ws.onopen = () => {
        statusEl.innerText = 'System Online';
        statusEl.parentElement.style.color = 'var(--color-success)';
    };

    ws.onclose = () => {
        statusEl.innerText = 'Disconnected - Reconnecting...';
        statusEl.parentElement.style.color = 'var(--color-danger)';
        setTimeout(initWebSocket, 5000);
    };

    ws.onmessage = (event) => {
        try {
            const payload = JSON.parse(event.data);
            handleLiveEvent(payload);
        } catch (e) {
            console.error('WS Parse Error:', e);
        }
    };
}

function handleLiveEvent(payload) {
    const { type, data, timestamp } = payload;
    
    if (type === 'ops_update') {
        addFeedItem('ph-robot', 'AI Ops Agent', data.message, timestamp);
        loadDashboardSummary(); // refresh counters
    } else if (type === 'driver_report') {
        addFeedItem('ph-truck', 'Driver Update', data.message, timestamp);
    } else if (type === 'new_order') {
        addFeedItem('ph-package', 'New Order', `Order ${data.id} received.`, timestamp);
        loadDashboardSummary();
    } else if (type === 'vehicle_location_update') {
        if (typeof updateFleetMarker === 'function') {
            updateFleetMarker(data.id, data.plate, data.lat, data.lng);
        }
    }
}

function addFeedItem(iconClass, title, desc, timestamp) {
    const container = document.getElementById('live-feed-container');
    if (!container) return;

    const timeStr = new Date(timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const div = document.createElement('div');
    div.className = 'feed-item';
    div.innerHTML = `
        <div class="feed-icon"><i class="ph ${iconClass}"></i></div>
        <div class="feed-content">
            <div class="feed-title">${title}</div>
            <div class="feed-desc">${desc}</div>
        </div>
        <div class="feed-time">${timeStr}</div>
    `;

    container.insertBefore(div, container.firstChild);
    
    // Keep max 10 items
    if (container.children.length > 10) {
        container.removeChild(container.lastChild);
    }
}

// ─── Simple AI Chat Interaction ──────────────────────────────────
document.getElementById('btn-ask-opa')?.addEventListener('click', async () => {
    const input = document.getElementById('opa-input');
    const msg = input.value.trim();
    if (!msg) return;

    // Add user msg
    addChatMessage('user', msg);
    input.value = '';

    // Show typing
    addChatMessage('ai', 'Mengetik...');
    
    try {
        const res = await fetch('/api/chat/owner', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg })
        });
        const data = await res.json();
        
        // Remove typing message
        const container = document.getElementById('opa-chat-history');
        if(container.lastChild) container.removeChild(container.lastChild);

        addChatMessage('ai', data.reply.replace(/\n/g, '<br>'));
    } catch (e) {
        console.error(e);
        // Remove typing
        const container = document.getElementById('opa-chat-history');
        if(container.lastChild) container.removeChild(container.lastChild);
        
        addChatMessage('ai', 'Maaf Bos, gagal memanggil DeepSeek API.');
    }
});

function addChatMessage(role, text) {
    const container = document.getElementById('opa-chat-history');
    if (!container) return;

    const div = document.createElement('div');
    div.className = `chat-msg ${role}`;
    const icon = role === 'ai' ? 'ph-robot' : 'ph-user';
    
    div.innerHTML = `
        <div class="msg-avatar"><i class="ph-fill ${icon}"></i></div>
        <div class="msg-bubble">${text}</div>
    `;
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}
