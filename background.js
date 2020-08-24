let tabWin = 0

function handleMoveTabs() {
  if (tabWin) {
    moveTabs()
  } else {
    setTabWin()
  }
}

function currentWin() {
  return new Promise(resolve => {
    chrome.windows.getCurrent({}, win => { resolve(win.id) })
  })
}

function queryTabs(arg) {
  return new Promise(resolve => {
    chrome.tabs.query(arg, tabs => { resolve(tabs) })
  })
}

async function moveTabs() {
  let src = tabWin
  tabWin = 0
  chrome.browserAction.setBadgeText({})
  if (!src) {
    return
  }
  
  let tabs = await queryTabs({highlighted: true, windowId: src})
  let ids = tabs.map(x => x.id)
  let dst = await currentWin()
  chrome.tabs.move(ids, {windowId: dst, index: -1})
}

async function setTabWin() {
  tabWin = await currentWin()
  chrome.browserAction.setBadgeText({text: "!"})
}

function init() {
  chrome.browserAction.onClicked.addListener(handleMoveTabs)
}

init()
