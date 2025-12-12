---
title: antigravity 部分网络问题经验
---
# antigravity 部分网络问题经验

## 登录网络问题

如果你网页 Google 登录验证完，回跳回软件里没有效果，那需要打开梯子的 TUN 模式（虚拟网卡模式），因为这个软件似乎不过系统代理。使用过程应该也要一直开着这个模式。

![1](..\..\assets\网络代理\picture\1.png)

如果提示账号地区不受支持（Your current account is not eligible for Antigravity, because it is not currently available in your location.），需要把谷歌账号改成中国以外的地区，网上有教程。



## 侧边栏 agent 网络问题

![2](..\..\assets\网络代理\picture\2.png)

如果打开的是 WSL 内的文件夹，那侧边栏 agent 过的是 WSL 内的网络，很神秘的设计，这时需要 WSL 内开梯子或者把梯子穿透给 WSL（可以参考：[穿透 WSL 的代理](https://smallc233.netlify.app/_posts/网络代理/穿透 wsl 的代理)。）或者干脆别在 WSL 里用（我这经常提示和 WSL 的连接断开要重启...）。

同理，要是你 ssh 连接了远程服务器，这个侧边栏 agent 应该会用你远程服务器的网，乐，希望之后能改的正常点。
