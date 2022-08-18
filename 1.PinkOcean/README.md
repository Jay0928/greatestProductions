## 一.使用rollup打包工具
```
> 1.npm init -y
> 2.npm install rollup @babel/core rollup-plugin-babel @babel/preset-env rollup-plugin-node-resolve -D
> 3.rollup.config.js
> 4."dev": "rollup -c -w"
```

## 二.Vue的初始化流程

> 1.`new Vue({})`
> 2.调用`init`，初始化数据，将数据挂载到`$options`,通过`vm.$options`访问
> 3.