// WUABO Nexus - Background Service Worker

const NEXUS_SERVER_URL = 'http://localhost:5556/import';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'import_asset') {
        console.log(`[WUABO Nexus] Sending ${request.assetName} to Blender...`);
        
        fetch(NEXUS_SERVER_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ asset_name: request.assetName })
        })
        .then(response => response.json())
        .then(data => {
            console.log('[WUABO Nexus] Success:', data);
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icon128.png',
                title: 'WUABO Nexus',
                message: `Successfully sent ${request.assetName} to Blender!`
            });
            sendResponse({ status: 'success', data });
        })
        .catch((error) => {
            console.error('[WUABO Nexus] Error:', error);
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icon128.png',
                title: 'WUABO Nexus Error',
                message: `Could not reach Blender. Is WUABO Nexus active?`
            });
            sendResponse({ status: 'error', message: error.message });
        });
        
        return true; // Keep message channel open for async response
    }
});
