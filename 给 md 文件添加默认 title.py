# 如果 source 中的 md 文件不以 --- 开头，就添加文件名的 title

import os

# 定义要遍历的文件夹
posts_dir = "source/_posts"


# 遍历目录下所有的 .md 文件
for root, dirs, files in os.walk(posts_dir):
    for file in files:
        if file.endswith(".md"):
            file_path = os.path.join(root, file)
            
            # 读取文件内容
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            # 如果文件没有 YAML front-matter，添加一个
            if not lines or not lines[0].startswith('---'):
                # 提取文件名（去除扩展名）
                file_name = os.path.splitext(file)[0]
                
                # 创建新的内容，添加 title 和 YAML front-matter
                new_content = [
                    '---\n',
                    f'title: {file_name}\n',
                    '---\n',
                ] + lines
            
                # 写回修改后的内容
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.writelines(new_content)

print("所有文件的标题已更新并添加至开头！")
