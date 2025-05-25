// VNK Extension Content Script
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

// Find the nearest editable parent element
function findEditableParent(element) {
    let current = element;
    while (current && current !== document.body) {
        if (current.isContentEditable || inputTypes.includes(current.type)) {
            return current;
        }
        current = current.parentElement;
    }
    return null;
}

// Get the text content and cursor position from a contenteditable element
function getContentEditableInfo(element, range) {
    const node = range.startContainer;
    const workingElement = node.nodeType === 3 ? node.parentNode : node;
    
    return {
        element: workingElement,
        node: node,
        text: node.textContent,
        offset: range.startOffset,
        fullText: workingElement.textContent
    };
}

function initAVIM() {
	// Always remove old handlers first
	removeOldAVIM();

	// Always create AVIM object with current state
	AVIMObj = new AVIM();
	AVIMObj.method = method;
	AVIMObj.onOff = active ? 1 : 0;
	AVIMObj.ckSpell = checkSpell ? 1 : 0;
	
	// Always attach handlers - they will check active state when used
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
			const newActive = !active;
			chrome.runtime.sendMessage({ 
				type: 'setState',
				active: newActive
			}).then(() => {
				active = newActive; // Update local state after successful message
				AVIMObj.onOff = active ? 1 : 0; // Update AVIM object state directly
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

	// Find the actual editable element (might be a parent of the target)
	const editableElement = findEditableParent(target);
	if (!editableElement || findIgnore(editableElement) || editableElement.readOnly) {
		return;
	}

	// Set current key
	AVIMObj.sk = String.fromCharCode(e.which);
	
	// Handle different types of editable elements
	if (editableElement.isContentEditable) {
		const selection = window.getSelection();
		const range = selection.getRangeAt(0);
		
		// Get info about the current editable context
		const editableInfo = getContentEditableInfo(editableElement, range);
		
		// Create a proxy object that mimics the interface AVIM expects
		const processObj = {
			value: editableInfo.text,
			selectionStart: editableInfo.offset,
			selectionEnd: editableInfo.offset,
			setSelectionRange: function(start, end) {
				this.selectionStart = start;
				this.selectionEnd = end;
			}
		};
		
		// Process the keystroke
		start(processObj, e);
		
		if (AVIMObj.changed) {
			e.preventDefault();
			AVIMObj.changed = false;
			
			// Update the text node
			if (editableInfo.node.nodeType === 3) {
				editableInfo.node.textContent = processObj.value;
				
				// Restore cursor position
				range.setStart(editableInfo.node, processObj.selectionStart);
				range.setEnd(editableInfo.node, processObj.selectionEnd);
				selection.removeAllRanges();
				selection.addRange(range);
			}
		}
	} else {
		// For normal input elements, just pass through to AVIM
		start(editableElement, e);
		
		if (AVIMObj.changed) {
			e.preventDefault();
			AVIMObj.changed = false;
		}
	}
}

// Initialize on load
initState();

