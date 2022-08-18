## 一.使用rollup打包工具
```
> 1.npm init -y
> 2.npm install rollup @babel/core rollup-plugin-babel @babel/preset-env rollup-plugin-node-resolve -D
> 3.rollup.config.js
> 4."dev": "rollup -c -w"
```

## 二.Vue的初始化流程

1.new Vue({})  
2.调用`init`，初始化数据，将数据挂载到`$options`,通过`vm.$options`访问  
3.观测数据变化，对象（递归使用的defineProperty），数组（方法重写）
- 如果更新对象不存在的属性，会导致视图不更新，如果是数组更新索引和长度不会触发更新
- 如果替换成一个新对象，对象将会进行劫持；数组可通过7个方法、$set进行劫持
- 通过__ob__进行标识这个对象监听过（vue被监控过的对象身上都有一个__ob__这个属性）
- 如果你就想改索引，可以使用$set：内部是splice()