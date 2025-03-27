// ONNX模型推理函数
class OnnxUrgencyDetector {
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

    async detectUrgency(text) {
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

async function detectUrgency() {
    const detector = new OnnxUrgencyDetector('utils/distilbert_onnx/model.onnx');
    const elementsToCheck = [];
    
    // 1. 检查倒计时元素
    const timeElements = document.querySelectorAll('[class*="time"], [class*="countdown"], [class*="timer"]');
    timeElements.forEach(element => {
        const text = element.innerText || element.textContent;
        if (text) {
            elementsToCheck.push({
                element: element,
                text: text.trim(),
                type: 'countdown'
            });
        }
    });

    // 2. 检查限时优惠文本
    const promotionTexts = document.querySelectorAll('*');
    promotionTexts.forEach(element => {
        const text = element.innerText || element.textContent;
        if (text) {
            const urgencyKeywords = ['limited time', 'ends soon', 'only today', 'last chance', 'hurry', 'running out', '限时', '抢购', '马上结束'];
            if (urgencyKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
                elementsToCheck.push({
                    element: element,
                    text: text.trim(),
                    type: 'promotion'
                });
            }
        }
    });

    // 3. 检查库存信息
    const stockInfo = document.querySelectorAll('[class*="stock"], [class*="inventory"]');
    stockInfo.forEach(element => {
        const text = element.innerText || element.textContent;
        if (text) {
            const stockKeywords = ['only', 'left', 'in stock', 'remaining', '仅剩', '库存'];
            if (stockKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
                elementsToCheck.push({
                    element: element,
                    text: text.trim(),
                    type: 'stock'
                });
            }
        }
    });

    const urgencyResults = [];
    
    for (const item of elementsToCheck) {
        const isUrgency = await detector.detectUrgency(item.text);
        
        if (isUrgency) {
            item.element.style.outline = '2px solid orange';
            
            urgencyResults.push({
                'pattern': 'urgency',
                'detail': `creates false urgency: "${item.text}"`,
                'element': item.element
            });
        }
    }
    
    if (urgencyResults.length > 0) {
        try {
            const response = await chrome.runtime.sendMessage({
                source: "content_script",
                pattern: 'urgency',
                list: urgencyResults
            });
            console.log("Urgency results sent:", urgencyResults);
        } catch (error) {
            console.error("Error sending urgency results:", error);
        }
    }
} 