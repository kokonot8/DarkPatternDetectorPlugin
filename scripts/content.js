
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
    


detectPreselectedCheckbox();
detectBaitSwitch();
