// Popup script for AVIM Chrome Extension
function setAVIMConfig(key, value) {
	let config = {};
	if (key === 'method') {
		config = {
			method: value,
			active: true
		};
	} else if (key === 'active') {
		config = {
			active: value
		};
	}

	// Send message to background script
	chrome.runtime.sendMessage({
		type: 'setState',
		...config
	}).then(() => {
		// Reload popup to reflect changes
		window.location.reload();
	});
}

function getI18n(message) {
	return chrome.i18n.getMessage(message);
}

function loadText() {
	const keys = ["Sel", "Auto", "Telex", "Vni", "Viqr", "ViqrStar", "Off", "Tips", "TipsCtrl", "Demo", "DemoCopy"];
	for (const key of keys) {
		$g("txt" + key).innerHTML = chrome.i18n.getMessage("extPopup" + key);
	}
}

function highlightDemo() {
	const demo = $g("inputDemo");
	demo.focus();
	demo.select();
}

function $g(id) {
	return document.getElementById(id);
}

async function init() {
	loadText();

	const offEle = $g("off");
	const autoEle = $g("auto");
	const telexEle = $g("telex");
	const vniEle = $g("vni");
	const viqrEle = $g("viqr");
	const viqrStarEle = $g("viqrStar");

	// Get current state
	const state = await chrome.runtime.sendMessage({ type: 'getState' });
	
	if (!state.active) {
		offEle.checked = true;
	} else {
		switch (state.method) {
			case 0:
				autoEle.checked = true;
				break;
			case 1:
				telexEle.checked = true;
				break;
			case 2:
				vniEle.checked = true;
				break;
			case 3:
				viqrEle.checked = true;
				break;
			case 4:
				viqrStarEle.checked = true;
				break;
		}
	}

	// Add event listeners
	offEle.addEventListener("click", () => setAVIMConfig('active', false));
	autoEle.addEventListener("click", () => setAVIMConfig('method', 0));
	telexEle.addEventListener("click", () => setAVIMConfig('method', 1));
	vniEle.addEventListener("click", () => setAVIMConfig('method', 2));
	viqrEle.addEventListener("click", () => setAVIMConfig('method', 3));
	viqrStarEle.addEventListener("click", () => setAVIMConfig('method', 4));

	$g("demoCopy").addEventListener("click", highlightDemo);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
