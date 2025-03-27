// ONNX模型推理函数
class OnnxConfirmshamingDetector {
    constructor(modelPath) {
        this.modelPath = modelPath;
        this.session = null;
    }

    async loadModel() {
        try {
            // 配置 ONNX Runtime
            const options = {
                executionProviders: ['wasm'],
                graphOptimizationLevel: 'all',
                enableCpuMemArena: true,
                wasmPaths: chrome.runtime.getURL('node_modules/onnxruntime-web/dist/')
            };

            // 使用 ONNX Runtime Web 加载模型
            this.session = await ort.InferenceSession.create(
                chrome.runtime.getURL(this.modelPath),
                options
            );
            console.log('ONNX模型加载成功');
        } catch (error) {
            console.error('模型加载失败:', error);
            throw error;
        }
    }

    // 文本预处理
    preprocessText(text) {
        // 简单的文本处理
        const cleanedText = text.toLowerCase().trim();
        
        // 分词（这里是简化实现）
        const tokens = cleanedText.split(/\s+/);
        
        // 转换为数值表示（假设模型需要数值输入）
        const tokenIds = tokens.map((token, index) => 
            // 这里需要替换为实际的词汇映射
            index < 128 ? (token.charCodeAt(0) || 0) : 0
        );

        // 填充或截断到固定长度
        while (tokenIds.length < 128) {
            tokenIds.push(0);
        }

        // 创建 ONNX Runtime tensor
        return new ort.Tensor('int64', new BigInt64Array(tokenIds.map(id => BigInt(id))), [1, 128]);
    }

    // 模型推理
    async detectConfirmshaming(text) {
        if (!this.session) {
            await this.loadModel();
        }

        try {
            // 预处理输入
            const inputTensor = this.preprocessText(text);
            
            // 准备模型输入
            const feeds = {
                'input_ids': inputTensor,
                'attention_mask': new ort.Tensor('int64', new BigInt64Array(Array(128).fill(1n)), [1, 128])
            };
            
            // 运行推理
            const outputMap = await this.session.run(feeds);
            const logits = outputMap.logits;  // DistilBERT 的输出张量名称是 'logits'
            
            // 解析结果（二分类）
            const probabilities = this.softmax(Array.from(logits.data));
            const threshold = 0.5;
            
            // 返回是否是确认羞辱
            return probabilities[1] > threshold;
        } catch (error) {
            console.error('推理过程出错:', error);
            return false;
        }
    }

    // Softmax 函数用于将 logits 转换为概率
    softmax(arr) {
        const max = Math.max(...arr);
        const exp = arr.map(x => Math.exp(x - max));
        const sum = exp.reduce((a, b) => a + b);
        return exp.map(x => x / sum);
    }
}

// 修改原有的检测函数
async function detectConfirmshaming() {
    // 初始化ONNX模型检测器
    const detector = new OnnxConfirmshamingDetector('utils/distilbert_onnx/model.onnx');
    
    // 收集页面上的相关元素
    const elementsToCheck = [];
    
    // 1. 检查退订、取消、关闭的相关按钮/链接
    const cancelButtons = document.querySelectorAll('a, button');
    cancelButtons.forEach(element => {
        const text = element.innerText || element.textContent;
        console.log('text:', text);
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
            console.log('text:', text);
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
        // 使用ONNX模型检测
        const isConfirmshaming = await detector.detectConfirmshaming(item.text);
        
        if (isConfirmshaming) {
            // 标记问题元素
            item.element.style.outline = '2px solid red';
            
            // 将结果加入列表
            confirmshamingResults.push({
                'pattern': 'confirmshaming',
                'detail': `use guilt-inducing language: "${item.text}"`,
                'element': item.element
            });
        }
    }
    
    // 发送结果到背景脚本
    if (confirmshamingResults.length > 0) {
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
    }
}