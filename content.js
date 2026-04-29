// WUABO Nexus - Browser Extension Content Script

function sendToBlender(assetName) {
    chrome.runtime.sendMessage({ action: 'import_asset', assetName: assetName }, (response) => {
        if (response && response.status === 'success') {
            showNotification(`Sent ${assetName} to Blender!`);
        } else {
            showNotification(`Error: ${response ? response.message : 'Unknown error'}`, true);
        }
    });
}

function showNotification(message, isError = false) {
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.bottom = '20px';
    div.style.right = '20px';
    div.style.padding = '15px 25px';
    div.style.borderRadius = '8px';
    div.style.color = 'white';
    div.style.backgroundColor = isError ? '#ff4b2b' : '#00c851';
    div.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    div.style.zIndex = '100000';
    div.style.fontFamily = 'sans-serif';
    div.style.fontWeight = 'bold';
    div.style.transition = 'opacity 0.5s ease-in-out';
    div.innerText = message;
    
    document.body.appendChild(div);
    
    setTimeout(() => {
        div.style.opacity = '0';
        setTimeout(() => div.remove(), 500);
    }, 3000);
}

// --- Site Specific Logic ---

function injectPlebMasters() {
    // Check for the asset name input in the detail modal
    const nameInput = document.querySelector('input[id^="detail-input-Name-"]');
    if (nameInput && !nameInput.parentElement.querySelector('.wuabo-btn')) {
        const assetName = nameInput.value.trim();
        if (!assetName) return;

        const btn = createButton('SEND TO WUABO');
        btn.classList.add('wuabo-btn');
        btn.style.marginLeft = '10px';
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            sendToBlender(assetName);
        };
        
        // Find a good place to inject. Usually the parent of the input or the actions row
        const container = nameInput.closest('.v-field__append-inner') || nameInput.parentElement;
        container.appendChild(btn);
    }

    // Also inject into result cards if visible
    const cards = document.querySelectorAll('.v-card');
    cards.forEach(card => {
        if (card.querySelector('.v-card-title') && !card.querySelector('.wuabo-card-btn')) {
            const title = card.querySelector('.v-card-title').innerText.trim();
            const actions = card.querySelector('.v-card-actions');
            if (actions) {
                const btn = createButton('WUABO');
                btn.classList.add('wuabo-card-btn');
                btn.style.fontSize = '10px';
                btn.style.padding = '4px 8px';
                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    sendToBlender(title);
                };
                actions.appendChild(btn);
            }
        }
    });
}

function injectGTA5Mods() {
    const titleElem = document.querySelector('h1');
    const downloadBtn = document.querySelector('.btn-download');
    if (titleElem && downloadBtn && !document.querySelector('.wuabo-btn')) {
        const assetName = titleElem.innerText.trim();
        const btn = createButton('SEND TO WUABO');
        btn.classList.add('wuabo-btn');
        btn.style.display = 'block';
        btn.style.width = '100%';
        btn.onclick = () => sendToBlender(assetName);
        downloadBtn.parentElement.insertBefore(btn, downloadBtn.nextSibling);
    }
}

function createButton(text) {
    const btn = document.createElement('button');
    btn.innerText = text;
    btn.style.margin = '5px';
    btn.style.padding = '8px 12px';
    btn.style.backgroundColor = '#d4af37'; // Gold
    btn.style.color = 'black';
    btn.style.border = 'none';
    btn.style.borderRadius = '4px';
    btn.style.cursor = 'pointer';
    btn.style.fontWeight = 'bold';
    btn.style.transition = 'all 0.2s';
    
    btn.onmouseover = () => {
        btn.style.transform = 'scale(1.05)';
        btn.style.backgroundColor = '#f1c40f';
    };
    btn.onmouseout = () => {
        btn.style.transform = 'scale(1)';
        btn.style.backgroundColor = '#d4af37';
    };
    
    return btn;
}

// Use MutationObserver for SPAs like PlebMasters
const observer = new MutationObserver(() => {
    const url = window.location.href;
    if (url.includes('forge.plebmasters.de')) {
        injectPlebMasters();
    } else if (url.includes('gta5-mods.com')) {
        injectGTA5Mods();
    }
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial run
injectPlebMasters();
injectGTA5Mods();
