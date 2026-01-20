---
title: git
categories:
  - 工具使用
---

# git

## 本地忽略规则 

打开仓库中的 `.git/info/exclude`

填写全局 ignore，规则语法完全等同 `.gitignore`

这样你就得到了只在本地生效的 `.gitignore`



## 只 clone 一个特定的仓库

**clone**

```shell
git clone -b main --single-branch https://github.com/user/repo.git
```

**后续切换**

```shell
git config remote.origin.fetch "+refs/heads/new_branch:refs/remotes/origin/new_branch"
git fetch
git switch -c new_branch origin/new_branch
```



## 合并冲突

**只保留当前**

```
git checkout --ours .
```



**只保留传入**

```
git checkout --theirs .
```



















