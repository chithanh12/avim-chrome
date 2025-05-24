// AVIM Extension Content Script
let method = 0;
let active = true;
let checkSpell = true;

const inputTypes = ["textarea", "text", "search", "tel"];

// Initialize state from background script
function initState() {
	chrome.runtime.sendMessage({ type: 'getState' })
		.then((state) => {
			method = state.method;
			active = state.active;
			checkSpell = state.checkSpell;
			initAVIM();
		})
		.catch((error) => {
			console.warn('Could not get initial state, using defaults:', error);
			initAVIM();
		});
}

// Listen for state changes from popup/background
chrome.runtime.onMessage.addListener((message) => {
	if (message.type === 'stateChanged') {
		method = message.method;
		active = message.active;
		checkSpell = message.checkSpell;
		initAVIM();
	}
});

function findIgnore(el) {
	const va = exclude || ["email"];
	for(let i = 0; i < va.length; i++) {
		if((va[i].length > 0) && (el.name == va[i] || el.id == va[i])) {
			return true;
		}
	}
	return false;
}

function initAVIM() {
	if (typeof AVIMObj != "undefined" && AVIMObj) {
		removeOldAVIM();
	}
	
	if (!active) return;

	AVIMObj = new AVIM();
	AVIMObj.method = method;
	AVIMObj.onOff = active ? 1 : 0;
	AVIMObj.ckSpell = checkSpell ? 1 : 0;
	
	// Initialize AVIM for main document
	attachInputHandlers(document);
	
	// Initialize AVIM for all iframes
	const frames = document.getElementsByTagName("iframe");
	for (let i = 0; i < frames.length; i++) {
		try {
			if (!findIgnore(frames[i])) {
				const frameDoc = frames[i].contentDocument;
				if (frameDoc) {
					attachInputHandlers(frameDoc);
				}
			}
		} catch (e) {
			console.warn('Could not attach to iframe:', e);
		}
	}
}

function attachInputHandlers(doc) {
	doc.addEventListener('keypress', handleKeyPress, true);
	doc.addEventListener('keyup', handleKeyUp, true);
}

function removeOldAVIM() {
	document.removeEventListener('keypress', handleKeyPress, true);
	document.removeEventListener('keyup', handleKeyUp, true);
	
	const frames = document.getElementsByTagName("iframe");
	for (let i = 0; i < frames.length; i++) {
		try {
			const frameDoc = frames[i].contentDocument;
			if (frameDoc) {
				frameDoc.removeEventListener('keypress', handleKeyPress, true);
				frameDoc.removeEventListener('keyup', handleKeyUp, true);
			}
		} catch (e) {}
	}
}

let isPressCtrl = false;
let lastCtrlPress = 0;

function handleKeyUp(e) {
	if (e.key === 'Control') {
		const now = Date.now();
		if (isPressCtrl && (now - lastCtrlPress) < 300) {
			// Double Ctrl press detected
			chrome.runtime.sendMessage({ 
				type: 'setState',
				active: !active
			}).catch(console.warn);
			isPressCtrl = false;
		} else {
			isPressCtrl = true;
			lastCtrlPress = now;
			setTimeout(() => { isPressCtrl = false; }, 300);
		}
	} else {
		isPressCtrl = false;
	}
}

function handleKeyPress(e) {
	if (!active) return;
	
	const target = e.target;
	if (e.ctrlKey || (e.altKey && e.which !== 92 && e.which !== 126)) {
		return;
	}

	if (target.isContentEditable || inputTypes.includes(target.type)) {
		if (!findIgnore(target) && !target.readOnly) {
			// Set current key
			AVIMObj.sk = String.fromCharCode(e.which);
			
			// Save current position and text
			if (target.isContentEditable) {
				const selection = window.getSelection();
				const range = selection.getRangeAt(0);
				target.value = target.textContent;
				target.pos = range.endOffset;
			} else {
				target.pos = target.selectionStart;
			}
			
			// Process the keystroke
			start(target, e);
			
			if (AVIMObj.changed) {
				e.preventDefault();
				AVIMObj.changed = false;
				
				// Update the text and cursor position
				if (target.isContentEditable) {
					const selection = window.getSelection();
					const range = selection.getRangeAt(0);
					const node = range.startContainer;
					
					if (node.nodeType === 3) { // Text node
						node.textContent = target.value;
						range.setStart(node, target.pos);
						range.setEnd(node, target.pos);
						selection.removeAllRanges();
						selection.addRange(range);
					}
				} else {
					const oldStart = target.selectionStart;
					const oldEnd = target.selectionEnd;
					target.value = target.value;
					target.setSelectionRange(oldStart, oldEnd);
				}
			}
		}
	}
}

// Initialize on load
initState();

