---
title: useful
categories:
  - 编程语言
  - Java
---
# useful

## shuffle

```java
List<Integer> lis = Arrays.asList(2, 588, 888, 1000, 10000);
Collections.shuffle(lis);
```



## 生成随机数

```java
import java.util.Random;

// 创建一个Random对象
Random random = new Random();

// 生成一个 [0, 1) 的随机小数
double randomDouble = random.nextDouble();

// 生成一个指定范围内的随机整数，如下是 [0, 10)
int randomInt = random.nextInt(10);

// 下是 [1, 10]
int randomInt2 = random.nextInt(10) + 1;
```

