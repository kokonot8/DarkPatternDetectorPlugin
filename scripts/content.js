// detect pre-select checkbox
// Step1: find selected checkbox;
// Step2: find revelent text of checkbox;


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
    const darkPatternKeywords = ['subscription','subcribe','email','premium', 'extra', 'privacy', 'share', 'promotion', 'ddvertisement', 'marketing', 'agree to receive'];
    if (darkPatternKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
        console.log('found potential dark pattern:', text);
        message = text;
        
        boxList.push(message);

        box.style.outline = '2px solid red';
    }

});

// send message to background
(async ()=> {
    const response = await chrome.runtime.sendMessage({ lists: boxList }, () => {
        console.log("massage sent:", boxList);
    });
})();

    




// function findLabel(checkbox) {
//     // 1. 通过 for 属性查找
//     if (checkbox.id) {
//       const labelElement = document.querySelector(`label[for="${checkbox.id}"]`);
//       if (labelElement) {
//         return labelElement.textContent.trim();
//       }
//     }
    
//     // 2. 查找父级 label
//     const parentLabel = checkbox.closest('label');
//     if (parentLabel) {
//       return parentLabel.textContent.trim();
//     }
    
//     // 3. 查找相邻的文本节点
//     const nextSibling = checkbox.nextSibling;
//     if (nextSibling && nextSibling.nodeType === 3) { // Text node
//       return nextSibling.textContent.trim();
//     }
    
//     // 4. 查找父元素中的文本
//     const parentText = checkbox.parentElement?.textContent.trim();
//     if (parentText) {
//       return parentText;
//     }
  
//     return 'No label found';
//   }
  
//   function detectDarkPatterns() {
//     console.log('Starting dark pattern detection...');
    
//     const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
//     console.log('Pre-selected checkboxes found:', checkboxes.length);
    
//     checkboxes.forEach((checkbox, index) => {
//       const analysis = analyzeCheckbox(checkbox);
      
//       if (analysis.isDarkPattern) {
//         highlightDarkPattern(checkbox, analysis);
//         console.log(`Dark Pattern #${index + 1}:`, analysis);
//       }
//     });
//   }
  
//   function analyzeCheckbox(checkbox) {
//     const label = findLabel(checkbox);
//     const analysis = {
//       label: label,
//       location: getElementLocation(checkbox),
//       patterns: {
//         hasPrice: hasPriceNearby(checkbox),
//         isBundled: isBundledService(checkbox),
//         hasUrgency: hasUrgencyLanguage(checkbox),
//         isImportantOption: isImportantChoice(checkbox),
//         isHidden: isPartiallyHidden(checkbox)
//       }
//     };
    
//     // 判断是否为暗模式
//     analysis.isDarkPattern = (
//       // 如果涉及费用或捆绑销售
//       (analysis.patterns.hasPrice || analysis.patterns.isBundled) ||
//       // 或使用紧迫感措辞且是预选的
//       (analysis.patterns.hasUrgency) ||
//       // 或是重要选项（如隐私设置）且预选
//       (analysis.patterns.isImportantOption) ||
//       // 或部分隐藏
//       (analysis.patterns.isHidden)
//     );
    
//     return analysis;
//   }
  
//   function hasPriceNearby(checkbox) {
//     const wrapper = checkbox.closest('div, label, form');
//     const text = wrapper?.textContent || '';
//     // 匹配常见货币符号和数字组合
//     return /[\$\€\£]\s?\d+|\d+\s?[\$\€\£]/.test(text);
//   }
  
//   function isBundledService(checkbox) {
//     const text = findLabel(checkbox).toLowerCase();
//     const bundleKeywords = [
//       'include', 'with', 'add', 'plus', 'extra',
//       'bundle', 'package', 'together', 'additional'
//     ];
//     return bundleKeywords.some(keyword => text.includes(keyword));
//   }
  
//   function hasUrgencyLanguage(checkbox) {
//     const text = findLabel(checkbox).toLowerCase();
//     const urgencyKeywords = [
//       'limited time', 'special offer', 'don\'t miss',
//       'recommended', 'popular', 'best choice',
//       'most chosen', 'save', 'discount'
//     ];
//     return urgencyKeywords.some(keyword => text.includes(keyword));
//   }
  
//   function isImportantChoice(checkbox) {
//     const text = findLabel(checkbox).toLowerCase();
//     const importantKeywords = [
//       'privacy', 'data', 'subscribe', 'newsletter',
//       'agreement', 'terms', 'consent', 'accept'
//     ];
//     return importantKeywords.some(keyword => text.includes(keyword));
//   }
  
//   function isPartiallyHidden(checkbox) {
//     const style = window.getComputedStyle(checkbox);
//     // 检查是否有可疑的样式
//     return style.opacity < 1 ||
//            style.fontSize < '12px' ||
//            style.color === style.backgroundColor;
//   }
  
//   function getElementLocation(element) {
//     const rect = element.getBoundingClientRect();
//     return {
//       isAboveFold: rect.top < window.innerHeight,
//       isNearEdge: rect.left < 20 || rect.right > window.innerWidth - 20,
//       isNearBottom: rect.bottom > window.innerHeight - 100
//     };
//   }
  
//   function highlightDarkPattern(checkbox, analysis) {
//     // 添加红色轮廓
//     checkbox.style.outline = '2px solid red';
    
//     // 创建提示标签
//     const tooltip = document.createElement('div');
//     tooltip.style.cssText = `
//       position: absolute;
//       background: #ff4444;
//       color: white;
//       padding: 5px;
//       border-radius: 3px;
//       font-size: 12px;
//       z-index: 10000;
//       max-width: 200px;
//     `;
    
//     // 生成提示文本
//     let reason = 'Potential dark pattern:';
//     if (analysis.patterns.hasPrice) reason += ' Preselected paid option.';
//     if (analysis.patterns.isBundled) reason += ' Bundled service.';
//     if (analysis.patterns.hasUrgency) reason += ' Uses urgency.';
//     if (analysis.patterns.isImportantOption) reason += ' Important choice.';
//     if (analysis.patterns.isHidden) reason += ' Partially hidden.';
    
//     tooltip.textContent = reason;
    
//     // 放置提示标签
//     const rect = checkbox.getBoundingClientRect();
//     tooltip.style.left = `${rect.left}px`;
//     tooltip.style.top = `${rect.bottom + 5}px`;
    
//     document.body.appendChild(tooltip);
//   }
  
//   // 初始检测
//   console.log('Content script loaded');
//   detectDarkPatterns();
  
//   // DOM变化监听
//   const observer = new MutationObserver(() => {
//     console.log('DOM Changed');
//     detectDarkPatterns();
//   });
  
//   observer.observe(document.body, {
//     childList: true,
//     subtree: true
//   });