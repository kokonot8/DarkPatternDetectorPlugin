import torch
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification

def load_model():
    # 加载保存的模型和tokenizer
    model = DistilBertForSequenceClassification.from_pretrained('confirmshaming_model')
    tokenizer = DistilBertTokenizer.from_pretrained('confirmshaming_model')
    
    # 设置设备
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = model.to(device)
    model.eval()
    
    return model, tokenizer, device

def predict_text(text, model, tokenizer, device):
    # 对输入文本进行编码
    inputs = tokenizer(
        text,
        add_special_tokens=True,
        max_length=128,
        padding='max_length',
        truncation=True,
        return_tensors='pt'
    )
    
    # 将输入移到正确的设备上
    input_ids = inputs['input_ids'].to(device)
    attention_mask = inputs['attention_mask'].to(device)
    
    # 进行预测
    with torch.no_grad():
        outputs = model(input_ids=input_ids, attention_mask=attention_mask)
        predictions = torch.softmax(outputs.logits, dim=1)
        predicted_class = torch.argmax(predictions, dim=1)
        confidence = predictions[0][predicted_class].item()
    
    # 返回预测结果和置信度
    return predicted_class.item(), confidence

def main():
    # 加载模型
    model, tokenizer, device = load_model()
    
    print("模型已加载，可以开始测试了！")
    print("输入 'quit' 退出程序")
    
    while True:
        # 获取用户输入
        text = input("\n请输入要测试的文本: ")
        
        if text.lower() == 'quit':
            break
            
        # 进行预测
        predicted_class, confidence = predict_text(text, model, tokenizer, device)
        
        # 输出结果
        result = "确认羞辱" if predicted_class == 1 else "非确认羞辱"
        print(f"\n预测结果: {result}")
        print(f"置信度: {confidence:.4f}")

if __name__ == '__main__':
    main()