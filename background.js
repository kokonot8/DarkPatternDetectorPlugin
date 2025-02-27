
// console.log("background running");
// lists = [];

// function ReceiveCheckBoxes(){

//     // 监听来自 content script 的消息
//     chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//         console.log("Background received message:", request);
//         lists = request.lists;
//         forwardToPopup(lists)
//         sendResponse('Background received message');
//         return true;
//     });

//     return lists;
// }

// ReceiveCheckBoxes();
// async function forwardToPopup(message) {
//     const response = await chrome.runtime.sendMessage({ lists: lists }, () => {
//         console.log("Background sent:", lists);
//     });
// }


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.source === "content_script") {
        chrome.runtime.sendMessage({...message, source: "background_script"});
        sendResponse('Background reveived message and sent to popup');
        return true;
    }
})



// function checkWithAPI() {

// }