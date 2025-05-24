// Service Worker for AVIM Chrome Extension
let active = true;
let method = 0;
let checkSpell = true;

// Initialize state as soon as the service worker starts
async function initializeState() {
    try {
        console.log('Initializing state');
        const result = await chrome.storage.local.get(['active', 'method', 'checkSpell']);
        active = result.active ?? true;
        method = result.method ?? 0;
        checkSpell = result.checkSpell ?? true;
        await updateIcon();
    } catch (e) {
        console.warn('Error initializing state:', e);
    }
}

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'getState') {
        // Immediately respond with current state
        sendResponse({
            active: active,
            method: method,
            checkSpell: checkSpell
        });
        return true; // Keep the message channel open for the async response
    } else if (request.type === 'setState') {
        handleStateChange(request, sendResponse);
        return true; // Keep the message channel open for the async response
    }
});

// Handle state changes
async function handleStateChange(request, sendResponse) {
    try {
        console.log('Handling state change:', request);
        // Update state
        if (request.active !== undefined) active = request.active;
        if (request.method !== undefined) method = request.method;
        if (request.checkSpell !== undefined) checkSpell = request.checkSpell;
        
        // Save to storage
        await chrome.storage.local.set({
            active: active,
            method: method,
            checkSpell: checkSpell
        });

        // Update icon
        await updateIcon();
        
        // Notify all tabs
        const tabs = await chrome.tabs.query({});
        await Promise.all(tabs.map(async (tab) => {
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    type: 'stateChanged',
                    active: active,
                    method: method,
                    checkSpell: checkSpell
                });
            } catch (e) {
                // Ignore errors for tabs that don't have the content script
                console.debug('Could not send message to tab:', tab.id);
            }
        }));

        // Send success response
        sendResponse({ success: true });
    } catch (e) {
        console.error('Error handling state change:', e);
        sendResponse({ success: false, error: e.message });
    }
}

// Update extension icon based on state
async function updateIcon() {
    try {
        console.log('Updating icon to:', active ? 'active' : 'disabled');
        await chrome.action.setIcon({
            path: {
                "16": active ? "icons/icon16.png" : "icons/icon16_disabled.png",
                "19": active ? "icons/icon19.png" : "icons/icon19_disabled.png",
                "48": active ? "icons/icon48.png" : "icons/icon48_disabled.png",
                "128": active ? "icons/icon128.png" : "icons/icon128_disabled.png"
            }
        });
    } catch (e) {
        console.warn('Could not update icon:', e);
    }
}

// Initialize state when service worker starts
initializeState();
