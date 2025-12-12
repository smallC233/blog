---
Google Benchmark 学习笔记
---
# Google Benchmark 学习笔记

## 函数格式

```cpp
#include <benchmark/benchmark.h>

static void BM_StringCreation(benchmark::State& state) {
    for (auto _ : state) {
        std::string s("hello");
    }
}

// 注册
BENCHMARK(BM_StringCreation);

BENCHMARK_MAIN();
```

* 和 go 的 benchmark 不同，Google Benchmark 对函数名没有任何要求，只是官方示例喜欢用 `BM_` 开头来表示 “BenchMark”。
* 形参一定要写 `benchmark::State& state`，其作用和 go 的 `b *testing.B` 类似，是整个基准测试框架的“入口”和“控制器”。
* `BENCHMARK(BM_StringCreation)` 相当于注册一个基准测试，能够让 runner 看到它、执行它。
* `BENCHMARK_MAIN()`：生成一个主函数 main()，不再需要要自己写 main()，程序会自动找到所有 `BENCHMARK()` 注册过的函数并运行。



## 编译

编译命令：

```bash
g++ benchmark.cpp -lbenchmark -lbenchmark_main -pthread -o benchmark
```

* -lbenchmark:

  * 链接 Google Benchmark 核心库

  - 提供 BENCHMARK() 宏、benchmark::State 等核心功能

* -lbenchmark_main
  
  * 链接 Google Benchmark 主函数库
  * 提供 main() 入口，使用后无需手动写 main()，只需定义 BENCHMARK() 即可
  * 自动处理命令行参数（如 --benchmark_filter、--benchmark_repetitions）
* -pthread：
  
  - Google Benchmark 是多线程的，需要启用线程支持

使用静态链接编译：

上面的动态链接没有使用到你想要的版本时就可以使用静态链接

```bash
g++ bench.cpp -L/usr/local/lib -lbenchmark -lbenchmark_main -lpthread -o bench
```

* 我的 Release 版本安装在 /usr/local/lib
* 我的 DEBUG 版本安装在 /usr/local/lib/benchmark-debug 

也可以让 ai 帮忙安装环境，实现动态链接选择 Release 版本，同时也可以静态链接选择 DEBUG 版本



## 输出内存

我们可以重载全局的 new 操作符来“偷听”内存分配。

```cpp
// 1. 定义一个全局计数器
static size_t g_alloc_bytes = 0;

// 2. 重载全局 new
void* operator new(size_t size) {
    g_alloc_bytes += size;  // 记录分配量
    return malloc(size);
}

// 3. 最佳实践：一旦重载了 new，必须成对重载 delete，虽然这里不统计释放
void operator delete(void* ptr) noexcept {
    free(ptr);
}
// C++14/17 需要对应的 sized delete
void operator delete(void* ptr, size_t) noexcept {
    free(ptr);
}

static void BM_VectorGrowth(benchmark::State& state) {
    for (auto _ : state) {
        // 在循环开始前记录当前的全局分配量
        size_t start_bytes = g_alloc_bytes;

        std::vector<int> v;
        for (int i = 0; i < 1024; ++i) {
            v.push_back(i);
        }
        // 计算本轮循环增加了多少分配
        size_t allocated_in_loop = g_alloc_bytes - start_bytes;

        // 记录到计数器中
        // 注意：这里我们想看的是“每次循环分配了多少”，所以不需要除以 iterations
        // 库会自动处理累加，我们需要指定 kAvg 来取平均
        state.counters["Alloc"] =
            benchmark::Counter(allocated_in_loop, benchmark::Counter::kAvgThreads);
    }
}

BENCHMARK(BM_VectorGrowth);
BENCHMARK_MAIN();
```



## 输出字段解释

```bash
------------------------------------------------------------
Benchmark                  Time             CPU   Iterations
------------------------------------------------------------
BM_StringCreation       24.5 ns         26.7 ns     26433298
```

| 字段           | 含义                                   |
| -------------- | -------------------------------------- |
| **Benchmark**  | 基准测试名称（你注册的函数名）         |
| **Time**       | wall time（真实时间）                  |
| **CPU**        | CPU time（排除了调度、等待、休眠等）   |
| **Iterations** | 框架为了达到稳定统计结果而跑的迭代次数 |



## benchmark::State& state 相关成员变量/函数

* 自动调整迭代次数直到达到稳定结果
    ```go
    for (auto _ : state) {
    	foo();
    }
    ```

* 计时控制

    ```go
    state.PauseTiming();
    // 准备数据，不计入耗时
    state.ResumeTiming();
    
    // 这里才是被测部分
    work();
    ```



## 防止编译器优化

如果你计算了一个结果但没使用它，编译器可能会直接把代码删掉（Dead Code Elimination），导致测试结果为 0ns。

**错误示范：**

```cpp
static void BM_WithoutDoNotOptimize(benchmark::State& state) {
    for (auto _ : state) {
        int sum = 0;
        // 这是一个耗时操作，循环 100000 次
        for (int i = 0; i < 100000; ++i) {
            sum += i;
        }
        // sum 没人用，编译器认为上面那个循环是废话，直接删了
    }
}
BENCHMARK(BM_WithoutDoNotOptimize);
```

**正确做法：**
使用 benchmark::DoNotOptimize(...)。

```cpp
static void BM_WithDoNotOptimize(benchmark::State& state) {
    for (auto _ : state) {
        int sum = 0;
        for (int i = 0; i < 100000; ++i) {
            sum += i;
        }
        // 强制编译器：虽然我不打印 sum，但请假装我要用它，不要把上面的代码删了
        benchmark::DoNotOptimize(sum);
    }
}
BENCHMARK(BM_WithDoNotOptimize);
```

结果：

```bash
------------------------------------------------------------------
Benchmark                        Time             CPU   Iterations
------------------------------------------------------------------
BM_WithoutDoNotOptimize      0.000 ns        0.000 ns   1000000000
BM_WithDoNotOptimize         21134 ns        23055 ns        30266
```



## 传入参数

```cpp
static void BM_VectorPushBack(benchmark::State& state) {
    int size = state.range(0);  // state.range(0) 获取传入的第一个参数

    for (auto _ : state) {
        std::vector<int> v;
        v.reserve(size);
        for (int i = 0; i < size; ++i) {
            v.push_back(i);
        }
        benchmark::DoNotOptimize(v.data());
    }
}

// 注册时指定参数范围
// Arg(100) -> 传参 100
// Range(8, 8<<10) -> 自动生成 8, 64, 512, 4096... 等 2 的幂次
BENCHMARK(BM_VectorPushBack)->Range(8, 8 << 10);
```

```bash
-----------------------------------------------------------------
Benchmark                       Time             CPU   Iterations
-----------------------------------------------------------------
BM_VectorPushBack/7          32.2 ns         32.2 ns     21819605
BM_VectorPushBack/8          34.7 ns         34.7 ns     20381311
BM_VectorPushBack/64          139 ns          139 ns      5013152
BM_VectorPushBack/512         976 ns          976 ns       710165
BM_VectorPushBack/4096       7437 ns         7437 ns        93041
BM_VectorPushBack/8192      14870 ns        14870 ns        47214
```



### 和输出内存搭配示例

```cpp
#include <benchmark/benchmark.h>

#include <new>
#include <vector>

// 1. 定义一个全局计数器
static size_t g_alloc_bytes = 0;

// 2. 重载全局 new
void* operator new(size_t size) {
    g_alloc_bytes += size;  // 记录分配量
    return malloc(size);
}

// 3. 最佳实践：一旦重载了 new，必须成对重载 delete，虽然这里不统计释放
void operator delete(void* ptr) noexcept {
    free(ptr);
}
// C++14/17 需要对应的 sized delete
void operator delete(void* ptr, size_t) noexcept {
    free(ptr);
}

static void BM_VectorPushBack(benchmark::State& state) {
    int size = state.range(0);
    size_t total_allocated = 0;

    for (auto _ : state) {
        size_t before = g_alloc_bytes;

        std::vector<int> v;
        v.reserve(size);
        for (int i = 0; i < size; ++i) {
            v.push_back(i);
        }
        benchmark::DoNotOptimize(v.data());

        // 记录这次迭代的分配量
        total_allocated += (g_alloc_bytes - before);
    }

    // 报告平均每次迭代的分配量（单位：字节）
    state.counters["AllocPerIter"] = benchmark::Counter(
        static_cast<double>(total_allocated) / state.iterations(), benchmark::Counter::kDefaults);
}

BENCHMARK(BM_VectorPushBack)->Range(8, 8 << 10);

BENCHMARK_MAIN();
```













