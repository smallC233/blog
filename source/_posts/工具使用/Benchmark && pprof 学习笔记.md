---
title: Benchmark && pprof 学习笔记
---
# Benchmark && pprof 学习笔记

Benchmark - 测量性能
* 作用: 告诉你"快不快"
* 输出: 3.302 ns/op, 48 B/op, 1 allocs/op
* 回答: "这个函数跑一次要多久？用了多少内存？"

pprof - 分析瓶颈
* 作用: 告诉你"为什么慢"
* 输出: 函数调用图、热点代码、内存分配位置
* 回答: "时间都花在哪里？内存在哪分配的？"

## Benchmark
* 函数以 Test 开头即被认定为单元测试函数
* 函数以 Benchmark 开头即被认定为基准测试函数
* 文件名必须以 `_test.go` 结尾

### 函数格式

```go
func BenchmarkFib(b *testing.B) {
	for n := 0; n < b.N; n++ {
		// 待测试代码
	}
}
```

### 运行方式

`go test` 运行所有单元测试

`go test -bench=.` 运行所有单元测试和基准测试

`go test -bench=. -run=^$` 只运行所有基准测试（运行名字为空的单元测试，但单元测试名字不能为空，所以单元测试什么都不运行）

`go test -bench=. -run=^$ -benchtime=3s` 指定测试时间

`go test -bench=. -run=^$ -benchtime=3s -cpuprofile=cpu.prof` 

* 运行 benchmark + pprof
* Go 的 testing 包内置了 profiling 支持：
    ```go
    // 当你运行 go test -cpuprofile=cpu.prof 时
    // Go 自动做了这些：
    
    func BenchmarkXXX(b *testing.B) {
        // 1. 开始 CPU profiling
        pprof.StartCPUProfile(file)
        
        // 2. 运行你的 benchmark
        b.ResetTimer()
        for i := 0; i < b.N; i++ {
            yourFunction()
        }
        
        // 3. 停止并保存 profiling 数据
        pprof.StopCPUProfile()
    }
    ```



### b *testing.B 相关成员函数/变量
* b.N：Go 自动调整的循环次数，如果函数运行足够快，下一次 go test 调用 BenchmarkFib 时，b.N 会自动增长。

* b.ResetTimer(): 重置计时器
    * 如果 Benchmark 有初始化开销，可以这样写：
    ```go
    setup()
    b.ResetTimer()
    
    for i := 0; i < b.N; i++ {
        target()
    }
    ```
    
* b.StopTimer() 和 b.StartTimer(): 手动控制计时代码区域
  
* b.ReportAllocs(): 输出内存分配统计
  
    * 让你看到：`128 B/op   3 allocs/op`



### 输出字段解释

```shell
BenchmarkTaBarssince_Small_Freq10-16     	 9175717	       413.4 ns/op	     896 B/op	       1 allocs/op
```

* -16：16线程
* 9175717：函数在规定时间内的运行次数
* 413.4 ns/op：单次操作耗时
* 896 B/op：每执行一次操作，会在堆上分配 896 字节的内存。
* 1 allocs/op：每次操作发生的堆分配次数
  * 内存分配越多说明越慢（频繁触发 GC）



## pprof

### 运行

`go test -bench=. -run=^$ -cpuprofile=cpu.prof` 

### 查看

`go tool pprof ./cpu.prof` 命令行交互查看 pprof 结果

`go tool pprof -http=:8888 ./cpu.prof` 

* 使用网页可视化查看 pprof 结果
* 使用端口为 8888

### Top 输出字段解释
输出形如：
| flat | flat% | sum% | cum | cum% | 函数 |
|------|-------|------|-----|------|------|
| 28.69s | 95.00% | 95.00% | 28.73s | 95.13% | chart-by-ta/chart_script/pine/src/functions.TaBarssince (inline) |
| 0.84s | 2.78% | 97.78% | 17.68s | 58.54% | chart-by-ta/chart_script/pine/src/functions/ta_barssince_perf.BenchmarkTaBarssince_Large_Random |
| 0.41s | 1.36% | 99.14% | 8.97s | 29.70% | chart-by-ta/chart_script/pine/src/functions/ta_barssince_perf.BenchmarkTaBarssince_Large_Freq100 |
| 0.20s | 0.66% | 99.80% | 3.53s | 11.69% | chart-by-ta/chart_script/pine/src/functions/ta_barssince_perf.BenchmarkTaBarssince_Large_Freq10 |
| 0 | 0% | 99.80% | 30.18s | 99.93% | testing.(*B).launch |
| 0 | 0% | 99.80% | 30.18s | 99.93% | testing.(*B).runN |

表头含义：
| 列名        | 含义                                           |
| --------- | -------------------------------------------- |
| **flat**  | 在该函数（不含其调用的子函数）中直接消耗的时间（或空间）                 |
| **flat%** | flat 所占总样本（或时间）百分比                           |
| **sum%**  | 从表格第一行到当前行所有 flat% 的累积百分比，用于快速判断前几行覆盖了多少整体负载 |
| **cum**   | 在该函数及其所有被调用（子）函数中消耗的时间（或空间）总和，即“累积”消耗        |
| **cum%**  | cum 所占总样本（或时间）百分比              |

flat 高 → 函数本身慢

cum 高 → 整个调用链慢
