---
title: c++ useful
---
##### __builtin 相关

```cpp
__builtin_clzll(0x34);     // 计数前导零 (count leading zero)  795ms   per 1e9 times 均摊 10x
__builtin_ctzll(0x34);     // 计数后继零 (count trailing zero) 403ms   per 1e9 times 均摊 2.5x 最优 10x
__builtin_popcount(0x34);  // 计数一的个数                     395ms   per 1e9 times 均摊 20x

// 运算并判断是否溢出
int a = 1e4, b = 1e6, c;
bool p = __builtin_mul_overflow(a, b, &c);
cout << p << " " << c << "\n";
// out: 1 1410065408

// 同理还有:
__builtin_add_overflow(a, b, &c)
```

