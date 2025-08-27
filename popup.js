import { calculateUnethicalScore } from "./evaluate.js";
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

function createEmptyState(message) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    
    const emptyText = document.createElement('p');
    emptyText.textContent = message;
    
    emptyState.appendChild(emptyText);
    return emptyState;
}

function updateScoreDisplay(score) {
    const scoreValue = document.getElementById('score-value');
    const scoreProgress = document.getElementById('score-progress');
    const scoreDescription = document.getElementById('score-description');
    
    if (scoreValue) scoreValue.textContent = `${score}/100`;
    if (scoreProgress) scoreProgress.value = score;
    
    // Set risk level based on score
    let riskLevel = '';
    let colorClass = '';
    
    if (score === 0) {
        riskLevel = 'A Level';
        colorClass = 'score-safe';
    } else if (score <= 20) {
        riskLevel = 'B Level';
        colorClass = 'score-low';
    } else if (score <= 40) {
        riskLevel = 'C Level';
        colorClass = 'score-medium';
    } else if (score <= 60) {
        riskLevel = 'D Level';
        colorClass = 'score-high';
    } else {
        riskLevel = 'E Level';
        colorClass = 'score-high';
    }
    
    if (scoreDescription) {
        scoreDescription.textContent = riskLevel;
        scoreDescription.className = `score-description ${colorClass}`;
    }
}

document.addEventListener('DOMContentLoaded', async function() {

    try {
        // 请求当前标签页的数据
        const response = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ source: "popup_request" }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(response);
                }
            });
        });

        // Clear previous content
        const overviewDiv = document.getElementById('overview-list');
        const issueList = document.getElementById('issue-list');
        
        overviewDiv.innerHTML = '';
        issueList.innerHTML = '';
        
        const patternCounts = {};
        let hasDetections = false;

        if (response && response.results) {
            const results = Object.values(response.results);
            
            results.forEach(message => {
                if (message && message.pattern && message.list) {
                    // 统计每个 pattern type 的个数
                    if (!patternCounts[message.pattern]) {
                        patternCounts[message.pattern] = 0;
                    }
                    patternCounts[message.pattern] += message.list.length;

                    if (message.list.length > 0) {
                        hasDetections = true;
                        // 填充 overview 区域
                        const overviewListItem = document.createElement('li');
                        const pattern = document.createElement('p');
                        pattern.textContent = message.pattern;
                        const num = document.createElement('p');
                        num.textContent = message.list.length;
                        overviewListItem.appendChild(pattern);
                        overviewListItem.appendChild(num);
                        overviewDiv.appendChild(overviewListItem);

                        // 填充 detail 区域
                        message.list.forEach(item => {
                            const issueItem = getIssueItem(item);
                            issueList.appendChild(issueItem);
                        });
                    }
                }
            });
        }

        // 如果没有检测到任何暗模式，显示提示信息
        if (!hasDetections) {
            const emptyState = createEmptyState('No dark patterns detected on this page');
            overviewDiv.appendChild(emptyState);
            
            const detailEmptyState = createEmptyState('Page analysis complete - No dark patterns found');
            issueList.appendChild(detailEmptyState);
        }

        // 更新分数显示
        const score = calculateUnethicalScore(patternCounts);
        updateScoreDisplay(score);

    } catch (error) {
        console.error('Error getting detection results:', error);
        
        // Show error state
        const overviewDiv = document.getElementById('overview-list');
        const issueList = document.getElementById('issue-list');
        
        const errorState = createEmptyState('Error occurred during analysis');
        overviewDiv.appendChild(errorState);
        issueList.appendChild(errorState);
    }

    // Tab switching functionality
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() { //注意这里不能用箭头函数的原因是，箭头函数不会绑定自己的 this，而是继承父作用域的 this
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.overview, .detail').forEach(content => {
                content.classList.remove('active-div');
            })
            this.classList.add('active');
            const targetId = this.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.classList.add('active-div');
            }
        });
    });
});

// // 插件加载过程，例如加载页面、请求资源等
// window.addEventListener('load', () => {
//     const endTime = performance.now();
//     console.log(`popup loading completed: ${endTime - startTime} ms`);
//   });

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     if (message.source === "loading_status") {
//         if (message.loading) {
//             statusEl.textContent = "检测中，请稍候...";
//             clearResults();
//         } else {
//             statusEl.textContent = "检测完成";
//             // message.results 是检测结果列表，包装成你的 expected 结构即可
//             const fakeResponse = {
//                 results: {
//                     confirmshaming: {
//                         pattern: "confirmshaming",
//                         list: message.results || []
//                     }
//                 }
//             };
//             renderResults(fakeResponse);
//         }
//     }
// });