let tabWin = 0

async function handleMoveTabs() {
	if (tabWin !== 0) {
		try {
			await chrome.windows.get(tabWin)
		} catch (e) {
			tabWin = 0
		}
	}

	if (tabWin === 0) {
		await moveOrSetTabWin()
	} else {
		await moveFromTabWin()
		tabWin = 0
		await chrome.action.setBadgeText({text: ""})
	}
}

async function moveOrSetTabWin() {
	let wins = await visibleWindows()
	if (wins.length > 2) {
		await setTabWin()
	} else if (wins.length === 2) {
		await moveTabToAnother(wins)
	} else {
		await moveTabToNew()
	}
}

async function moveTabToAnother(wins) {
	let cur = await chrome.windows.getCurrent({})
	let other = cur.id === wins[0].id ? wins[1] : wins[0]
	let [tab] = await chrome.tabs.query({active: true, currentWindow: true})
	await chrome.tabs.move(tab.id, {windowId: other.id, index: 0})
}

async function moveTabToNew() {
	let [tab] = await chrome.tabs.query({active: true, currentWindow: true})
	await chrome.windows.create({tabId: tab.id})
}

async function moveFromTabWin() {
	let [tab] = await chrome.tabs.query({active: true, windowId: tabWin})
	let cur = await chrome.windows.getCurrent({})
	await chrome.tabs.move(tab.id, {windowId: cur.id, index: 0})
}

async function visibleWindows() {
	let wins = await chrome.windows.getAll({windowTypes: ["normal"]})
	return wins.filter(w => w.state !== 'minimized')
}

async function setTabWin() {
	let cur = await chrome.windows.getCurrent({})
	tabWin = cur.id
	await chrome.action.setBadgeText({text: "!"})
}

function init() {
	chrome.action.onClicked.addListener(handleMoveTabs)
}

init()
