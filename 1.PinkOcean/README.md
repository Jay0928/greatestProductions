## 一.使用rollup打包工具
```
> 1.npm init -y
> 2.npm install rollup @babel/core rollup-plugin-babel @babel/preset-env rollup-plugin-node-resolve -D
> 3.rollup.config.js
> 4."dev": "rollup -c -w"
```

## 二.Vue的初渲染流程

1.new Vue({})  
2.调用`init`，初始化数据，将数据挂载到`$options`,通过`vm.$options`访问  
3.观测数据变化，对象（递归使用的defineProperty），数组（方法重写）
- 如果更新对象不存在的属性，会导致视图不更新，如果是数组更新索引和长度不会触发更新
- 如果替换成一个新对象，对象将会进行劫持；数组可通过7个方法、$set进行劫持
- 通过__ob__进行标识这个对象监听过（vue被监控过的对象身上都有一个__ob__这个属性）
- 如果你就想改索引，可以使用$set：内部是splice()

4.将数据代理到vm对象上 vm.xx => vm._data.xx  
5.判断用户是否传入了el 属性 ， 内部会调用$mount方法，此方法也可以用户自己调用 
- `new Vue({el}) || new Vue().$mount() || new Vue({render(){}})`

6.对模版的优先级处理，render -> template -> outerHTML
7.将模版编译成ast语法树 -> 解析ast语法树生成codegen字符串 -> render函数  
8.通过render函数 生成虚拟dom + 真实数据 => 真实dom
9.根据虚拟节点渲染真实节点 (替换节点：先将虚拟节点变成真实节点，再删除旧节点) 

## 三.Vue的更新流程
10.Vue只有根组件的情况，每个属性都有一个dep  
- Vue用了观察者模式，默认组件渲染的时候，会创建一个watcher（并渲染视图），
- 当渲染视图时候，取data中的数据，会走每个属性的get方法，让属性dep记录watcher
- 同时让dep也记住watcher，dep和watcher是多对多的关系，一个属性对应多个视图,一个视图对应多个属性 
- 如果数据发生变化，会通知对应属性的dep，依次通知存放的watcher去更新
11.异步更新（等待全部数据执行完，去重，依次更新）
- 队列push、一次微任务Promise.resolve().then()

12.数组依赖收集  
13.mixin和生命周期  

14.diff算法
