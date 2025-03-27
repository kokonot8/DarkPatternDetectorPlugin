// console.log("background running");

// 使用 Map 来存储每个 tab 的结果
let tabResults = new Map();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.source === "popup_request") {
        // 获取当前活动标签页的结果
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs.length > 0) {
                const currentTabId = tabs[0].id;
                const results = tabResults.get(currentTabId) || [];
                sendResponse({results: results});
            } else {
                sendResponse({results: []});
            }
        });
        return true; // 保持消息端口开启
    }
    
    if (message.source === "content_script") {
        // 存储特定标签页的结果
        if (sender.tab && sender.tab.id) {
            const tabId = sender.tab.id;
            if (!tabResults.has(tabId)) {
                tabResults.set(tabId, {});
            }
            const currentResults = tabResults.get(tabId);
            currentResults[message.pattern] = {
                pattern: message.pattern,
                source: message.source,
                list: message.list
            };
            tabResults.set(tabId, currentResults);
        }
        sendResponse({status: 'success'});
        return true; // 保持消息端口开启
    }
});

// 当标签页关闭时清除其结果
chrome.tabs.onRemoved.addListener((tabId) => {
    tabResults.delete(tabId);
});

// 当扩展启动时初始化存储
chrome.runtime.onInstalled.addListener(() => {
    tabResults = new Map();
});



// 