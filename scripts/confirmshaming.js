// // ONNX模型推理函数
// class ConfirmshamingDetector {
//     constructor() {
//         this.apiKey = "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";
//         this.apiUrl = "https://api.anthropic.com/v1/messages";
//         this.model = "claude-3-opus-20240229";
//     }


//     // 发送请求到Claude
//     async detectConfirmshaming(text) {
//         const prompt = (
//             "Determine if the following sentence uses confirmshaming (i.e., guilt-tripping users for not taking an action).\n" +
//             "Reply only with a single number: 1 (if it uses confirmshaming) or 0 (if it does not).\n" +
//             "Example:" +
//             "Sentence: \"No thanks, I don't like saving money\"\n" +
//             "Answer: 1\n" +
//             "Sentence: \"No, I will shop with no discount\"\n" +
//             "Answer: 1\n" +
//             "Sentence: \"Click below to cancel your subscription. Are you sure?\"\n" +
//             "Answer: 0\n" +
//             "Sentence: \"You're about to cancel your subscription. Please confirm\"\n" +
//             "Answer: 0\n" +
//             `Sentence: "${text}"\nAnswer:`
//         );

//         try {
//             const response = await fetch(this.apiUrl, {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                     "x-api-key": this.apiKey,
//                     "anthropic-version": "2023-06-01"
//                 },
//                 body: JSON.stringify({
//                     model: this.model,
//                     max_tokens: 5,
//                     temperature: 0,
//                     messages: [{ role: "user", content: prompt }]
//                 })
//             });

//             const data = await response.json();
//             console.log("Claude raw response:", data);

//             const answer = (data?.content?.[0]?.text || "").trim();
//             if (answer.startsWith("1")) return true;
//             if (answer.startsWith("0")) return false;

//             console.warn("⚠️ Unexpected Claude answer:", answer);
//             return false;
//         } catch (error) {
//             console.error("❌ Claude API error:", error);
//             return false;
//         }
//     }
// }


//     // 模型推理
//     async detectConfirmshaming(text) {
//         if (!this.session) {
//             await this.loadModel();
//         }

//         try {
//             // 预处理输入
//             const inputTensor = this.preprocessText(text);
            
//             // 准备模型输入
//             const feeds = {
//                 'input_ids': inputTensor,
//                 'attention_mask': new ort.Tensor('int64', new BigInt64Array(Array(128).fill(1n)), [1, 128])
//             };
            
//             // 运行推理
//             const outputMap = await this.session.run(feeds);
//             const logits = outputMap.logits;  // DistilBERT 的输出张量名称是 'logits'
            
//             // 解析结果（二分类）
//             const probabilities = this.softmax(Array.from(logits.data));
//             const threshold = 0.5;
            
//             // 返回是否是确认羞辱
//             return probabilities[1] > threshold;
//         } catch (error) {
//             console.error('推理过程出错:', error);
//             return false;
//         }
//     }

//     // Softmax 函数用于将 logits 转换为概率
//     softmax(arr) {
//         const max = Math.max(...arr);
//         const exp = arr.map(x => Math.exp(x - max));
//         const sum = exp.reduce((a, b) => a + b);
//         return exp.map(x => x / sum);
//     }
// }

// // 修改原有的检测函数
// async function detectConfirmshaming() {
//     // 初始化ONNX模型检测器
//     const detector = new OnnxConfirmshamingDetector('utils/distilbert_onnx/model.onnx');
    
//     // 收集页面上的相关元素
//     const elementsToCheck = [];
    
//     // 1. 检查退订、取消、关闭的相关按钮/链接
//     const cancelButtons = document.querySelectorAll('a, button');
//     cancelButtons.forEach(element => {
//         const text = element.innerText || element.textContent;
//         console.log('text:', text);
//         if (text) {
//             // 关注与取消、拒绝、关闭等相关的文本
//             const cancelKeywords = ['no thanks', 'cancel', 'close', 'maybe later', 'not now','no', 'unsubscribe'];
//             if (cancelKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
//                 elementsToCheck.push({
//                     element: element,
//                     text: text.trim(),
//                     type: 'cancel button'
//                 });
//             }
//         }
//     });
    
//     // 2. 检查弹窗和提示框
//     const possibleModals = document.querySelectorAll('.modal, [class*="modal"], [class*="popup"], [class*="dialog"], [id*="modal"], [id*="popup"], [id*="dialog"]');
//     possibleModals.forEach(modal => {
//         const dismissButtons = modal.querySelectorAll('a, button');
//         dismissButtons.forEach(button => {
//             const text = button.innerText || button.textContent;
//             console.log('text:', text);
//             if (text) {
//                 elementsToCheck.push({
//                     element: button,
//                     text: text.trim(),
//                     type: 'modal dismiss button',
//                     context: modal.innerText || modal.textContent
//                 });
//             }
//         });
//     });

//     console.log('elementsToCheck:', elementsToCheck);
    
//     // 处理收集到的元素
//     const confirmshamingResults = [];
    
//     for (const item of elementsToCheck) {
//         // 使用ONNX模型检测
//         const isConfirmshaming = await detector.detectConfirmshaming(item.text);
        
//         if (isConfirmshaming) {
//             // 标记问题元素
//             item.element.style.outline = '2px solid red';
            
//             // 将结果加入列表
//             confirmshamingResults.push({
//                 'pattern': 'confirmshaming',
//                 'detail': `use guilt-inducing language: "${item.text}"`,
//                 'element': item.element
//             });
//         }
//     }
    
//     // 发送结果到背景脚本
//     if (confirmshamingResults.length > 0) {
//         try {
//             const response = await chrome.runtime.sendMessage({
//                 source: "content_script",
//                 pattern: 'confirmshaming',
//                 list: confirmshamingResults
//             });
//             console.log("Confirmshaming results sent:", confirmshamingResults);
//         } catch (error) {
//             console.error("Error sending confirmshaming results:", error);
//         }
//     }
// }

// content_script.js

// Claude推理类
class ClaudeConfirmshamingDetector {
    constructor() {
        this.model = "claude-3-opus-20240229";
    }

    async detectConfirmshaming(text) {
        const prompt = (
            "Determine if the following sentence uses confirmshaming (i.e., guilt-tripping users for not taking an action).\n" +
            "Reply only with a single number: 1 (if it uses confirmshaming) or 0 (if it does not).\n" +
            "Example:" +
            "Sentence: \"No thanks, I don't like saving money\"\n" +
            "Answer: 1\n" +
            "Sentence: \"No, I will shop with no discount\"\n" +
            "Answer: 1\n" +
            "Sentence: \"Click below to cancel your subscription. Are you sure?\"\n" +
            "Answer: 0\n" +
            "Sentence: \"You're about to cancel your subscription. Please confirm\"\n" +
            "Answer: 0\n" +
            `Sentence: "${text}"\nAnswer:`
        );

        try {
            const response = await chrome.runtime.sendMessage({
                action: "callClaude",
                prompt: prompt
            });

            const answer = (response || "").trim();
            if (answer.startsWith("1")) return true;
            if (answer.startsWith("0")) return false;
            console.warn("⚠️ Unexpected Claude answer:", answer);
            return false;
        } catch (error) {
            console.error("❌ Claude detection error:", error);
            return false;
        }
    }
}

// 主检测函数
async function detectConfirmshaming() {
    const detector = new ClaudeConfirmshamingDetector();
    const elementsToCheck = [];

    // 取消/拒绝类按钮
    const cancelButtons = document.querySelectorAll('a, button');
    cancelButtons.forEach(element => {
        const text = element.innerText || element.textContent;
        if (text) {
            const cancelKeywords = ['no thanks', 'cancel', 'close', 'maybe later', 'not now', 'no', 'unsubscribe'];
            if (cancelKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
                elementsToCheck.push({ element, text: text.trim(), type: 'cancel button' });
            }
        }
    });

    // 模态框中按钮
    const possibleModals = document.querySelectorAll(
        '.modal, [class*="modal"], [class*="popup"], [class*="dialog"], [id*="modal"], [id*="popup"], [id*="dialog"]'
    );
    possibleModals.forEach(modal => {
        const dismissButtons = modal.querySelectorAll('a, button');
        dismissButtons.forEach(button => {
            const text = button.innerText || button.textContent;
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

    const confirmshamingResults = [];

    for (const item of elementsToCheck) {
        const isConfirmshaming = await detector.detectConfirmshaming(item.text);
        if (isConfirmshaming) {
            item.element.style.outline = '2px solid red';
            confirmshamingResults.push({
                pattern: 'confirmshaming',
                detail: `use guilt-inducing language: "${item.text}"`,
                element: item.element
            });
        }
    }

    if (confirmshamingResults.length > 0) {
        try {
            await chrome.runtime.sendMessage({
                source: "content_script",
                pattern: 'confirmshaming',
                list: confirmshamingResults
            });
            console.log("✅ Confirmshaming results sent:", confirmshamingResults);
        } catch (error) {
            console.error("❌ Error sending results:", error);
        }
    }
}

// 启动
detectConfirmshaming();
