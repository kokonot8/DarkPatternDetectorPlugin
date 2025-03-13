import { calculateUnethicalScore, updateScoreDisplay } from "./evaluate.js";
// const logDiv = document.getElementById('log');
// //初始化时清空内容

// const startTime = performance.now();


function getIssueItem(item) {
    // return (
    //     <div class="issue-item">
    //         <p>Pre-selected Checkbox</p>
    //         <p>{content}</p>
    //     </div>
    // )
    const issueItem = document.createElement('div');
    issueItem.className = 'issue-item';
    const type = document.createElement('p');
    type.textContent = item.pattern;
    type.className = "type";
    const content = document.createElement('p');
    console.log(item.element);
    content.textContent = item.detail; //To do: extract element id
    content.className = "content";
    issueItem.appendChild(type);
    issueItem.appendChild(content);
    return issueItem;

}


document.addEventListener('DOMContentLoaded', function() {
    const patternCounts = {};

    // popup打开后请求数据
    chrome.runtime.sendMessage({ source: "popup_request" }, (response) => {
        console.log("Sent request to background:", response);
    });
    
    // Listen for response from background
    chrome.runtime.onMessage.addListener((result, sender, sendResponse) => {
        if (result.source === "background_script") {
            console.log("Popup received full message:", result);
            console.log("Results array:", result.results);
            
            if (result.results && Array.isArray(result.results)) {
                // 清空之前的内容
                const overviewDiv = document.getElementById('overview-list');
                const issueList = document.getElementById('issue-list');
                overviewDiv.innerHTML = '';
                issueList.innerHTML = '';

                let hasDetections = false;

                result.results.forEach(message => {
                    console.log("Processing message:", message);
                    if (message && message.pattern) {
                        //统计每个pattern type的个数
                        if (!patternCounts[message.pattern]) {
                            patternCounts[message.pattern] = 0;
                        }
                        patternCounts[message.pattern] += message.list.length;

                        if (message.list.length > 0) {
                            hasDetections = true;
                            //填充overview区域
                            const overviewListItem = document.createElement('li');
                            const pattern = document.createElement('p');
                            pattern.textContent = message.pattern + ':';
                            const num = document.createElement('p');
                            num.textContent = message.list.length;
                            overviewListItem.appendChild(pattern);
                            overviewListItem.appendChild(num);
                            overviewDiv.appendChild(overviewListItem);

                            //填充detail区域
                            message.list.forEach(item => {
                                const issueItem = getIssueItem(item);
                                issueList.appendChild(issueItem);
                            });
                        }
                    }
                });

                // 如果没有检测到任何暗模式，显示提示信息
                if (!hasDetections) {
                    const overviewListItem = document.createElement('li');
                    const pattern = document.createElement('p');
                    pattern.textContent = "No dark pattern detected on this page.";
                    overviewListItem.appendChild(pattern);
                    overviewDiv.appendChild(overviewListItem);
                }

                // Calculate and update score
                const score = calculateUnethicalScore(patternCounts);
                updateScoreDisplay(score);
            }
        }
    });

    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() { //注意这里不能用箭头函数的原因是，箭头函数不会绑定自己的 this，而是继承父作用域的 this
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.overview, .detail').forEach(content => {
                content.classList.remove('active-div');
            })
            this.classList.add('active');
            const correspondDiv = this.getAttribute('correspond-div')
            document.getElementsByClassName(correspondDiv)[0].classList.add('active-div'); //注意getElementsByClassName返回的是数组
        } )
    })

    
});

// // 插件加载过程，例如加载页面、请求资源等
// window.addEventListener('load', () => {
//     const endTime = performance.now();
//     console.log(`popup loading completed: ${endTime - startTime} ms`);
//   });