---
title: make
categories:
  - 工具使用
---

# make

当我们需要编译一个文件的时候可以直接

```bash
g++ main.cpp -o main
```

但在一个工程中，往往需要成百上千的文件需要编译链接，这时候就需要使用 make/cmake 等工具来自动生成目标文件了。



## 使用 make

直接在命令行中输入

```bash
make
```

make 就会自动根据当前目录下的 `makefile` 文件来构建目标文件。



## makefile 语法

### 基本语法

```makefile
[目标文件]: [依赖文件]
	[要执行的命令]
```

例如：

```makefile
hello: main.cpp message.cpp
	g++ main.cpp message.cpp -o hello # 注意：makefile 中，缩进必须使用 tab 而不能使用空格。
```

这样，当 `main.cpp` 和 `message.cpp` 中的任意一个文件发生修改时，调用 `make` 都会重新执行 `g++ main.cpp message.cpp -o hello` 。



此时我们会发现，任意一个文件发生改变都有重新编译整个项目非常愚蠢，所以我们实际操作是把编译和连接的步骤分开，当任意文件发生改变时，只编译发生改变的文件，最后再把所有文件连接一下就能得到目标文件：

```makefile
hello: main.o message.o
	g++ main.o message.o -o hello
	
main.o: main.cpp
	g++ -c main.cpp
	
message.o: message.cpp
	g++ -c message.cpp
```



### 伪目标

**伪目标**（phony targets） 是指那些并不代表实际文件的目标。它们通常用来执行某些命令，比如清理编译结果、测试、安装等。

































