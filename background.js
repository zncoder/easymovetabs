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
	await chrome.windows.update(other.id, {focused: true})
	await chrome.tabs.update(tab.id, {active: true})
}

async function moveTabToNew() {
	let [tab] = await chrome.tabs.query({active: true, currentWindow: true})
	await chrome.windows.create({tabId: tab.id, focused: true})
}

async function moveFromTabWin() {
	let [tab] = await chrome.tabs.query({active: true, windowId: tabWin})
	let cur = await chrome.windows.getCurrent({})
	await chrome.tabs.move(tab.id, {windowId: cur.id, index: 0})
	await chrome.tabs.update(tab.id, {active: true})
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

async function popTab(tab) {
	await chrome.windows.create({tabId: tab.id, type: 'popup'})
}

async function attachTab(tab) {
	let wins = await chrome.windows.getAll({windowTypes: ['normal']})
	for (let w of wins) {
		if (w.id !== tab.windowId) {
			await chrome.tabs.move(tab.id, {windowId: w.id, index: 0})
			await chrome.tabs.update(tab.id, {active: true})
			await chrome.windows.update(w.id, {focused: true})
			return
		}
	}
}

function handleMenu(info, tab) {
	if (info.menuItemId === 'pop-tab') {
		popTab(tab)
	} else if (info.menuItemId === 'attach-tab') {
		attachTab(tab)
	}
}

chrome.contextMenus.create({
  id: 'pop-tab',
  title: 'Pop tab',
  contexts: ['page'],
})
chrome.contextMenus.create({
  id: 'attach-tab',
  title: 'Attach tab',
  contexts: ['page'],
})
chrome.contextMenus.onClicked.addListener(handleMenu)

init()
