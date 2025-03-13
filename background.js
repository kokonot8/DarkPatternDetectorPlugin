// console.log("background running");

// 使用内存中的变量来跟踪所有结果
let allResults = {};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.source === "popup_request") {
        // 直接发送内存中的所有结果
        const resultsArray = Object.values(allResults);
        console.log("Sending to popup:", resultsArray);
        
        chrome.runtime.sendMessage({
            results: resultsArray,
            source: "background_script"
        });
        
        sendResponse('Background received message and sent to popup');
        return true;
    }
    
    if (message.source === "content_script") {
        // 更新内存中的结果
        allResults[message.pattern] = {
            pattern: message.pattern,
            source: message.source,
            list: message.list
        };
        
        console.log("Current all results:", allResults);
        
        // 将完整的结果保存到存储中
        chrome.storage.local.set({
            allDetectionResults: allResults
        }, () => {
            console.log("Saved all results to storage:", allResults);
        });
    }
});

// 当扩展启动时，清除之前的结果
chrome.runtime.onInstalled.addListener(() => {
    allResults = {};
    chrome.storage.local.remove('allDetectionResults', () => {
        console.log('Cleared previous detection results');
    });
});



// 