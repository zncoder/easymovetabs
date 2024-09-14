let tabWin = 0

async function handleMoveTabs() {
	if (tabWin !== 0) {
		try {
			await browser.windows.get(tabWin)
		} catch (e) {
			tabWin = 0
		}
	}

	if (tabWin === 0) {
		await moveOrSetTabWin()
	} else {
		await moveFromTabWin()
		tabWin = 0
		await browser.browserAction.setBadgeText({text: ""})
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
	let cur = await browser.windows.getCurrent({})
	let other = cur.id === wins[0].id ? wins[1] : wins[0]
	let [tab] = await browser.tabs.query({active: true, currentWindow: true})
	await browser.tabs.move(tab.id, {windowId: other.id, index: 0})
}

async function moveTabToNew() {
	let [tab] = await browser.tabs.query({active: true, currentWindow: true})
	await browser.windows.create({tabId: tab.id})
}

async function moveFromTabWin() {
	let [tab] = await browser.tabs.query({active: true, windowId: tabWin})
	let cur = await browser.windows.getCurrent({})
	await browser.tabs.move(tab.id, {windowId: cur.id, index: 0})
}

async function visibleWindows() {
	let wins = await browser.windows.getAll({windowTypes: ["normal"]})
	return wins.filter(w => w.state !== 'minimized')
}

async function setTabWin() {
	let cur = await browser.windows.getCurrent({})
	tabWin = cur.id
	await browser.browserAction.setBadgeText({text: "!"})
}

function init() {
	browser.browserAction.onClicked.addListener(handleMoveTabs)
}

init()
