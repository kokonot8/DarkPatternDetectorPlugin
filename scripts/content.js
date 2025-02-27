
// message的统一格式 {'pattern': 'pre-selected checkbox'/ 'bait and switch', detail:'', element:'}

// detect pre-select checkbox
// Step1: find selected checkbox;
// Step2: find revelent text of checkbox;

function detectPreselectedCheckbox() {

    const boxList = []

    const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
    console.log('found checkboxes:',checkboxes.length);

    checkboxes.forEach(box => {
        let text = '';

        let label = document.querySelector(`label[for="${box.id}"]`);
        if (label) {
            text = label.innerText;
        } else if (box.nextElementSibling) {
            text = box.nextElementSibling.innerText || box.nextElementSibling.textContent;
        } else {
            text = box.parentElement.innerText;
        }
        // console.log(text);
        const darkPatternKeywords = ['subscription','subcribe','email','premium', 'extra', 'privacy', 'share', 'promotion', 'advertisement', 'marketing', 'agree to receive'];
        if (darkPatternKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
            console.log('found potential dark pattern:', text);
            message = {
                'pattern': 'pre-selected checkbox',
                'detail': 'including key word' + keyword,
                'element': box
            };
            
            boxList.push(message);

            box.style.outline = '2px solid red';
        }

    });

    // send message to background
    (async ()=> {
        const response = await chrome.runtime.sendMessage({ source: "content_script", pattern: 'pre-selected checkbox', list: boxList }, () => {
            console.log("massage sent:", boxList);
        });
    })();

}

function checkOnClickForRedirect(onClickContent) {
    const originDomain = window.location.hostname;
    let isBaitSwitch = false;

    //只考虑onClickContent是直接链接跳转、或者调用window.open的情况
    //注意有可能是多个语句组合

    //直接将window.open视为bait and switch，因为下载按钮应该触发下载而不是打开新窗口
    if (onClickContent.includes('window.open')) {
        isBaitSwitch = true;
        return isBaitSwitch;
    }
    
    //寻找直接链接- http://或https://
    const urlMatch = onClickContent.match(/(https?:\/\/[^\s'"]+)/);
    if (urlMatch && urlMatch[1]) {
        const url = new URL(urlMatch[1]);
        targetDomain = url.hostname;
        console.log('targetDomain:', targetDomain);
    }

    return (originDomain != targetDomain);
}


function detectBaitSwitch() {
    // download button redirect to another domain
    // ad close button redirect to another page
    detectedList = []

    // 1. 先检查页面上已有的下载按钮
    const possibleDownloadButtons = Array.from(document.querySelectorAll('button'))
        .filter(el => {
            // 检查文本内容、ID、类名等是否包含download关键词
            return (el.innerText && el.innerText.toLowerCase().includes('download')) ||
                  (el.id && el.id.toLowerCase().includes('download')) ||
                  (el.className && typeof el.className === 'string' && el.className.toLowerCase().includes('download')) ||
                  // 查找按钮内部的SVG图标
                  (el.querySelector && el.querySelector('svg[id*="download"], svg[class*="download"]'));
        });

    console.log('Found possible download buttons:', possibleDownloadButtons.length);

    // 检查每个可能的下载按钮
    possibleDownloadButtons.forEach(button => {
        let onClickContent;
        
        // 检查按钮自身是否有onclick属性
        if (button.hasAttribute('onclick')) {
            onClickContent = button.getAttribute('onclick');           
        }
        // 如果是a标签，检查href属性
        else if (button.tagName === 'A' && button.hasAttribute('href')) {
            onClickContent = button.getAttribute('href');
        }
        // 向上查找父元素的onclick或href
        else {
            let parent = button.parentElement;
            while (parent && parent !== document.body) {
                if (parent.hasAttribute('onclick')) {
                    onClickContent = parent.getAttribute('onclick');
                    break;
                }
                if (parent.tagName === 'A' && parent.hasAttribute('href')) {
                    onClickContent = parent.getAttribute('href');
                    break;
                }
                parent = parent.parentElement;
            }
        }
            //检测是否重定向到其他域，若有，
            // 1）加入列表，后续一起发送给background 
            // 2）在网页上用红框标记问题按钮  
        if (checkOnClickForRedirect(onClickContent)) {
            const message = {
                'pattern':'bait and swtich',
                'detail':'download button redirect to another domain',
                element: button
            };
            detectedList.push(message);
            button.style.outline = '2px solid red'
        }
    });
    console.log('detectedList:', detectedList);
    //To do : send to background

    // send message to background
    (async ()=> {
        const response = await chrome.runtime.sendMessage({ source: "content_script", pattern: 'bait and switch', list: detectedList }, () => {
            console.log("massage sent:", detectedList);
        });
    })();

}
    



//To be: 换成自己写的
// 使用 Google Gemini API 检测 Confirmshaming 暗模式

// 检测函数
async function detectConfirmshaming() {
    // 收集页面上的相关元素
    const elementsToCheck = [];
    
    // 1. 检查退订、取消、关闭的相关按钮/链接
    const cancelButtons = document.querySelectorAll('a, button');
    cancelButtons.forEach(element => {
    const text = element.innerText || element.textContent;
    console.log('text:',text);
    if (text) {
        // 关注与取消、拒绝、关闭等相关的文本
        const cancelKeywords = ['no thanks', 'cancel', 'close', 'maybe later', 'not now','no', 'unsubscribe'];
        if (cancelKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
        elementsToCheck.push({
            element: element,
            text: text.trim(),
            type: 'cancel button'
        });
        }
    }
    });
    
    // 2. 检查弹窗和提示框
    const possibleModals = document.querySelectorAll('.modal, [class*="modal"], [class*="popup"], [class*="dialog"], [id*="modal"], [id*="popup"], [id*="dialog"]');
    possibleModals.forEach(modal => {
    const dismissButtons = modal.querySelectorAll('a, button');
    dismissButtons.forEach(button => {
        const text = button.innerText || button.textContent;
        console.log('text:',text);
        if (text) {
        elementsToCheck.push({
            element: button,
            text: text.trim(),
            type: 'modal dismiss button',
            context: modal.innerText || modal.textContent
        });
        }
    });
    });

    console.log('elementsToCheck:', elementsToCheck);
    
    // 处理收集到的元素
    const confirmshamingResults = [];
    
    for (const item of elementsToCheck) {
    // 使用 Google Gemini API 来分析文本
    const isConfirmshaming = await checkTextWithGemini(item.text, item.context || '');
    
    if (isConfirmshaming) {
        // 标记问题元素
        item.element.style.outline = '2px solid red';
        
        // 将结果加入列表
        confirmshamingResults.push({
        'pattern': 'confirmshaming',
        'detail': `用户拒绝时使用羞辱性语言: "${item.text}"`,
        'element': item.element
        });
    }
    }
    
    // 发送结果到背景脚本
    if (confirmshamingResults.length > 0) {
    (async () => {
        try {
        const response = await chrome.runtime.sendMessage({
            source: "content_script",
            pattern: 'confirmshaming',
            list: confirmshamingResults
        });
        console.log("Confirmshaming results sent:", confirmshamingResults);
        } catch (error) {
        console.error("Error sending confirmshaming results:", error);
        }
    })();
    }
}

// 调用 Gemini API 来分析文本是否为 Confirmshaming
async function checkTextWithGemini(text, context = '') {
    try {
    // 构建 API 请求参数
    const apiKey = 'AIzaSyDKjUbXwdO1iTh5WjBYe-hsCQHTQUCuNf0'; // 替换为你的 API 密钥
    const apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    
    
    // 构造完整的 prompt
    let prompt = `请判断以下文本是否属于"确认羞辱"(Confirmshaming)这种暗模式。
确认羞辱是指网站或应用通过使用具有羞辱性、内疚感或负面情绪的语言来劝阻用户退出、取消或拒绝某些操作。

示例确认羞辱文本:
- "不，我不想省钱"
- "不，我不关心我的网络安全"
- "我喜欢错过特别优惠"
- "不用了，我不需要更好的服务"

请分析以下文本，如果是确认羞辱模式返回 true，否则返回 false。
只需返回 true 或 false，不要有其他任何额外文字:

文本: "${text}"`;

    if (context) {
        prompt += `\n上下文信息: "${context}"`;
    }
    
    // 发送请求到 Gemini API
    const response = await fetch(`${apiEndpoint}?key=${apiKey}`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({
        contents: [{
            parts: [{
            text: prompt
            }]
        }],
        generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 10
        }
        })
    });
    
    const data = await response.json();

    console.log('Gemini API response:', data);
    
    // 解析响应
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const result = data.candidates[0].content.parts[0].text.trim().toLowerCase();
        return result.includes('true');
    }
    
    return false;
    } catch (error) {
    console.error('Error calling Gemini API:', error);
    return false;
    }
}

// function checkTextwithTransformersJS() {
    
// }



detectPreselectedCheckbox();
detectBaitSwitch();
detectConfirmshaming();


