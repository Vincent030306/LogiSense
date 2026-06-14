/**
 * LogiSense — API Client for Frontend
 */

const API_BASE = '/api';

async function fetchAPI(endpoint) {
    try {
        const res = await fetch(`${API_BASE}${endpoint}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`API Error on ${endpoint}:`, err);
        return null;
    }
}

const api = {
    getSummary: () => fetchAPI('/dashboard/summary'),
    getRevenueData: () => fetchAPI('/dashboard/revenue'),
    getSegmentData: () => fetchAPI('/dashboard/revenue-by-category'),
    getLessons: () => fetchAPI('/ai/lessons'),
    getDecisions: () => fetchAPI('/ai/decisions'),
    getOrders: (limit = 10) => fetchAPI(`/orders?limit=${limit}`),
    getFleet: () => fetchAPI('/fleet'),
    getChatMessages: () => fetchAPI('/chat/messages'),
};

// Utils formatters
const formatRp = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
};

const formatPct = (num) => {
    return (num * 100).toFixed(1) + '%';
};
