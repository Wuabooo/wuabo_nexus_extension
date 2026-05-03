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

// --- Queue & Scraper System ---
let isQueueRunning = false;
let overlayDiv = null;

function createOverlay() {
    if (overlayDiv) return overlayDiv;
    overlayDiv = document.createElement('div');
    overlayDiv.style.position = 'fixed';
    overlayDiv.style.top = '20px';
    overlayDiv.style.left = '50%';
    overlayDiv.style.transform = 'translateX(-50%)';
    overlayDiv.style.padding = '20px 30px';
    overlayDiv.style.backgroundColor = '#1e1e1e';
    overlayDiv.style.color = '#d4af37';
    overlayDiv.style.border = '2px solid #d4af37';
    overlayDiv.style.borderRadius = '10px';
    overlayDiv.style.boxShadow = '0 10px 25px rgba(0,0,0,0.8)';
    overlayDiv.style.zIndex = '100000';
    overlayDiv.style.fontFamily = 'sans-serif';
    overlayDiv.style.fontWeight = 'bold';
    overlayDiv.style.fontSize = '16px';
    overlayDiv.style.textAlign = 'center';
    overlayDiv.style.display = 'none';
    document.body.appendChild(overlayDiv);
    return overlayDiv;
}

function updateOverlay(text) {
    const overlay = createOverlay();
    overlay.innerText = text;
    overlay.style.display = 'block';
}

function hideOverlay() {
    if (overlayDiv) overlayDiv.style.display = 'none';
}

function sendToBlenderAsync(assetName) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'import_asset', assetName: assetName }, (response) => {
            resolve(response);
        });
    });
}

async function processQueue(assetNames) {
    if (isQueueRunning) {
        showNotification("Queue is already running!", true);
        return;
    }

    if (assetNames.length === 0) {
        showNotification("No assets found to import.", true);
        return;
    }

    isQueueRunning = true;
    const total = assetNames.length;

    // 1. Reset server counters and cache for this batch
    try {
        await new Promise(resolve => {
            chrome.runtime.sendMessage({ action: 'reset_queue' }, resolve);
        });
    } catch (e) {
        console.warn('[WUABO] Could not reset server counters:', e);
    }

    updateOverlay(`[WUABO NEXUS]\n\nSending ${total} assets to Blender...`);

    // 2. Fire ALL requests rapidly (50ms stagger every 20 requests)
    let sendErrors = 0;
    for (let i = 0; i < total; i++) {
        const name = assetNames[i];
        try {
            const response = await sendToBlenderAsync(name);
            if (!response || response.status !== 'success') sendErrors++;
        } catch (e) {
            sendErrors++;
        }
        // Tiny stagger - just enough to not overload the HTTP server
        if (i % 20 === 19) await new Promise(r => setTimeout(r, 50));
    }

    updateOverlay(`[WUABO NEXUS]\n\nAll ${total} assets queued!\nDownloading & importing...`);
    console.log(`[WUABO Queue] All ${total} assets sent (${sendErrors} send errors)`);

    // 3. Poll /status every 2 seconds for real-time progress
    const getStatus = () => {
        return new Promise(resolve => {
            chrome.runtime.sendMessage({ action: 'get_status' }, (response) => {
                resolve(response && response.status === 'success' ? response.data : null);
            });
        });
    };

    const pollStatus = () => {
        return new Promise((resolve) => {
            const interval = setInterval(async () => {
                try {
                    const data = await getStatus();
                    if (!data) return;

                    const dl = data.total_downloaded || 0;
                    const imp = data.total_imported || 0;
                    const skipped = data.total_skipped || 0;
                    const current = data.current_asset || '...';
                    const dlPending = data.download_pending || 0;
                    const impPending = data.import_pending || 0;

                    let overlayText = `[WUABO NEXUS QUEUE]\n\n` +
                        `📥 Downloaded: ${dl}/${total}\n` +
                        `🔧 Imported: ${imp}/${total}\n`;
                    
                    if (skipped > 0) {
                        overlayText += `⏭️ Skipped (existing): ${skipped}\n`;
                    }
                    
                    overlayText += `⏳ Pending: ${dlPending} downloads, ${impPending} imports\n\n` +
                        `Current: ${current}`;

                    updateOverlay(overlayText);

                    // Done when all are imported/skipped and queues are empty
                    if (data.is_done || ((imp + skipped) >= total && dlPending === 0 && impPending === 0)) {
                        clearInterval(interval);
                        resolve(data);
                    }
                } catch (e) {
                    // Server might be busy, just wait
                }
            }, 2000);
        });
    };

    const finalStatus = await pollStatus();

    isQueueRunning = false;
    const imported = finalStatus ? finalStatus.total_imported : '?';
    const skipped = finalStatus ? (finalStatus.total_skipped || 0) : 0;
    let doneText = `Queue Finished!\n\n✅ Imported: ${imported}/${total}`;
    if (skipped > 0) doneText += `\n⏭️ Skipped: ${skipped} (already in file)`;
    updateOverlay(doneText);
    setTimeout(hideOverlay, 8000);
}

async function scrapeCategoryPages() {
    if (isQueueRunning) return;

    const allNames = new Set();
    let pageCount = 1;

    updateOverlay("Starting category scrape...");

    while (true) {
        updateOverlay(`Scraping Page ${pageCount}...\nFound so far: ${allNames.size}`);

        // Wait for cards to be present
        await new Promise(r => setTimeout(r, 2000));

        // Grab current visible card names
        const beforeSize = allNames.size;
        const cards = document.querySelectorAll('.v-card-title');
        cards.forEach(card => {
            const name = card.innerText.trim();
            if (name) allNames.add(name);
        });

        console.log(`[WUABO Scraper] Page ${pageCount}: found ${cards.length} cards, total unique: ${allNames.size}`);

        // Find the "Next" pagination button by scanning ALL buttons on the page
        let nextBtn = null;
        const allButtons = document.querySelectorAll('button, a.v-pagination__next, li.v-pagination__next button');

        for (const btn of allButtons) {
            const text = btn.textContent.trim().toLowerCase();
            const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
            const classList = btn.className.toLowerCase();

            // Match by text content, aria-label, or CSS class
            if (text === 'next' || text === '›' || text === '»' || text === '>' ||
                ariaLabel.includes('next') ||
                classList.includes('pagination__next') ||
                classList.includes('v-pagination__next')) {

                // Check if it's actually disabled
                const isDisabled = btn.disabled ||
                    btn.classList.contains('v-btn--disabled') ||
                    btn.classList.contains('disabled') ||
                    btn.getAttribute('aria-disabled') === 'true' ||
                    btn.closest('[disabled]') !== null;

                if (!isDisabled) {
                    nextBtn = btn;
                }
                break;
            }
        }

        if (nextBtn) {
            console.log(`[WUABO Scraper] Clicking Next button...`);
            nextBtn.click();
            pageCount++;
            // Wait 3 seconds for the SPA to load new content
            await new Promise(r => setTimeout(r, 3000));
        } else {
            console.log(`[WUABO Scraper] No Next button found or it's disabled. Scraping done.`);
            break;
        }
    }

    const finalArray = Array.from(allNames).filter(n => n);
    updateOverlay(`Scraping Complete!\nFound ${finalArray.length} assets across ${pageCount} pages.`);
    await new Promise(r => setTimeout(r, 2000));

    processQueue(finalArray);
}

// --- Site Specific Logic ---

function injectPlebMasters() {
    const url = window.location.href;

    // 1. Inject Global Category Button
    if (url.includes('category=') && !document.querySelector('.wuabo-global-btn')) {
        const btn = createButton('🚀 IMPORT WHOLE CATEGORY TO BLENDER 🚀');
        btn.classList.add('wuabo-global-btn');
        btn.style.width = '100%';
        btn.style.marginBottom = '20px';
        btn.style.fontSize = '18px';
        btn.style.padding = '15px';
        btn.onclick = (e) => {
            e.preventDefault();
            scrapeCategoryPages();
        };

        // Insert before the main grid
        const grid = document.querySelector('.v-row');
        if (grid && grid.parentNode) {
            grid.parentNode.insertBefore(btn, grid);
        }
    }

    // 2. Individual Detail Modals
    const nameInput = document.querySelector('input[id^="detail-input-Name-"]');
    if (nameInput && !nameInput.parentElement.querySelector('.wuabo-btn')) {
        const assetName = nameInput.value.trim();
        if (assetName) {
            const btn = createButton('SEND TO WUABO');
            btn.classList.add('wuabo-btn');
            btn.style.marginLeft = '10px';
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                sendToBlender(assetName);
            };
            const container = nameInput.closest('.v-field__append-inner') || nameInput.parentElement;
            container.appendChild(btn);
        }
    }

    // 3. Individual Cards
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
        btn.style.transform = 'scale(1.02)';
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
    }
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial run
injectPlebMasters();