---
title: 穿透 WSL 的代理
categories:
  - 计算机基础知识
  - 代理
---
# 穿透 WSL 的代理

## 设置环境变量

主机的代理并不能直接穿透 wsl，因此我们需要第三方工具 `wsl-vpnkit` 来辅助。

首先我们需要在 wsl 中正确配置环境变量 `http_proxy` / `https_proxy` ，它们是控制 **HTTP/HTTPS 流量代理** 的环境变量。

可以用下面的命令查看当前相关的环境变量：

```shell
$ env | grep -i proxy
no_proxy=*.yooc.me,192.168.*,172.61.*,172.60.*,172.59.*,172.58.*,172.57.*,172.56.*,172.55.*,172.54.*,172.53.*,172.52.*,172.51.*,172.50.*,172.49.*,172.48.*,172.47.*,172.46.*,10.*,127.*,localhost
https_proxy=http://172.55.233.6:10809
NO_PROXY=*.yooc.me,192.168.*,172.61.*,172.60.*,172.59.*,172.58.*,172.57.*,172.56.*,172.55.*,172.54.*,172.53.*,172.52.*,172.51.*,172.50.*,172.49.*,172.48.*,172.47.*,172.46.*,10.*,127.*,localhost
HTTPS_PROXY=http://172.55.233.6:10809
HTTP_PROXY=http://172.55.233.6:10809
http_proxy=http://172.55.233.6:10809
```

`http_proxy` 正确的值应为：\<Windows 主机的 WSL 网关地址\>:\<vpn 监听的 http 端口\>

\<Windows 主机的 WSL 网关地址\> 不可填写回环地址 `127.0.0.1`，可用下面的命令查询应该填写的 Windows 主机的 WSL 网关地址：

```shell
$ cat /etc/resolv.conf | grep nameserver
nameserver 172.55.233.6
```

\<vpn 监听的 http 端口\> 可在自己的 vpn 中打开/查询，以 `v2ray` 为例：

设置→参数设置→本地socks监听端口  $\underline{\qquad 10808\qquad}$  http端口=socks端口+1

所以我的 `http_proxy` 正确的值应为：172.55.233.6:10809



设置环境变量，我们可以用 `export` 临时设置：

```shell
export http_proxy="http://172.55.233.6:10809"
export https_proxy="http://172.55.233.6:10809"
export HTTP_PROXY="http://172.55.233.6:10809"
export HTTPS_PROXY="http://172.55.233.6:10809"
```



或者修改 `~/.bashrc` 永久设置：

1. 打开配置文件

```shell
vim ~/.bashrc # 当用户启动交互式非登录 Shell（如打开终端、新标签页）时，系统会自动执行该文件中的命令。
```

2. 添加以下内容到文件末尾（按 `i` 进入插入模式，添加好内容后按 `Esc` 退出，回到普通模式）

```shell
export http_proxy="http://172.55.233.6:10809"
export https_proxy="http://172.55.233.6:10809"
export HTTP_PROXY="http://172.55.233.6:10809"
export HTTPS_PROXY="http://172.55.233.6:10809"
```

3. 保存并关闭（普通模式下 :wq!）
4. 让配置立即生效

```shell
source ~/.bashrc
```



## 安装 vpn-kit

打开该网页：[GitHub - sakai135/wsl-vpnkit: Provides network connectivity to WSL 2 when blocked by VPN](https://github.com/sakai135/wsl-vpnkit?tab=readme-ov-file) ，上面有安装的详细教程，简单来说第一种方式就是：从[这里](https://github.com/sakai135/wsl-vpnkit/releases/tag/v0.4.1)下载 `wsl-vpnkit.tar.gz`，下载好后打开 powershell，输入：

```shell
wsl --import wsl-vpnkit --version 2 $env:USERPROFILE\wsl-vpnkit wsl-vpnkit.tar.gz # $env:USERPROFILE 就是 C:\Users\<你的用户名>，你可以换成其它目录，但注意路径不要有空格，实在不行就把 wsl-vpnkit.tar.gz 丢到 C:\Users\<你的用户名> 里去，然后着一模一样的输入
```



## 运行

在 powershell 中输入：

```shell
wsl.exe -d wsl-vpnkit --cd /app wsl-vpnkit
```

就可以启动代理穿透工具了，之后在 wsl 中你就可以尝试 curl www.google.com 看看是不是真的可以访问外网。



不过这样每次启动都要自己手动运行一下，网页给出的第二种安装方法好像是自动的，但是我看不懂（

























