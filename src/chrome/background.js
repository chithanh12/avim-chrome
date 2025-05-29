// Service Worker for AVIM Chrome Extension
let state = {
    active: true,
    method: 0,
    checkSpell: true
};

// Initialize state as soon as the service worker starts
async function initializeState() {
    try {
        const result = await chrome.storage.local.get(['avimState']);
        if (result.avimState) {
            state = result.avimState;
        }
        await updateIcon();
    } catch (e) {
        // Silent fail
    }
}

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'getState') {
        sendResponse(state);
        return true;
    } else if (request.type === 'setState') {
        handleStateChange(request, sendResponse);
        return true;
    }
});

// Handle state changes
async function handleStateChange(request, sendResponse) {
    try {
        // Update state
        const newState = { ...state };
        if (request.active !== undefined) newState.active = request.active;
        if (request.method !== undefined) newState.method = request.method;
        if (request.checkSpell !== undefined) newState.checkSpell = request.checkSpell;

        // Save to storage - this will trigger storage.onChanged in all tabs
        await chrome.storage.local.set({ avimState: newState });
        state = newState;

        // Update icon
        await updateIcon();

        sendResponse(state);
    } catch (e) {
        sendResponse({ error: e.message });
    }
}

// Update extension icon based on state
async function updateIcon() {
    try {
        const iconPath = state.active ? {
            "16": "/icons/icon16.png",
            "19": "/icons/icon19.png",
            "48": "/icons/icon48.png",
            "128": "/icons/icon128.png"
        } : {
            "16": "/icons/icon16_disabled.png",
            "19": "/icons/icon19_disabled.png",
            "48": "/icons/icon48_disabled.png",
            "128": "/icons/icon128_disabled.png"
        };
        await chrome.action.setIcon({ path: iconPath });
    } catch (e) {
        // Silent fail
    }
}

// Listen for storage changes to keep background state in sync
chrome.storage.onChanged.addListener((changes) => {
    if (changes.avimState) {
        state = changes.avimState.newValue;
        updateIcon();
    }
});

// Initialize state when service worker starts
initializeState();
