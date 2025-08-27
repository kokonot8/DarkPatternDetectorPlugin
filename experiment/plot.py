import matplotlib.pyplot as plt
import numpy as np

# 数据
types = ['Preselection', 'Disguised Ads', 'Confirmshaming']
precision = [100.0, 66.67, 100.0]
recall = [66.67, 66.67, 66.67]
f1 = [80.0, 66.67, 80.0]

x = np.arange(len(types))
width = 0.25

# 绘图
fig, ax = plt.subplots(figsize=(8,5))
ax.bar(x - width, precision, width, label='Precision')
ax.bar(x, recall, width, label='Recall')
ax.bar(x + width, f1, width, label='F1 Score')

# 标签与图例
ax.set_ylabel('Score (%)')
ax.set_title('Dark Pattern Detection Performance by Type')
ax.set_xticks(x)
ax.set_xticklabels(types)
ax.set_ylim(0, 110)
ax.legend()

plt.tight_layout()
plt.show()
