---
title: vscode
---
### F5 不能自动识别运行什么文件：

1. 进入 C:\Users\你的用户名\AppData\Roaming\Code\User\workspaceStorage。
1. 把 workspaceStorage 里面的东西删光光。
1. 成功！



### 不认识万能头（默认 compiler path 出错）：

1. （左上角）文件 > 首选项 > 设置 > 搜索 `Compiler Path` > 在 settings.json 中编辑 >  "C_Cpp.default.compilerPath": "g++"。



### 头文件预编译

1. 创建 {预编译文件名}.h 文件
2. 在 cmd 用 g++ 对其编译：g++ {预编译文件名}.h -o {预编译文件名}.gch [你平时的编译选项，如 `-g`]

3. 在 vscode 的 tasks.json 文件中配置预编译："args" 中加入：

```json
"-include",
"{you_path}\\{预编译文件名}"
```

