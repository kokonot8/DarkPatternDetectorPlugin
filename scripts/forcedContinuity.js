// ONNX模型推理函数
class OnnxForcedContinuityDetector {
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

    async detectForcedContinuity(text) {
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

async function detectForcedContinuity() {
    const detector = new OnnxForcedContinuityDetector('utils/distilbert_onnx/model.onnx');
    const elementsToCheck = [];
    
    // 1. 检查订阅相关文本
    const subscriptionTexts = document.querySelectorAll('*');
    subscriptionTexts.forEach(element => {
        const text = element.innerText || element.textContent;
        if (text) {
            const subscriptionKeywords = ['trial', 'subscription', 'auto-renew', 'automatically renew', 'free trial', 
                                        'credit card', 'payment method', '试用', '订阅', '自动续费', '信用卡'];
            if (subscriptionKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
                elementsToCheck.push({
                    element: element,
                    text: text.trim(),
                    type: 'subscription text'
                });
            }
        }
    });

    // 2. 检查支付表单
    const paymentForms = document.querySelectorAll('form');
    paymentForms.forEach(form => {
        const inputs = form.querySelectorAll('input[type="text"], input[type="number"]');
        inputs.forEach(input => {
            const label = document.querySelector(`label[for="${input.id}"]`) || 
                         input.closest('label') ||
                         input.previousElementSibling;
            
            if (label) {
                const text = label.innerText || label.textContent;
                if (text) {
                    const paymentKeywords = ['card', 'payment', 'credit', 'debit', 'expiry', 'cvv', '卡号', '支付'];
                    if (paymentKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
                        elementsToCheck.push({
                            element: form,
                            text: form.innerText || form.textContent,
                            type: 'payment form'
                        });
                    }
                }
            }
        });
    });

    // 3. 检查小字印刷体
    const smallPrints = document.querySelectorAll('.small, small, [style*="font-size: small"]');
    smallPrints.forEach(element => {
        const text = element.innerText || element.textContent;
        if (text) {
            elementsToCheck.push({
                element: element,
                text: text.trim(),
                type: 'small print'
            });
        }
    });

    const forcedContinuityResults = [];
    
    for (const item of elementsToCheck) {
        const isForcedContinuity = await detector.detectForcedContinuity(item.text);
        
        if (isForcedContinuity) {
            item.element.style.outline = '2px solid yellow';
            
            forcedContinuityResults.push({
                'pattern': 'forced_continuity',
                'detail': `hides subscription terms: "${item.text}"`,
                'element': item.element
            });
        }
    }
    
    if (forcedContinuityResults.length > 0) {
        try {
            const response = await chrome.runtime.sendMessage({
                source: "content_script",
                pattern: 'forced_continuity',
                list: forcedContinuityResults
            });
            console.log("Forced continuity results sent:", forcedContinuityResults);
        } catch (error) {
            console.error("Error sending forced continuity results:", error);
        }
    }
} 