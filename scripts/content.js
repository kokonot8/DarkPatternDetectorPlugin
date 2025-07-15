let visualPreselectionSent = false; // 控制视觉预选是否已触发
let visualObserverStarted = false;  // 防止重复启动 MutationObserver

// 在开始新的检测前清除之前的结果
chrome.storage.local.remove('allDetectionResults', async () => {
    console.log('Cleared previous detection results');
    
    // 按顺序执行检测
    await detectPreselectedCheckbox();
    detectVisualPreselection();         // 视觉检测：第一次 + 后续懒加载
    await detectBaitSwitch();
    await detectConfirmshaming();
});

// message的统一格式 {'pattern': 'pre-selected checkbox'/ 'bait and switch', detail:'', element:'}

// detect pre-select checkbox
// Step1: find selected checkbox;
// Step2: find revelent text of checkbox;



// function detectPreselectedCheckbox() {

//     const boxList = []

//     const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
//     console.log('found preselected checkboxes:',checkboxes.length);

//     checkboxes.forEach(box => {
//         // let text = '';

//         // let label = document.querySelector(`label[for="${box.id}"]`);
//         // if (label) {
//         //     text = label.innerText;
//         // } else if (box.nextElementSibling) {
//         //     text = box.nextElementSibling.innerText || box.nextElementSibling.textContent;
//         // } else {
//         //     text = box.parentElement.innerText;
//         // }

//         let container = box.closest('div'); // 找到离 checkbox 最近的 div 容器
//         let text = '';
//         if (container) {
//             text = container.parentElement?.innerText || ''; // 往上一级拿整块文字
//         }
//         console.log(text);
//         // const darkPatternKeywords = ['subscription','subcribe','email','premium', 'extra', 'privacy', 'share', 'promotion', 'advertisement', 'marketing', 'agree to receive'];
//         // if (darkPatternKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
//         //     console.log('found potential dark pattern:', text);
//         //     message = {
//         //         'pattern': 'pre-selected checkbox',
//         //         'detail': 'including key word' + keyword,
//         //         'element': box
//         //     };
            
//         //     boxList.push(message);

//         //     box.style.outline = '2px solid red';
//         // }
//         const darkPatternRegexList = [
//             // 新闻邮件相关
//             /newsletter/i,
//             /daily\s/i,
//             /weekly\s/i,
//             /roundup/i,
//             /update(s)?/i,
//             /email(s)?/i,

//             // 促销营销相关
//             /deal(s)?/i,
//             /offer(s)?/i,
//             /shopping/i,
//             /product(s)?/i,
//             /stuff/i,
//             /(products|deals)?/i,
//             /recommendation(s)?/i,
//             /trending/i,

//             // 行为动词类
//             /keep\s+up/i,
//             /stay\s+updated/i,
//             /subscribe/i,
//             /receive/i,
//             /get\s+(updates|emails|newsletter)?/i,
//             /sign\s+up/i,
//             /sent\s+to\s+your\s+inbox/i,
//             /buy/i,
//         ];

//         let matchedPattern = darkPatternRegexList.find(pattern => pattern.test(text.toLowerCase()));
//         if (matchedPattern && text.length > 10) {
//             console.log('found preselected checkbox text:', text);
//             const message = {
//                 pattern: 'pre-selected checkbox',
//                 detail: 'matched keyword: /' + matchedPattern.source + '/',
//                 element: box
//             };
//             boxList.push(message);
//             // box.style.outline = '2px solid red';
//         }
//     });

//     // 2. 检测视觉预选
//     const visualPreselectionKeywords = ['recommended', 'preselected', 'pre-selected', 'auto-selected'];
//     const negationPrefixes = ['not-', 'no-', 'non-', 'disable-', 'disabled-', 'un-'];

//     let foundVisualPreselection = false;

//     const visualBoxes = document.querySelectorAll('div, section, article, th, td');


//     visualBoxes.forEach(box => {

//         if (foundVisualPreselection) return; // 已找到，跳过后续检测,因为一个选项可能有多个包含关键词的元素

//         const classNames = box.className.toLowerCase();

//         const isVisuallyPreselected = visualPreselectionKeywords.some(keyword => {
//             if (!classNames.includes(keyword)) return false;
//             // 检查是否包含任意否定前缀 + keyword
//             const hasNegation = negationPrefixes.some(prefix => {
//                 // 也检查前缀+空格+keyword的情况
//                 return classNames.includes(prefix + keyword) || classNames.includes(prefix + ' ' + keyword);
//             });
//             return !hasNegation;  // 如果有否定前缀则不算视觉预选
//         });

//         if (isVisuallyPreselected) {
//             console.log('Visually preselected dark pattern found:', classNames);

//             const message = {
//                 pattern: 'visual-preselection',
//                 detail: 'visual preselection UI element',
//                 element: box
//             };

//             boxList.push(message);
//             // box.style.outline = '2px dashed orange';

//             foundVisualPreselection = true;  // 只算一次，防止重复发送
//         }
//     });

//     // send message to background
//     (async ()=> {
//         const response = await chrome.runtime.sendMessage({ 
//             source: "content_script", 
//             pattern: 'pre-selected checkbox', 
//             list: boxList }, () => {
//             console.log("massage sent:", boxList);
//         });
//     })();

//     // === MutationObserver: 自动重新运行检测 ===
//     // const observer = new MutationObserver(() => {
//     //     console.log('[Observer] DOM changed, re-running detectPreselectedCheckbox...');
//     //     detectPreselectedCheckbox();
//     //     observer.disconnect(); // 可换成节流防抖优化
//     // });
//     // observer.observe(document.body, {
//     //     childList: true,
//     //     subtree: true
//     // });
//     let detectTimeout = null;

//     const observer = new MutationObserver(() => {
//         console.log('[Observer] DOM changed');

//         if (detectTimeout) clearTimeout(detectTimeout);

//         detectTimeout = setTimeout(() => {
//             console.log('[Observer] Debounced: running detectPreselectedCheckbox...');
//             detectPreselectedCheckbox();
//         }, 500); // 防抖：只在 1 秒内不再变化时才触发
//     });
//     observer.observe(document.body, {
//         childList: true,
//         subtree: true
//     });

// }

// === 1. 检测 checkbox 勾选（只检测一次） ===
function detectPreselectedCheckbox() {
    const boxList = [];

    const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
    console.log('found preselected checkboxes:', checkboxes.length);

    checkboxes.forEach(box => {
        let container = box.closest('div');
        let text = '';
        if (container) {
            text = container.parentElement?.innerText || '';
        }

        const darkPatternRegexList = [
            /newsletter/i, /daily\s/i, /weekly\s/i, /roundup/i, /update(s)?/i, /email(s)?/i,
            /deal(s)?/i, /offer(s)?/i, /shopping/i, /product(s)?/i, /stuff/i,
            /recommendation(s)?/i, /trending/i,
            /keep\s+up/i, /stay\s+updated/i, /subscribe/i, /receive/i,
            /get\s+(updates|emails|newsletter)?/i, /sign\s+up/i, /sent\s+to\s+your\s+inbox/i, /buy/i,
        ];

        const matchedPattern = darkPatternRegexList.find(pattern => pattern.test(text.toLowerCase()));
        if (matchedPattern && text.length > 10) {
            console.log('found preselected checkbox:', text);
            boxList.push({
                pattern: 'pre-selected checkbox',
                detail: 'matched keyword: /' + matchedPattern.source + '/',
                element: box
            });
            box.style.outline = '2px solid red'
        }
    });

    if (boxList.length > 0) {
        chrome.runtime.sendMessage({
            source: "content_script",
            pattern: 'pre-selected checkbox',
            list: boxList
        }, () => {
            console.log("checkbox message sent:", boxList);
        });
    }
}

// === 2. 检测视觉预选（可懒加载触发） ===
function detectVisualPreselection() {
    if (visualPreselectionSent) {
        return;
    }

    const boxList = [];
    const visualPreselectionKeywords = ['recommended', 'preselected', 'pre-selected', 'auto-selected'];
    const negationPrefixes = ['not-', 'no-', 'non-', 'disable-', 'disabled-', 'un-'];

    const visualBoxes = document.querySelectorAll('div, section, article, th, td');

    for (const box of visualBoxes) {
        const classNames = box.className.toLowerCase();

        const isVisuallyPreselected = visualPreselectionKeywords.some(keyword => {
            if (!classNames.includes(keyword)) return false;

            const hasNegation = negationPrefixes.some(prefix =>
                classNames.includes(prefix + keyword) || classNames.includes(prefix + ' ' + keyword)
            );
            return !hasNegation;
        });

        if (isVisuallyPreselected) {
            console.log('Visual preselection detected:', classNames);
            boxList.push({
                pattern: 'pre-selected checkbox',
                detail: 'visual preselection UI element',
                element: box
            });
            visualPreselectionSent = true; // ✅ 只算一次
            break; // 找到一个就停止
        }
    }

    if (boxList.length > 0) {
        chrome.runtime.sendMessage({
            source: "content_script",
            pattern: 'visual-preselection',
            list: boxList
        }, () => {
            console.log("visual message sent:", boxList);
        });
    }

    // 🔁 懒加载监听（只设一次）
    if (!visualObserverStarted) {
        const observer = new MutationObserver(() => {
            console.log('[Observer] DOM changed → re-checking visual preselection...');
            if (!visualPreselectionSent) detectVisualPreselection();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        visualObserverStarted = true;
    }
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


// function detectBaitSwitch() {
//     // 白名单域名（可信的外部下载站点）
//     const trustedDomains = [
//         'steamcommunity.com',
//         'steampowered.com',
//         'microsoft.com',
//         'apple.com'
//         // 可以根据需求继续扩充
//     ];

//     // 获取根域名，比如 en.softonic.com -> softonic.com
//     function getRootDomain(hostname) {
//         const parts = hostname.split('.');
//         if (parts.length <= 2) return hostname.toLowerCase();
//         return parts.slice(-2).join('.').toLowerCase();
//     }

//     // 判断url是否属于白名单域名（基于根域名匹配）
//     function isTrustedDomain(url) {
//         try {
//             const domain = (new URL(url)).hostname.toLowerCase();
//             const rootDomain = getRootDomain(domain);
//             return trustedDomains.some(trustedRoot => rootDomain === trustedRoot.toLowerCase());
//         } catch {
//             return false;
//         }
//     }

//     // download button redirect to another domain
//     // ad close button redirect to another page
//     detectedList = []

//     // 1. 先检查页面上已有的可能与下载相关的按钮
//     const possibleDownloadButtons = Array.from(document.querySelectorAll('button,a'))
//         .filter(el => {
//             // 检查文本内容、ID、类名等是否包含download关键词
//             return (el.innerText && el.innerText.toLowerCase().includes('download')) ||
//                   (el.id && el.id.toLowerCase().includes('download')) ||
//                   (el.className && typeof el.className === 'string' && el.className.toLowerCase().includes('download')) ||
//                   // 查找按钮内部的SVG图标
//                   (el.querySelector && el.querySelector('svg[id*="download"], svg[class*="download"]'));
//         });

//     console.log('Found possible download buttons:', possibleDownloadButtons.length);

//     // 检查每个可能的下载按钮
//     possibleDownloadButtons.forEach(button => {
//         let onClickContent;
        
//         // 检查按钮自身是否有onclick属性
//         if (button.hasAttribute('onclick')) {
//             onClickContent = button.getAttribute('onclick');           
//         }
//         // 如果是a标签，检查href属性
//         else if (button.tagName === 'A' && button.hasAttribute('href')) {
//             onClickContent = button.getAttribute('href');
//         }
//         // 向上查找父元素的onclick或href
//         else {
//             let parent = button.parentElement;
//             while (parent && parent !== document.body) {
//                 if (parent.hasAttribute('onclick')) {
//                     onClickContent = parent.getAttribute('onclick');
//                     break;
//                 }
//                 if (parent.tagName === 'A' && parent.hasAttribute('href')) {
//                     onClickContent = parent.getAttribute('href');
//                     break;
//                 }
//                 parent = parent.parentElement;
//             }
//         }
//             //检测是否重定向到其他域，且跳转url不是白名单域名，若有，
//             // 1）加入列表，后续一起发送给background 
//             // 2）在网页上用红框标记问题按钮  
//         if (checkOnClickForRedirect(onClickContent)  && !isTrustedDomain(onClickContent) ) {
//             const message = {
//                 'pattern':'bait and swtich',
//                 'detail':'download button redirect to another domain',
//                 element: button
//             };
//             detectedList.push(message);
//             button.style.outline = '2px solid red'
//         }
//     });
//     console.log('detectedList:', detectedList);
//     //To do : send to background

//     // send message to background
//     (async ()=> {
//         const response = await chrome.runtime.sendMessage({ 
//             source: "content_script", 
//             pattern: 'bait and switch', 
//             list: detectedList }, () => {
//             console.log("massage sent:", detectedList);
//         });
//     })();

// }
    



//To be: 换成自己写的
// 使用 Google Gemini API 检测 Confirmshaming 暗模式

// // 检测函数
// async function detectConfirmshaming() {
//     // 收集页面上的相关元素
//     const elementsToCheck = [];
    
//     // 1. 检查退订、取消、关闭的相关按钮/链接
//     const cancelButtons = document.querySelectorAll('a, button');
//     cancelButtons.forEach(element => {
//     const text = element.innerText || element.textContent;
//     console.log('text:',text);
//     if (text) {
//         // 关注与取消、拒绝、关闭等相关的文本
//         const cancelKeywords = ['no thanks', 'cancel', 'close', 'maybe later', 'not now','no', 'unsubscribe'];
//         if (cancelKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
//         elementsToCheck.push({
//             element: element,
//             text: text.trim(),
//             type: 'cancel button'
//         });
//         }
//     }
//     });
    
//     // 2. 检查弹窗和提示框
//     const possibleModals = document.querySelectorAll('.modal, [class*="modal"], [class*="popup"], [class*="dialog"], [id*="modal"], [id*="popup"], [id*="dialog"]');
//     possibleModals.forEach(modal => {
//     const dismissButtons = modal.querySelectorAll('a, button');
//     dismissButtons.forEach(button => {
//         const text = button.innerText || button.textContent;
//         console.log('text:',text);
//         if (text) {
//         elementsToCheck.push({
//             element: button,
//             text: text.trim(),
//             type: 'modal dismiss button',
//             context: modal.innerText || modal.textContent
//         });
//         }
//     });
//     });

//     console.log('elementsToCheck:', elementsToCheck);
    
//     // 处理收集到的元素
//     const confirmshamingResults = [];
    
//     for (const item of elementsToCheck) {
//     // 使用 Google Gemini API 来分析文本
//     const isConfirmshaming = await checkTextWithGemini(item.text, item.context || '');
    
//     if (isConfirmshaming) {
//         // 标记问题元素
//         item.element.style.outline = '2px solid red';
        
//         // 将结果加入列表
//         confirmshamingResults.push({
//         'pattern': 'confirmshaming',
//         'detail': `use guilt-inducing language: "${item.text}"`,
//         'element': item.element
//         });
//     }
//     }
    
//     // 发送结果到背景脚本
//     if (confirmshamingResults.length > 0) {
//     (async () => {
//         try {
//         const response = await chrome.runtime.sendMessage({
//             source: "content_script",
//             pattern: 'confirmshaming',
//             list: confirmshamingResults
//         });
//         console.log("Confirmshaming results sent:", confirmshamingResults);
//         } catch (error) {
//         console.error("Error sending confirmshaming results:", error);
//         }
//     })();
//     }
// }

// // 调用 Gemini API 来分析文本是否为 Confirmshaming
// async function checkTextWithGemini(text, context = '') {
//     try {
//     // 构建 API 请求参数
//     const apiKey = 'AIzaSyDKjUbXwdO1iTh5WjBYe-hsCQHTQUCuNf0'; // 替换为你的 API 密钥
//     const apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    
    
//     // 构造完整的 prompt
//     let prompt = `请判断以下文本是否属于"确认羞辱"(Confirmshaming)这种暗模式。
// 确认羞辱是指网站或应用通过使用具有羞辱性、内疚感或负面情绪的语言来劝阻用户退出、取消或拒绝某些操作。

// 示例确认羞辱文本:
// - "不，我不想省钱"
// - "不，我不关心我的网络安全"
// - "我喜欢错过特别优惠"
// - "不用了，我不需要更好的服务"

// 请分析以下文本，如果是确认羞辱模式返回 true，否则返回 false。
// 只需返回 true 或 false，不要有其他任何额外文字:

// 文本: "${text}"`;

//     if (context) {
//         prompt += `\n上下文信息: "${context}"`;
//     }
    
//     // 发送请求到 Gemini API
//     const response = await fetch(`${apiEndpoint}?key=${apiKey}`, {
//         method: 'POST',
//         headers: {
//         'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//         contents: [{
//             parts: [{
//             text: prompt
//             }]
//         }],
//         generationConfig: {
//             temperature: 0.2,
//             maxOutputTokens: 10
//         }
//         })
//     });
    
//     const data = await response.json();

//     console.log('Gemini API response:', data);
    
//     // 解析响应
//     if (data.candidates && data.candidates[0] && data.candidates[0].content) {
//         const result = data.candidates[0].content.parts[0].text.trim().toLowerCase();
//         return result.includes('true');
//     }
    
//     return false;
//     } catch (error) {
//     console.error('Error calling Gemini API:', error);
//     return false;
//     }
// }




// detectPreselectedCheckbox();
// detectBaitSwitch();
// detectConfirmshaming();

function detectBaitSwitch() {
    const trustedDomains = [
        'steamcommunity.com',
        'steampowered.com',
        'microsoft.com',
        'apple.com'
        // 可继续添加
    ];

    function getRootDomain(hostname) {
        const parts = hostname.split('.');
        if (parts.length <= 2) return hostname.toLowerCase();
        return parts.slice(-2).join('.').toLowerCase();
    }

    function isTrustedDomain(url) {
        try {
            const domain = (new URL(url)).hostname.toLowerCase();
            const rootDomain = getRootDomain(domain);
            return trustedDomains.some(trustedRoot => rootDomain === trustedRoot.toLowerCase());
        } catch {
            return false;
        }
    }

    // 当前页面的根域名
    const currentRootDomain = getRootDomain(window.location.hostname);

    detectedList = []

    const possibleDownloadButtons = Array.from(document.querySelectorAll('button, a'))
        .filter(el => {
            return (el.id && el.id.toLowerCase().includes('download')) ||
                  (el.innerText && el.innerText.toLowerCase().includes('download')) ||
                  (el.className && typeof el.className === 'string' && el.className.toLowerCase().includes('download')) ||
                  (el.querySelector && el.querySelector('svg[id*="download"], svg[class*="download"]'));
        });

    console.log('Found possible download buttons:', possibleDownloadButtons.length);

    possibleDownloadButtons.forEach(button => {
        let onClickContent;

        if (button.hasAttribute('onclick')) {
            onClickContent = button.getAttribute('onclick');           
        } else if (button.tagName === 'A' && button.hasAttribute('href')) {
            onClickContent = button.getAttribute('href');
        } else {
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

        if (checkOnClickForRedirect(onClickContent)) {
            try {
                // const redirectDomain = (new URL(onClickContent)).hostname.toLowerCase();
                // const redirectRoot = getRootDomain(redirectDomain);

                // // 如果跳转是当前根域名，算正常跳转
                // if (redirectRoot === currentRootDomain) {
                //     return; // 跳过，不算恶意
                // }

                // 跳转不是当前根域名，再判断是否可信白名单
                if (isTrustedDomain(onClickContent)) {
                    return; // 可信外域名，跳过
                }

                // 否则判定为可疑跳转
                const message = {
                    'pattern':'bait and switch',
                    'detail':'download button redirect to another domain',
                    element: button
                };
                detectedList.push(message);
                button.style.outline = '2px solid red';

            } catch (e) {
                // URL解析失败忽略
                console.warn('Invalid redirect URL:', onClickContent);
            }
        }
    });

    console.log('detectedList:', detectedList);

    (async ()=> {
        await chrome.runtime.sendMessage({ 
            source: "content_script", 
            pattern: 'bait and switch', 
            list: detectedList }, () => {
            console.log("message sent:", detectedList);
        });
    })();
}
