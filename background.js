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

    // curl https://api.anthropic.com/v1/messages -H "x-api-key: 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" -H "anthropic-version: 2023-06-01" -H "content-type: application/json" -d "{\"model\": \"claude-opus-4-20250514\",\"max_tokens\": 10,\"messages\": [{\"role\": \"user\", \"content\": \"Hello\"}]}"

    // 🤖 3. content script 请求 Claude API 检测文字
    if (message.type === "callClaude") {
        console.log("收到检测请求：", message.prompt);
        const prompt = message.prompt;

        fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": "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", // ✅ 替换为你的 API Key
                "anthropic-version": "2023-06-01",
                "anthropic-dangerous-direct-browser-access": "true" // 解决 CORS 的 header
            },
            body: JSON.stringify({
                model: "claude-opus-4-20250514",
                max_tokens: 5,
                temperature: 0,
                messages: [
                    { role: "user", content: prompt }
                ]
            })
        })
        .then(res => res.json())
        .then(data => {
            console.log("Claude API 返回：", data);
            sendResponse({ success: true, result: data });
        })
        .catch(error => {
            console.error("❌ Claude 调用失败:", error);
            sendResponse({ success: false, error: error.message });
        });

        return true; // ✅ 异步响应
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