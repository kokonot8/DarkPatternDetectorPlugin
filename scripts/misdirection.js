// ONNX模型推理函数
class OnnxMisdirectionDetector {
    constructor(modelPath) {
        this.modelPath = modelPath;
        this.session = null;
    }

    async loadModel() {
        try {
            const options = {
                executionProviders: ['wasm'],
                graphOptimizationLevel: 'all',
                enableCpuMemArena: true,
                wasmPaths: chrome.runtime.getURL('node_modules/onnxruntime-web/dist/')
            };

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

    preprocessText(text) {
        const cleanedText = text.toLowerCase().trim();
        const tokens = cleanedText.split(/\s+/);
        const tokenIds = tokens.map((token, index) => 
            index < 128 ? (token.charCodeAt(0) || 0) : 0
        );

        while (tokenIds.length < 128) {
            tokenIds.push(0);
        }

        return new ort.Tensor('int64', new BigInt64Array(tokenIds.map(id => BigInt(id))), [1, 128]);
    }

    async detectMisdirection(text) {
        if (!this.session) {
            await this.loadModel();
        }

        try {
            const inputTensor = this.preprocessText(text);
            const feeds = {
                'input_ids': inputTensor,
                'attention_mask': new ort.Tensor('int64', new BigInt64Array(Array(128).fill(1n)), [1, 128])
            };
            
            const outputMap = await this.session.run(feeds);
            const logits = outputMap.logits;
            const probabilities = this.softmax(Array.from(logits.data));
            const threshold = 0.5;
            
            return probabilities[1] > threshold;
        } catch (error) {
            console.error('推理过程出错:', error);
            return false;
        }
    }

    softmax(arr) {
        const max = Math.max(...arr);
        const exp = arr.map(x => Math.exp(x - max));
        const sum = exp.reduce((a, b) => a + b);
        return exp.map(x => x / sum);
    }
}

async function detectMisdirection() {
    const detector = new OnnxMisdirectionDetector('utils/distilbert_onnx/model.onnx');
    const elementsToCheck = [];
    
    // 1. 检查复选框和相关标签
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        const label = document.querySelector(`label[for="${checkbox.id}"]`) || 
                     checkbox.closest('label') ||
                     checkbox.nextElementSibling;
        
        if (label) {
            const text = label.innerText || label.textContent;
            if (text) {
                elementsToCheck.push({
                    element: label,
                    text: text.trim(),
                    type: 'checkbox label'
                });
            }
        }
    });

    // 2. 检查按钮和链接的措辞
    const clickables = document.querySelectorAll('button, a, [role="button"]');
    clickables.forEach(element => {
        const text = element.innerText || element.textContent;
        if (text) {
            const misdirectionKeywords = ['I understand', 'I agree', 'I accept', 'continue', 'next', '我同意', '我知道了', '继续'];
            if (misdirectionKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
                // 获取上下文
                const context = element.closest('div, section, form')?.innerText || '';
                elementsToCheck.push({
                    element: element,
                    text: context || text.trim(),
                    type: 'button text'
                });
            }
        }
    });

    // 3. 检查隐私政策和条款相关文本
    const privacyTexts = document.querySelectorAll('*');
    privacyTexts.forEach(element => {
        const text = element.innerText || element.textContent;
        if (text) {
            const privacyKeywords = ['privacy', 'terms', 'conditions', 'policy', 'consent', '隐私', '条款', '政策'];
            if (privacyKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
                elementsToCheck.push({
                    element: element,
                    text: text.trim(),
                    type: 'privacy text'
                });
            }
        }
    });

    const misdirectionResults = [];
    
    for (const item of elementsToCheck) {
        const isMisdirection = await detector.detectMisdirection(item.text);
        
        if (isMisdirection) {
            item.element.style.outline = '2px solid purple';
            
            misdirectionResults.push({
                'pattern': 'misdirection',
                'detail': `uses misleading language: "${item.text}"`,
                'element': item.element
            });
        }
    }
    
    if (misdirectionResults.length > 0) {
        try {
            const response = await chrome.runtime.sendMessage({
                source: "content_script",
                pattern: 'misdirection',
                list: misdirectionResults
            });
            console.log("Misdirection results sent:", misdirectionResults);
        } catch (error) {
            console.error("Error sending misdirection results:", error);
        }
    }
} 