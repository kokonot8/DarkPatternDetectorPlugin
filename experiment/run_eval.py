import argparse
import pandas as pd
from sklearn.metrics import classification_report
# from transformers import AutoTokenizer, AutoModelForSequenceClassification
# import torch
import os
# import google.generativeai as genai
import openai
import anthropic
# ========= 配置 =========
# CSV_PATH = "data/confirmshaming_dataset_fixed.csv"
CSV_PATH = "data/cleaned_confirmshaming_dataset.csv"
MODEL_PATH = "models/confirmshaming_model"
MAX_LENGTH = 128
# DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# ========= 数据加载 =========
def load_data():
    df = pd.read_csv(CSV_PATH)
    texts = df['text'].tolist()
    labels = df['label'].tolist()
    return texts, labels

# ========= HuggingFace 模型 =========
def run_huggingface(texts):
    # tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
    # model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH).to(DEVICE)

    # all_preds = []
    # model.eval()
    # with torch.no_grad():
    #     for i in range(0, len(texts), 8):
    #         batch_texts = texts[i:i+8]
    #         inputs = tokenizer(batch_texts, padding=True, truncation=True, max_length=MAX_LENGTH, return_tensors="pt").to(DEVICE)
    #         outputs = model(**inputs)
    #         preds = torch.argmax(outputs.logits, dim=1)
    #         all_preds.extend(preds.cpu().tolist())
    # return all_preds
    pass
# ========= Claude 模型（伪实现） =========
def run_claude(texts):
    # api_key = os.environ.get("CLAUDE_API_KEY")
    api_key = "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"
    if not api_key:
        raise ValueError("Please set your ANTHROPIC_API_KEY environment variable.")
    
    client = anthropic.Anthropic(api_key=api_key)

    preds = []
    for text in texts:
        # #zero-shot
        # prompt = (
        #     "Determine if the following sentence uses confirmshaming (i.e., guilt-tripping users for not taking an action).\n"
        #     "Reply only with a single number: 1 (if it uses confirmshaming) or 0 (if it does not).\n\n"
        #     f"Sentence: \"{text}\"\nAnswer:"
        # )
        # ##one shot
        # prompt = (
        #     "Determine if the following sentence uses confirmshaming (i.e., guilt-tripping users for not taking an action).\n"
        #     "Reply only with a single number: 1 (if it uses confirmshaming) or 0 (if it does not).\n"
        #     "Example:"
        #     "Sentence: \"No thanks, I don't like saving money\""
        #     "Answer: 1"
        #     f"Sentence: \"{text}\"\nAnswer:"
        # )
        #few-shot
        prompt = (
            "Determine if the following sentence uses confirmshaming (i.e., guilt-tripping users for not taking an action).\n"
            "Reply only with a single number: 1 (if it uses confirmshaming) or 0 (if it does not).\n"
            "Example:"
            "Sentence: \"No thanks, I don't like saving money\""
            "Answer: 1"
            "Sentence: \"No, I will shop with no discount\""
            "Answer: 1"
            "Sentence: \"Click below to cancel your subscription. Are you sure?\""
            "Answer: 0"
            "Sentence: \"You're about to cancel your subscription. Please confirm\""
            "Answer: 0"
            f"Sentence: \"{text}\"\nAnswer:"
        )
        try:
            response = client.messages.create(
                model="claude-3-opus-20240229",  # 可换成 haiku/sonnet
                max_tokens=5,
                temperature=0.0,
                messages=[{"role": "user", "content": prompt}]
            )
            print("RAW RESPONSE:", response)

            answer = response.content[0].text.strip()
            if answer.startswith("1"):
                preds.append(1)
            elif answer.startswith("0"):
                preds.append(0)
            else:
                print(f"⚠️ Unexpected Claude answer: '{answer}', defaulting to 0")
                preds.append(0)
        except Exception as e:
            print(f"❌ Claude error on \"{text}\": {e}")
            preds.append(0)
    return preds
# ========= Gemini 模型（伪实现） =========
def run_deepseek(texts):
    api_key = "sk-6544155bf944419ab129697bf6c84ff3"
    openai.api_key = api_key
    openai.api_base = "https://api.deepseek.com/v1"  # DeepSeek 专用 endpoint

    model = "deepseek-chat"  # 可换成其他支持的模型

    preds = []
    for text in texts:
        prompt = (
            "Determine if the following sentence uses confirmshaming (i.e., guilt-tripping users for not taking an action).\n"
            "Reply only with a single number: 1 (if it uses confirmshaming) or 0 (if it does not).\n"
            "Example:"
            "Sentence: \"No thanks, I don't like saving money\""
            "Answer: 1"
            "Sentence: \"No, I will shop with no discount\""
            "Answer: 1"
            "Sentence: \"Click below to cancel your subscription. Are you sure?\""
            "Answer: 0"
            "Sentence: \"You're about to cancel your subscription. Please confirm\""
            "Answer: 0"
            f"Sentence: \"{text}\"\nAnswer:"
        )
        try:
            response = openai.ChatCompletion.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=5,
                temperature=0.0,
            )
            answer = response["choices"][0]["message"]["content"].strip()
            print("RAW RESPONSE:", answer)

            if answer.startswith("1"):
                preds.append(1)
            elif answer.startswith("0"):
                preds.append(0)
            else:
                print(f"⚠️ Unexpected DeepSeek answer: '{answer}', defaulting to 0")
                preds.append(0)
        except Exception as e:
            print(f"❌ DeepSeek error on \"{text}\": {e}")
            preds.append(0)

    return preds
def run_gemini(texts):
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("Please set your GOOGLE_API_KEY environment variable.")
    
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-pro")

    preds = []
    for text in texts:
        prompt = (
            "Task: Determine if the following sentence uses confirmshaming.\n"
            "Reply only with '1' if it does, or '0' if it does not.\n\n"
            f"Sentence: \"{text}\"\nAnswer:"
        )
        try:
            response = model.generate_content(prompt)
            answer = response.text.strip()
            if answer.startswith("1"):
                preds.append(1)
            elif answer.startswith("0"):
                preds.append(0)
            else:
                print(f"⚠️ Unexpected answer: {answer}, defaulting to 0")
                preds.append(0)
        except Exception as e:
            print(f"❌ Error on: \"{text}\": {e}")
            preds.append(0)
    return preds
# ========= 评估函数 =========
def evaluate(preds, labels):
    print(classification_report(labels, preds, digits=3))

# ========= 主函数 =========
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=str, choices=["huggingface", "gemini", "claude", "deepseek"], required=True, help="Which model to evaluate.")
    args = parser.parse_args()

    texts, labels = load_data()

    if args.model == "huggingface":
        print("Running HuggingFace model...")
        preds = run_huggingface(texts)
    elif args.model == "gemini":
        print("Running Gemini model...")
        preds = run_gemini(texts)
    elif args.model == "claude":
        print("Running Claude model...")
        preds = run_claude(texts)
    elif args.model == "deepseek":
        print("Running Deepseek model...")
        preds = run_deepseek(texts)
    else:
        raise ValueError("Unsupported model.")

    evaluate(preds, labels)

if __name__ == "__main__":
    main()
