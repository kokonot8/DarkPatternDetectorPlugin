// let logs = [];

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     // forward the message to popup
//     chrome.runtime.sendMessage(request, (response) => {
//         if (chrome.runtime.lastError){
//             console.log("Error:", chrome.runtime.lastError.message);
//         }
//     });
//     sendResponse("Message received by background");
//     return true;
// });

console.log("background running");
lists = [];

function ReceiveCheckBoxes(){

    // 监听来自 content script 的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log("Background received message:", request);
        lists = request.lists;
        forwardToPopup(lists)
        sendResponse('Background received message');
        return true;
    });

    return lists;
}

ReceiveCheckBoxes();
async function forwardToPopup(message) {
    const response = await chrome.runtime.sendMessage({ lists: lists }, () => {
        console.log("Background sent:", lists);
    });
}