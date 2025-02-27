
// const logDiv = document.getElementById('log');
// //初始化时清空内容

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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.source == 'background_script') {
        console.log("Popup received message:", message);

        if (message && message.pattern) {
            //填充overview区域
            const overviewDiv = document.getElementById('overview-list');
            const overviewListItem = document.createElement('li');
            const pattern = document.createElement('p');
            pattern.textContent = message.pattern + ':';
            const num = document.createElement('p');
            num.textContent = message.list.length;
            overviewListItem.appendChild(pattern);
            overviewListItem.appendChild(num);
            overviewDiv.appendChild(overviewListItem);
        }
        //填充detail区域
        if (message.list.length > 0){
            const issueList = document.getElementById('issue-list');
            message.list.forEach(item => {
                const issueItem = getIssueItem(item);
                issueList.appendChild(issueItem);
            });
            
        }   
    }

    sendResponse('Popup displayed log');
    return true;
});