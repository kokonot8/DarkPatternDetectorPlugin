import pandas as pd

# 读取TSV文件
df = pd.read_csv(r'C:\Users\kokon\Downloads\dataset.tsv', sep='\t', encoding='utf-8')

# 筛选Pattern Category为"Misdirection"的数据
misdirection_df = df[df['Pattern Category'] == 'Misdirection']

# 将筛选后的数据保存为CSV文件
misdirection_df.to_csv('misdirection_data.csv', index=False)

print(f"已找到 {len(misdirection_df)} 条Misdirection数据并保存到 misdirection_data.csv")