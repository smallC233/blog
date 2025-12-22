---
title: Docker
categories:
  - 工具使用
---

# Docker

## Docker 安装

Agent 花了一上午也没装好，只能自己动手了。

失败的原因很简单，没网，Docker 需要和 git 一样手动配置 proxy，ai 并没有成功发现这一点😂（我的环境是 WSL2，vpn 由主机穿透给 WSL）

Docker 安装见这个博客：[快速安装Docker及配置及Docker配置、Docker常用命令。_Docker_LoganJin](https://www.loganjin.cn/article/docker-install/) 。

Docker 拉取不了镜像见这个博客：[Docker镜像拉取失败解决方案_docker拉取镜像失败-CSDN博客](https://blog.csdn.net/qq_46302361/article/details/140813753) ，我照着它配了 `prxy.conf` 就好了。

* 要是在执行上面那个博客时发现 `vim` 保存不了，见这个博客：[安装docker过程报错：“docker/daemon.json“ E212: 无法打开并写入文件”_daemon.json" e212: 无法打开并写入文件-CSDN博客](https://blog.csdn.net/Relief_1619/article/details/108951986) ，说简单点就是提前建好文件夹，再保存文件，就算是 `sudo vim` 可能也创建不了某些路径下的文件夹。

