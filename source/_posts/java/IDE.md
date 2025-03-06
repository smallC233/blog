---
title: IDE
categories:
  - 编程语言
  - Java
---
# IDE

## IntelliJ IDEA

### 环境

IDEA 中默认的编辑和运行环境都是 utf-8。

`\t` 对齐至 4 位。



### 自动补全

psvm -> 

```java
public static void main(String[] args) {
	
}
```



sout -> 

```java
System.out.println();
```

{变量名}.sout ->

```java
System.out.println({变量名});
```



fori ->

```java
for (int i = 0; i < ; i++) {

}
```

（提供的位置：变量名，右边界，for 循环正文，按下回车切换到下一个位置）

{循环次数}.fori ->

```java
for (int i = 0; i < {循环次数}; i++) {
    
}
```

（提供的位置：变量名，for 循环正文）



在类中按下 Alt + [Fn] + Insert 即可召唤生成窗口，方便的生成类的构造函数以及 get, set 方法。



### 文件操作

#### 类：改名

1. 右键类 > Refactor > Rename

2. 点击类 > `shift` + `F6`

#### 项目：关闭

顶栏 > File > Close Project



### 快捷键

`ctrl + d` 向下复制当前行代码。

`alt + Enter + Enter` 按建议处理错误 / 警告语句。

`ctrl + alt + v` 给本行对象自动选择合适的容器并赋值。

`ctrl + alt + t` 把选中块放入 if / while / for / try 中。

`ctrl + p` 参数提示。



## VSCode

### 环境

vscode 中默认的编辑和运行环境都是 utf-8。

`\t` 对齐至 8 位。
