---
title: c++ 语法
categories:
  - 编程语言
  - c++
---
# c++ 语法

## using

C++ 中的 `using` 关键字有多种用途，下面分别介绍它在不同场景下的用法：

------

### 1. **引入命名空间中的名称**

最常见的用法是简化命名空间中的名称访问：

```cpp
#include <iostream>
using namespace std;  // 引入 std 命名空间

int main() {
    cout << "Hello, world!" << endl;
    return 0;
}
```

也可以只引入某个特定的名称，避免引入整个命名空间：

```cpp
using std::cout;
using std::endl;
```

------

### 2. **类型别名**

C++11 起。

`using` 可以用来定义类型别名，是 `typedef` 的现代替代语法：

```cpp
using uint = unsigned int;

// 更复杂的情况，比如函数指针：
using Func = void(*)(int);
```

用 `typedef` 声明函数指针、模板类型时语法很绕，`using` 则更像是变量的赋值，**可读性更高**。

```cpp
// typedef 方式：
typedef void (*FuncPtr)(int, double);

// using 方式：
using FuncPtr = void(*)(int, double);
```

------

### 3. **模板别名**

C++11 起。

配合模板使用：

```cpp
template<typename T>
using Vec = std::vector<T>;

Vec<int> v;  // 相当于 std::vector<int> v;
```

------

### 4. **在派生类中引入基类成员**

当派生类隐藏了基类的重载成员函数（父类的构造/析构函数也会被隐藏）时，可以用 `using` 显式引入：

```cpp
struct Base {
    void func(int) {}
    void func(double) {}
};

struct Derived : Base {
    using Base::func;  // 引入 Base 的所有 func 重载
    void func(char) {}
};
```

------

### 5. **在命名空间中引入另一个命名空间的名字**

```cpp
namespace A {
    void func() {}
}

namespace B {
    using A::func;  // 引入 A 中的 func 到 B
}
```



## decltype

`decltype` 是 C++11 引入的关键字，用于**在编译时推导表达式的类型**。可以理解为：你写一个表达式，编译器告诉你它的类型是什么，然后你就可以用这个类型来声明变量、函数返回值、模板等。

`decltype` 是关键字，不是通过某个「实现机制」来运行的代码，而是由编译器在编译阶段完成的**语义分析功能**。

基本用法：

```cpp
int x = 42;
decltype(x) y = x;  // y 的类型就是 int
```

也可以用于更复杂的表达式：

```cpp
int a = 1;
double b = 2.5;

decltype(a + b) c;  // c 的类型是 double，因为 a + b 是 double
```

------

### 注意：引用和 const 的推导

`decltype` 会保留 **引用性** 和 **const 限定**，区别于 `auto`。

```cpp
int x = 10;
int& rx = x;
const int cx = 20;

decltype(x) a = 1;     // int
decltype(rx) b = x;    // int&（引用）
decltype(cx) d = 2;    // const int
```

------

### 和 auto 的区别

| 特性             | `auto`              | `decltype`      |
| ---------------- | ------------------- | --------------- |
| 推导变量类型     | ✅                   | ✅               |
| 保留引用 / const | ❌（默认去掉）       | ✅（保留）       |
| 可用于表达式推导 | ❌（只能用在初始化） | ✅（任意表达式） |

------

### 配合 decltype(auto)

C++14 起。

```cpp
int x = 10;
int& get() { return x; }

decltype(auto) y = get();  // y 是 int&，因为 decltype(auto) 保留引用
```

------

### 🚧 小陷阱（经典）

```cpp
int x = 0;
decltype((x)) y = x;  // 注意：((x)) 是一个左值（可取地址），所以 y 是 int&
decltype(x) z = x;    // x 是一个变量名，z 是 int
```

多一个括号，就变成了左值表达式导致推导成引用！

* C++ 中只有不带括号的变量名会被 `decltype` 特殊处理，推导为裸类型（不带引用）；
* 其它所有表达式，无论加不加括号，`decltype` 都会根据表达式的值类别返回对应的类型（可能带引用）。



## __builtin

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

