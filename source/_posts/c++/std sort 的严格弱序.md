---
title: std::sort 的严格弱序
categories:
  - 编程语言
  - c++
---

# std::sort 的严格弱序

当 std::sort 的 compare 函数不满足严格弱序约束时，sort 的运行就会发生不可预估的事情甚至 RE，因此，我们有必要了解 sort 的这一特性。

## 简单理解

**严格（strict）**意思是：

- 用的是 **`<`**，而不是 `<=`

**弱（weak）**意思是：

- **不是所有不同的元素都必须分出“谁大谁小”**
- 允许出现：
  - `a < b` 为 false
  - `b < a` 也为 false
  - 此时就把 `a` 和 `b` 当作**等价的一类**
- 等价关系成立不是 `==`，而是 `!comp(a,b) && !comp(b,a)`

## 具体说明

对任意元素 `a, b, c`，比较器 `cmp` 必须满足：

### 1. 不自反（Irreflexive）

不能有 `comp(a, a) == true`

也就是：任何元素都**不应该比自己更靠前**。

这条一旦破坏，`std::sort` 的内部逻辑会被你“骗”到，**很多实现会直接炸，导致 RE**。

### 2. 反对称（Asymmetric）

如果 `comp(a, b) == true`，那么必须有 `comp(b, a) == false`

* 你不能说 “a 在 b 前” 的前提下 “b 又在 a 前”。

但是我们可以存在 `comp(a, b) == false && comp(b, a) == false`

* 此时我们认为 `a, b` 是**等价类**

### 3. 传递性（Transitive）

如果 `comp(a, b)` 且 `comp(b, c)` 都为真，那么 `comp(a, c)` 必须为真

否则会出现循环：a < b < c < a，排序算法会陷入矛盾。

### 4. “等价类”的传递性（Strict Weak 的 "Weak"）

定义一个“等价”关系：

* `eq(a,b) := !comp(a,b) && !comp(b,a)`
* 意思是：既不认为 a<b，也不认为 b<a，那就当它们“等价”（同一组）
* 同时这也说明，如果我们想要表示两个元素是等价时，只需要让它们相互的比较结果都为 false 即可

要求：这个 `eq` 也得是传递的：

* 如果 `eq(a,b)` 且 `eq(b,c)`，必须 `eq(a,c)`。

这条常见于“你比较器只比较一部分字段”，但又掺杂不一致条件导致等价类乱套。



## 例子

### 危险的 <=

在重载类中出现 `<=` 在大部分情况都是危险的，因为它很可能破坏不自反性，例如新手可能会写出这样的 cmp 函数，其中的 `<=` 就能轻松让 sort 函数发生 RE 。 

```cpp
mt19937 rnd((unsigned int)chrono::steady_clock::now().time_since_epoch().count());

struct Node {
    int x;
    friend bool operator<(const Node &a, const Node &b) {
        return a.x <= b.x;      // RE
        // return a.x < b.x;       // AC
    }
};

void solve() {
    vector<Node> vec;
    const int n = 1e5;
    for (int i = 1; i <= n; i++) {
        vec.push_back({rnd() % 100 + 1});
    }
    sort(vec.begin(), vec.end());
    for (int i = 0; i < n; i++) {
        cout << vec[i].x << " ";
    }
    cout << endl;
}
```

所以，记得尽量在 sort 函数里使用 `<` 而非 `<=` 吧。



### 乘 0 && 除 0

对于这样一个结构体

```cpp
struct Node {
    int x, y;
};
```

比较的逻辑是 $\frac{a_i}{b_i} < \frac{a_j}{b_j}$，为了避免计算时的浮点问题，我们通常写成 $a_i * b_j < a_j * b_i$：

```cpp
bool operator<(const Node &a, const Node &b) {
    return a.x * b.y < b.x * a.y;
}
```

在 $1 \le a_i, b_i$ 的场景下，这种写法没有任何问题。

但假如现在 $0 \le a_i, b_i$ ，继续使用这种写法就会干爆 sort 函数：

* 当有一个 {0, 0} 的元素出现时，它和任何数比较的结果均为 `false`
* 根据定义，它会和任何数等价，sort 内部发生 UB
  * 可能 sort 会 RE
  * 可能所有元素乱序
  * 也可能 {0, 0} 以外的数字能被正常排序但 {0, 0} 会出现在任何地方
  * 反正会发生什么无法预知

```cpp
// WA
mt19937 rnd((unsigned int)chrono::steady_clock::now().time_since_epoch().count());

struct Node {
    int x, y;
    friend bool operator<(const Node &a, const Node &b) {
        return a.x * b.y < b.x * a.y;
    }
};

void solve() {
    vector<Node> vec;
    const int n = 1.8e3;
    for (int i = 1; i <= n; i++) {
        vec.push_back({rnd() % 10, rnd() % 10});
    }
    sort(vec.begin(), vec.end());
    for (int i = 0; i < n; i++) {
        cout << vec[i].x * 1.0 / vec[i].y << " ";
    }
}

```

![1](D:\Program Files (x86)\hexo\blog\source\assets\c++\pictrue\1.png)

一种正确的写法为：

```cpp
// AC
mt19937 rnd(
    (unsigned int)chrono::steady_clock::now().time_since_epoch().count());

struct Node {
    int x, y;
    friend bool operator<(const Node& a, const Node& b);
};

static int cls(const Node& t) {
    if (t.x == 0 && t.y == 0) return 0;  // (0,0)
    return 1;                            // normal
}

static bool cmp(const Node& a, const Node& b) {
    int ca = cls(a), cb = cls(b);
    if (ca != cb) return ca < cb;
    if (ca == 0 && cb == 0) {
        return false;
    }
    return a.x * b.y < b.x * a.y;
}

bool operator<(const Node& a, const Node& b) {
    return cmp(a, b);
}
```

此外，假如数据保证没有 {0, 0} 出现，那原本的判断程序就够满足严格弱序，但要注意：

* {0,  $y_1$} 和 {0, $y_2$}; {$x_1$, 0} 和 {$x_2$, 0} 在此判断程序下会被认为是等价的，但实际是否真等价需要注意，如果实际不等价而是有大小关系，则需要额外写特判。









