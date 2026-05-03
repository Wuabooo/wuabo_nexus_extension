// WUABO Nexus - Background Service Worker

const NEXUS_SERVER_URL = 'http://localhost:5556';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'import_asset') {
        fetch(`${NEXUS_SERVER_URL}/import`, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ asset_name: request.assetName })
        })
        .then(response => response.json())
        .then(data => {
            sendResponse({ status: 'success', data });
        })
        .catch((error) => {
            console.error('[WUABO Nexus] Error:', error);
            sendResponse({ status: 'error', message: error.message });
        });
        
        return true;
    }

    if (request.action === 'get_status') {
        fetch(`${NEXUS_SERVER_URL}/status`)
        .then(response => response.json())
        .then(data => {
            sendResponse({ status: 'success', data });
        })
        .catch((error) => {
            sendResponse({ status: 'error', message: error.message });
        });

        return true;
    }

    if (request.action === 'reset_queue') {
        fetch(`${NEXUS_SERVER_URL}/reset`, { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            sendResponse({ status: 'success', data });
        })
        .catch((error) => {
            sendResponse({ status: 'error', message: error.message });
        });

        return true;
    }
});
