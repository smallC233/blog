---
title: gcd
---
# GCD

## 性质

1. gcd(a,b) = gcd(a, a + b) = gcd(a, ka + b)

2. gcd(ka, kb) = k · gcd(a, b)

3. 定义多个整数的最大公约数：gcd(a, b, c) = gcd(gcd(a, b), c)

4. 若 gcd(a, b) = d，则 gcd(a / d, b / d) = 1，即 a / d 与 b / d 互素。

# LCM

## 和 GCD 的关系

设: $a = p_1^{c_1}·p_2^{c_2}\dots\ ·p_m^{c_m}$ ，

​    $b = p_1^{f_1}·p_2^{f_2}\dots\ ·p_m^{f_m}$

那么：$gcd(a, b) = p_1^{min(c_1, f_1)}·p_2^{min(c_2, f_2)}\dots\ ·p_m^{min(c_m, f_m)}$

​     $lcm(a, b) = p_1^{max(c_1, f_1)}·p_2^{max(c_2, f_2)}\dots\ ·p_m^{max(c_m, f_m)}$

推出：$gcd(a, b) * lcm(a, b) = a * b$

即：  $lcm(a, b) = a * b / gcd(a, b) = a / gcd(a, b) * b$

注意**先做除法**再做乘法，如果先做乘法可能会溢出。



## 多个整数 LCM

$lcm(a, b, c) = \frac{a · b · c}{gcd(a, b, c)}$