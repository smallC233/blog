---
title: DrissionPage
categories:
  - 爬虫
---
# DrissionPage

## 安装 && 升级

见官网：https://drissionpage.cn/get_start/installation



## 准备工作

### 切换浏览器

```python
from DrissionPage import ChromiumPage, ChromiumOptions


# 设置打开的浏览器
co = ChromiumOptions().set_paths(browser_path="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe")  # 填入浏览器路径
# 创建页面对象，并启动或接管浏览器
page = ChromiumPage(co) 
# get 方法会等待页面完全加载，再继续执行后面的代码
page.get('http://DrissionPage.cn')  # 填入打开的网页
```



## 操纵浏览器

### 查找元素

`ele()` 方法用于查找元素，它返回一个 ChromiumElement 对象，用于操作元素。`ele()`内置了等待，如果元素未加载，它会执行等待，直到元素出现或到达时限。默认超时时间 10 秒。

```python
# 定位到账号文本框，获取文本框元素, '#user_login' 是定位符文本，'#' 意思是按 id 属性查找元素。
ele = page.ele('#user_login')
# 输入对文本框输入账号, `input()` 方法用于对元素输入文本。
ele.input('您的账号')
# 定位到密码文本框并输入密码。
page.ele('#user_password').input('您的密码')
# 点击登录按钮，'@' 表示按属性名查找。
page.ele('@value=登 录').click()

'.' 表示按类名查找。
```



#### 相对查找

```python
ele = page.ele('#user_login')
ele.parent() # 获取父级元素
ele.child() # 获取直接子节点
ele.next() # 获取后面的同级节点
ele.prev() # 获取前面的同级节点
```





## 元素的成员变量和方法

`.text` 是元素的内容









