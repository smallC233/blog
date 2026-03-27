---
title: CLI-Proxy-API
categories:
  - AI
---

# CLI-Proxy-API

## 简介

**CLIProxyAPI** 是一个为 CLI 提供 OpenAI/Gemini/Claude/Codex 兼容 API 接口的代理服务器。

如果用的是 OAuth 登录，那相当于把 OAuth 变成了 API 用法，但过的是 plan 内的免费额度。

例如你可以把 GPT 等模型反代给 cc，方便使用 cc 的生态，或是多个模型共享 cc 的上下文。

也可以把 GPT 等模型反代给浏览器插件`沉浸式翻译`，不用充这个插件的会员就能使用 GPT 来进行网页翻译。



## 安装 && 配置

参考官方文档 [CLIProxyAPI](https://help.router-for.me/cn/)

简单说就是

1. 安装 CLIProxyAPI：[快速开始 | CLIProxyAPI](https://help.router-for.me/cn/introduction/quick-start.html)
2. 配置你拥有的模型/API 给 CLIProxyAPI：[Codex (OpenAI OAuth 登录): | CLIProxyAPI](https://help.router-for.me/cn/configuration/provider/codex.html)
3. 将 CLIProxyAPI 的 API 用到各个你需要的软件里，例如用到 cc 中：[Claude Code | CLIProxyAPI](https://help.router-for.me/cn/agent-client/claude-code.html) 。用法的本质就是 API 接口地址为 http://127.0.0.1:8317 ，APIKEY 为 CLIProxyAPI 内部生成的 key 。



## 启动

```shell
cd ~/cliproxyapi && ./cli-proxy-api
```



## Web UI

参考：[Web UI | CLIProxyAPI](https://help.router-for.me/cn/management/webui)

访问的是：http://localhost:8317/management.html

管理密钥得先在 `~/.cli-proxy-api/config.yaml` 中配置

```
remote-management:
  secret-key: "balabala114514"
```





























