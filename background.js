let tabWin = 0

async function handleMoveTabs() {
  let moved = await moveTabs()
  if (!moved) {
    setTabWin()
  }
}

async function visibleWindows() {
  return new Promise(resolve => {
    chrome.windows.getAll({windowTypes: ["normal"]}, wins => {
      resolve(wins.filter(w => w.state !== "minimized"))
    })
  })
}

async function newWindow(tid) {
  return new Promise(resolve => {
    chrome.windows.create({tabId: tid}, win => { resolve(win.id) })
  })
}

function currentWin() {
  return new Promise(resolve => {
    chrome.windows.getCurrent({}, win => { resolve(win.id) })
  })
}

function activeTab(wid) {
  let arg = {active: true}
  if (wid) {
    arg.windowId = wid
  } else {
    arg.currentWindow = true
  }
  return new Promise(resolve => chrome.tabs.query(arg, tabs => { resolve(tabs[0]) }))
}

function queryTabs(arg) {
  return new Promise(resolve => {
    chrome.tabs.query(arg, tabs => { resolve(tabs) })
  })
}

async function moveTabs() {
  let wins = await visibleWindows()
  if (tabWin === 0 && wins.length > 2) {
    return false
  }
  
  let src = tabWin
  tabWin = 0
  chrome.browserAction.setBadgeText({})
  let cur = await currentWin()
  if (src === 0) {
    src = cur
  }
  
  let dst = 0
  if (src === cur) {
    if (wins.length < 2) {
      dst = 0
    } else if (wins.length === 2) {
      dst = src === wins[0].id ? wins[1].id : wins[0].id
    } else {
      dst = 0
    }
  } else {
     dst = cur 
  }

  let tabs = await queryTabs({highlighted: true, windowId: src})
  let active = await activeTab(src)
  let tids = tabs.map(x => x.id)
  if (dst === 0) {
    dst = await newWindow(tids[0])
    tids.shift()
  }
  if (tids.length > 0) {
    chrome.tabs.move(tids, {windowId: dst, index: -1})
  }
  chrome.tabs.update(active.id, {active: true})
  chrome.windows.update(dst, {focused: true})
  return true
}

async function setTabWin() {
  tabWin = await currentWin()
  chrome.browserAction.setBadgeText({text: "!"})
}

function init() {
  chrome.browserAction.onClicked.addListener(handleMoveTabs)
}

init()
