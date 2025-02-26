
// const logDiv = document.getElementById('log');
// //初始化时清空内容

function getIssueItem(text) {
    // return (
    //     <div class="issue-item">
    //         <p>Pre-selected Checkbox</p>
    //         <p>{content}</p>
    //     </div>
    // )
    const issueItem = document.createElement('div');
    issueItem.className = 'issue-item';
    const type = document.createElement('p');
    type.textContent = 'Pre-selected Checkbox';
    type.className = "type";
    const content = document.createElement('p');
    content.textContent = text;
    content.className = "content";
    issueItem.appendChild(type);
    issueItem.appendChild(content);
    return issueItem;

}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Popup received message:", request);
    const numDiv = document.getElementById('pre-selected-checkbox');
    
    // if (request.log) {
    //     // 将新消息添加到显示区域
    //     logDiv.textContent += request.log + '\n';
    //     // 自动滚动到底部
    //     logDiv.scrollTop = logDiv.scrollHeight;
    // }
    // add new div for a dark pattern
    console.log(request.lists.length);
    if (request.lists.length > 0){
        
        // logDiv.innerHTML = '';
        // const firstDiv = document.createElement('div');
        // firstDiv.textContent = "Number of Potential Dark Patterns Found: " + request.lists.length;
        // firstDiv.className = "pattern-summary";
        // logDiv.appendChild(firstDiv);
        // console.log("Loaded");
        const issueList = document.getElementById('issue-list');
        numDiv.textContent = request.lists.length;
        // request.lists.forEach(element => {
        //     const newDiv = document.createElement('div');
        //     newDiv.textContent = element;
        //     newDiv.className = "pattern-content";
        //     logDiv.appendChild(newDiv);
        // });

        request.lists.forEach(item => {
            const issueItem = getIssueItem(item);
            issueList.appendChild(issueItem);
        });
        
    }
    if (request.lists.length == 0){
        numDiv.textContent = 0;
    }
    
    
    sendResponse('Popup displayed log');
    return true;
});