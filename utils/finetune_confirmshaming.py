import pandas as pd
import torch
from torch.utils.data import Dataset, DataLoader
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification
from sklearn.model_selection import train_test_split
from tqdm import tqdm

# 定义数据集类
class ConfirmShamingDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_length=128):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = str(self.texts[idx])
        label = self.labels[idx]

        encoding = self.tokenizer(
            text,
            add_special_tokens=True,
            max_length=self.max_length,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        )

        return {
            'input_ids': encoding['input_ids'].squeeze(0),  # 去掉 batch 维度
            'attention_mask': encoding['attention_mask'].squeeze(0),
            'labels': torch.tensor(label, dtype=torch.long)
        }

def train_model():
    # **加载数据**
    try:
        df = pd.read_csv('confirmshaming_dataset_fixed.csv')
    except Exception as e:
        print(f"数据加载错误: {e}")
        return

    if 'text' not in df.columns or 'label' not in df.columns:
        print("CSV 文件缺少 'text' 或 'label' 列")
        return
    
    # **准备数据**
    texts = df['text'].tolist()
    labels = df['label'].tolist()

    # **划分训练集和验证集**
    train_texts, val_texts, train_labels, val_labels = train_test_split(
        texts, labels, test_size=0.2, random_state=42
    )

    # **初始化 tokenizer 和模型**
    tokenizer = DistilBertTokenizer.from_pretrained('distilbert-base-uncased')
    model = DistilBertForSequenceClassification.from_pretrained(
        'distilbert-base-uncased',
        num_labels=2  # 二分类
    )

    # **创建数据集**
    train_dataset = ConfirmShamingDataset(train_texts, train_labels, tokenizer)
    val_dataset = ConfirmShamingDataset(val_texts, val_labels, tokenizer)

    # **创建数据加载器**
    train_loader = DataLoader(train_dataset, batch_size=16, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=16)

    # **设置设备**
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model.to(device)

    # **设置优化器**
    optimizer = torch.optim.AdamW(model.parameters(), lr=2e-5)

    # **训练循环**
    num_epochs = 3
    for epoch in range(num_epochs):
        model.train()
        total_loss = 0

        # 训练阶段
        progress_bar = tqdm(train_loader, desc=f'Epoch {epoch + 1}')
        for batch in progress_bar:
            optimizer.zero_grad(set_to_none=True)  # 更高效的 zero_grad
            
            input_ids = batch['input_ids'].to(device)
            attention_mask = batch['attention_mask'].to(device)
            labels = batch['labels'].to(device)

            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                labels=labels
            )

            loss = outputs.loss
            total_loss += loss.item()

            loss.backward()
            optimizer.step()

            progress_bar.set_postfix({'loss': loss.item()})

        # **验证阶段**
        model.eval()
        val_loss = 0
        correct = 0
        total = 0

        with torch.no_grad():
            for batch in val_loader:
                input_ids = batch['input_ids'].to(device)
                attention_mask = batch['attention_mask'].to(device)
                labels = batch['labels'].to(device)

                outputs = model(
                    input_ids=input_ids,
                    attention_mask=attention_mask,
                    labels=labels
                )

                val_loss += outputs.loss.item()
                predictions = torch.argmax(outputs.logits, dim=1)
                correct += (predictions == labels).sum().item()
                total += labels.size(0)

        avg_val_loss = val_loss / len(val_loader)
        accuracy = correct / total
        print(f'Epoch {epoch + 1}:')
        print(f'Validation Loss: {avg_val_loss:.4f}')
        print(f'Validation Accuracy: {accuracy:.4f}')

    # **保存模型**
    model.save_pretrained('confirmshaming_model')
    tokenizer.save_pretrained('confirmshaming_model')

if __name__ == '__main__':
    train_model()
