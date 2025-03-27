from transformers import AutoTokenizer
from optimum.onnxruntime import ORTModelForSequenceClassification
from optimum.exporters.onnx import export
from pathlib import Path

# 指定模型名称
model_name = "distilbert-base-uncased"
output_dir = Path("./distilbert_onnx")

# 下载并加载模型
model = ORTModelForSequenceClassification.from_pretrained(model_name, export=True)
tokenizer = AutoTokenizer.from_pretrained(model_name)

# 保存转换后的 ONNX 模型
model.save_pretrained(output_dir)
tokenizer.save_pretrained(output_dir)

print(f"ONNX 模型已保存至 {output_dir}")
