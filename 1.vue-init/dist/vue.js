(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

    const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // {{   xxx  }}  

    function genProps(attrs) {
      // {key:value,key:value,}
      let str = '';

      for (let i = 0; i < attrs.length; i++) {
        let attr = attrs[i];

        if (attr.name === 'style') {
          // {name:id,value:'app'}
          let styles = {};
          attr.value.replace(/([^;:]+):([^;:]+)/g, function () {
            styles[arguments[1]] = arguments[2];
          });
          attr.value = styles;
        }

        str += `${attr.name}:${JSON.stringify(attr.value)},`;
      }

      return `{${str.slice(0, -1)}}`;
    }

    function gen(el) {
      if (el.type == 1) {
        return generate(el); // 如果是元素就递归的生成
      } else {
        let text = el.text; // {{}}

        if (!defaultTagRE.test(text)) return `_v('${text}')`; // 说明就是普通文本
        // 说明有表达式 我需要 做一个表达式和普通值的拼接 ['aaaa',_s(name),'bbb'].join('+)
        // _v('aaaa'+_s(name) + 'bbb')

        let lastIndex = defaultTagRE.lastIndex = 0;
        let tokens = []; // <div> aaa{{bbb}} aaa </div>

        let match; // ，每次匹配的时候 lastIndex 会自动向后移动

        while (match = defaultTagRE.exec(text)) {
          // 如果正则 + g 配合exec 就会有一个问题 lastIndex的问题
          let index = match.index;

          if (index > lastIndex) {
            tokens.push(JSON.stringify(text.slice(lastIndex, index)));
          }

          tokens.push(`_s(${match[1].trim()})`);
          lastIndex = index + match[0].length;
        }

        if (lastIndex < text.length) {
          tokens.push(JSON.stringify(text.slice(lastIndex)));
        }

        return `_v(${tokens.join('+')})`; // webpack 源码 css-loader  图片处理
      }
    }

    function genChildren(el) {
      let children = el.children;

      if (children) {
        return children.map(item => gen(item)).join(',');
      }

      return false;
    } // _c(div,{},c1,c2,c3,c4)


    function generate(ast) {
      let children = genChildren(ast);
      let code = `_c('${ast.tag}',${ast.attrs.length ? genProps(ast.attrs) : 'undefined'}${children ? `,${children}` : ''})`;
      return code;
    }

    const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`; // 匹配标签名的  aa-xxx

    const qnameCapture = `((?:${ncname}\\:)?${ncname})`; //  aa:aa-xxx  

    const startTagOpen = new RegExp(`^<${qnameCapture}`); //  此正则可以匹配到标签名 匹配到结果的第一个(索引第一个) [1]

    const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配标签结尾的 </div>  [1]

    const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // 匹配属性的
    // [1]属性的key   [3] || [4] ||[5] 属性的值  a=1  a='1'  a=""

    const startTagClose = /^\s*(\/?)>/; // 匹配标签结束的  />    > 
    // vue3的编译原理比vue2里好很多，没有这么多正则了

    function parserHTML(html) {
      // 可以不停的截取模板，直到把模板全部解析完毕 
      let stack = [];
      let root = null; // 我要构建父子关系  

      function createASTElement(tag, attrs, parent = null) {
        return {
          tag,
          type: 1,
          // 元素
          children: [],
          parent,
          attrs
        };
      }

      function start(tag, attrs) {
        // [div,p]
        // 遇到开始标签 就取栈中的最后一个作为父节点
        let parent = stack[stack.length - 1];
        let element = createASTElement(tag, attrs, parent);

        if (root == null) {
          // 说明当前节点就是根节点
          root = element;
        }

        if (parent) {
          element.parent = parent; // 跟新p的parent属性 指向parent

          parent.children.push(element);
        }

        stack.push(element);
      }

      function end(tagName) {
        let endTag = stack.pop();

        if (endTag.tag != tagName) {
          console.log('标签出错');
        }
      }

      function text(chars) {
        let parent = stack[stack.length - 1];
        chars = chars.replace(/\s/g, "");

        if (chars) {
          parent.children.push({
            type: 2,
            text: chars
          });
        }
      }

      function advance(len) {
        html = html.substring(len);
      }

      function parseStartTag() {
        const start = html.match(startTagOpen); // 4.30 继续

        if (start) {
          const match = {
            tagName: start[1],
            attrs: []
          };
          advance(start[0].length);
          let end;
          let attr;

          while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
            // 1要有属性 2，不能为开始的结束标签 <div>
            match.attrs.push({
              name: attr[1],
              value: attr[3] || attr[4] || attr[5]
            });
            advance(attr[0].length);
          } // <div id="app" a=1 b=2 >


          if (end) {
            advance(end[0].length);
          }

          return match;
        }

        return false;
      }

      while (html) {
        // 解析标签和文本   
        let index = html.indexOf('<');

        if (index == 0) {
          // 解析开始标签 并且把属性也解析出来  </div>
          const startTagMatch = parseStartTag();

          if (startTagMatch) {
            // 开始标签
            start(startTagMatch.tagName, startTagMatch.attrs);
            continue;
          }

          let endTagMatch;

          if (endTagMatch = html.match(endTag)) {
            // 结束标签
            end(endTagMatch[1]);
            advance(endTagMatch[0].length);
            continue;
          }
        } // 文本


        if (index > 0) {
          // 文本
          let chars = html.substring(0, index); //<div></div>

          text(chars);
          advance(chars.length);
        }
      }

      return root;
    } //  <div id="app">hello wolrd <span>hello</span></div> */}

    function compileToFunction(template) {
      // 1.将模板变成ast语法树
      let ast = parserHTML(template); // 代码优化 标记静态节点
      // 2.代码生成

      let code = generate(ast); //类似eval，模版引擎的实现原理都是 new Function + with

      let render = new Function(`with(this){return ${code}}`); //console.log(render.String())

      return render; // 1.编译原理
      // 2.响应式原理 依赖收集
      // 3.组件化开发 （贯穿了vue的流程）
      // 4.diff算法 
    }
    /**
     * 为什么使用with包裹
     * function anonymous() {
     *   with (this) { 
     *     return _c('div', { id: "app" }, _v(_s(message))) 
     *   }
     * }
     * vm._data = {message: 'hello'}
     * anonymous.call(vm._data)
     */

    function isFunction(val) {
      return typeof val == 'function';
    }
    function isObject(val) {
      return typeof val == 'object' && val !== null;
    }
    let isArray = Array.isArray;
    let callBacks = [];
    let waiting = false;

    function flushCallBacks() {
      callBacks.forEach(fn => fn());
      callBacks = [];
      waiting = false;
    }

    function nextTick(fn) {
      //VUE3的nextTick就是Promise,VUE2里面做了一些兼容性处理
      callBacks.push(fn);

      if (!waiting) {
        Promise.resolve().then(flushCallBacks);
        waiting = true;
      }
    }
    let strats = {}; //存放所有策略

    let lifeCycle = ["beforeCreate", "created", "beforeMount", "mounted"];
    lifeCycle.forEach(hook => {
      strats[hook] = function (parentVal, childValue) {
        if (childValue) {
          if (parentVal) {
            return parentVal.concat(childValue);
          } else {
            if (isArray(childValue)) {
              return childValue;
            } else {
              return [childValue];
            }
          }
        } else {
          return parentVal;
        }
      };
    });
    function mergeOptions(parentVal, childValue) {
      const options = {};

      for (let key in parentVal) {
        mergeFiled(key);
      }

      for (let key in childValue) {
        if (!parentVal.hasOwnProperty(key)) {
          mergeFiled(key);
        }
      }

      function mergeFiled(key) {
        //设计模式 策略模式
        let strat = strats[key];

        if (strat) {
          options[key] = strat(parentVal[key], childValue[key]); // 合并两个值
        } else {
          options[key] = childValue[key] || parentVal[key];
        }
      }

      return options;
    } // console.log(mergeOptions({a: 1}, {a:2,b:3}))

    function initGlobalAPI(Vue) {
      Vue.options = {}; //全局属性

      Vue.mixin = function (options) {
        this.options = mergeOptions(this.options, options);
        return this;
      };

      Vue.component = function (options) {};

      Vue.filter = function (options) {};

      Vue.directive = function (options) {};
    }

    function createElement(vm, tag, data = {}, ...children) {
      //返回虚拟节点
      return vnode(vm, tag, data, children, undefined, undefined);
    }
    function createText(vm, text) {
      //返回虚拟节点
      return vnode(vm, undefined, undefined, undefined, undefined, text);
    } // 看两个节点是不是相同节点，就看tag和key是否一样
    //vue2性能问题：递归比对

    function isSameVnode(newVnode, oldVnode) {
      return newVnode.tag === oldVnode.tag && newVnode.key === oldVnode.key;
    }

    function vnode(vm, tag, data, children, key, text) {
      return {
        vm,
        tag,
        data,
        children,
        key,
        text
      };
    } //vnode和ast的区别
    //ast 描述语法的，并没有用户自己的逻辑，只有语法解析出来的逻辑；
    //vnode 描述dom结构，可以自己去扩展

    function putch(oldVnode, vnode) {
      const isRealElement = oldVnode.nodeType;

      if (isRealElement) {
        // 删除老节点 根据vnode创建新节点，替换掉老节点
        const elm = createElm(vnode);
        const parentNode = oldVnode.parentNode;
        parentNode.insertBefore(elm, oldVnode.nextSibling);
        parentNode.removeChild(oldVnode);
        return elm; // 返回最新节点
      } else {
        // 不管怎么diff 最终想更新渲染 =》 dom操作里去
        // 只比较同级，如果不一样，儿子就不用比对了， 根据当前节点，创建儿子 全部替换掉 
        // diff 算法如何实现？
        if (!isSameVnode(oldVnode, vnode)) {
          // 如果新旧节点 不是同一个，删除老的换成新的
          return oldVnode.el.parentNode.replaceChild(createElm(vnode), oldVnode.el);
        } // 文本直接更新即可，因为文本没有儿子


        let el = vnode.el = oldVnode.el; // 复用节点

        if (!oldVnode.tag) {
          // 文本了, 一个是文本 那么另一个一定也是文本
          if (oldVnode.text !== vnode.text) {
            return el.textContent = vnode.text;
          }
        } // 元素  新的虚拟节点


        updateProperties(vnode, oldVnode.data); // 是相同节点了，复用节点，在更新不一样的地方 （属性）
        // 比较儿子节点

        let oldChildren = oldVnode.children || [];
        let newChildren = vnode.children || []; // 情况1 ：老的有儿子 ， 新没儿子

        if (oldChildren.length > 0 && newChildren.length == 0) {
          el.innerHTML = ''; // 新的有儿子 老的没儿子 直接将新的插入即可
        } else if (newChildren.length > 0 && oldChildren.length == 0) {
          newChildren.forEach(child => el.appendChild(createElm(child)));
        } else {
          // 新老都有儿子
          updateChildren(el, oldChildren, newChildren);
        }

        return el;
      }
    }

    function updateChildren(el, oldChildren, newChildren) {
      // vue2中 如何做的diff算法
      // vue内部做了优化 （能尽量提升性能，如果实在不行，在暴力比对）
      // 1.在列表中新增和删除的情况
      let oldStartIndex = 0;
      let oldStartVnode = oldChildren[0];
      let oldEndIndex = oldChildren.length - 1;
      let oldEndVnode = oldChildren[oldEndIndex];
      let newStartIndex = 0;
      let newStartVnode = newChildren[0];
      let newEndIndex = newChildren.length - 1;
      let newEndVnode = newChildren[newEndIndex];

      function makeKeyByIndex(children) {
        let map = {};
        children.forEach((item, index) => {
          map[item.key] = index;
        });
        return map;
      }

      let mapping = makeKeyByIndex(oldChildren); // diff算法的复杂度 是O(n)  比对的时候 指针交叉的时候 就是比对完成了

      while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
        if (!oldStartVnode) {
          // 在指针移动的时候 可能元素已经被移动走了，那就跳过这一项
          oldStartVnode = oldChildren[++oldStartIndex];
        } else if (!oldEndVnode) {
          oldEndVnode = oldChildren[--oldEndIndex];
        } else if (isSameVnode(oldStartVnode, newStartVnode)) {
          // 头头比较
          putch(oldStartVnode, newStartVnode); // 会递归比较子节点，同时比对这两个人的差异

          oldStartVnode = oldChildren[++oldStartIndex];
          newStartVnode = newChildren[++newStartIndex];
        } else if (isSameVnode(oldEndVnode, newEndVnode)) {
          // 尾尾比较
          putch(oldEndVnode, newEndVnode);
          oldEndVnode = oldChildren[--oldEndIndex];
          newEndVnode = newChildren[--newEndIndex];
        } else if (isSameVnode(oldStartVnode, newEndVnode)) {
          // 头尾
          putch(oldStartVnode, newEndVnode);
          el.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling);
          oldStartVnode = oldChildren[++oldStartIndex];
          newEndVnode = newChildren[--newEndIndex];
        } else if (isSameVnode(oldEndVnode, newStartVnode)) {
          // 尾头
          putch(oldEndVnode, newStartVnode);
          el.insertBefore(oldEndVnode.el, oldStartVnode.el); // 将尾部的插入到头部去

          oldEndVnode = oldChildren[--oldEndIndex];
          newStartVnode = newChildren[++newStartIndex];
        } else {
          // 之前的逻辑都是考虑 用户一些特殊情况，但是有非特殊的，乱序排
          let moveIndex = mapping[newStartVnode.key];

          if (moveIndex == undefined) {
            // 没有直接将节点插入到开头的前面
            el.insertBefore(createElm(newStartVnode), oldStartVnode.el);
          } else {
            // 有的话需要复用
            let moveVnode = oldChildren[moveIndex]; // 找到复用的那个人，将他移动到前面去

            putch(moveVnode, newStartVnode);
            el.insertBefore(moveVnode.el, oldStartVnode.el);
            oldChildren[moveIndex] = undefined; // 将移动的节点标记为空
          }

          newStartVnode = newChildren[++newStartIndex];
        }
      }

      if (newStartIndex <= newEndIndex) {
        // 新的多，那么就将多的插入进去即可
        // 如果下一个是null 就是appendChild
        let anchor = newChildren[newEndIndex + 1] == null ? null : newChildren[newEndIndex + 1].el; // 参照物是固定的

        for (let i = newStartIndex; i <= newEndIndex; i++) {
          // 看一下 当前尾节点的下一个元素是否存在，如果存在则是插入到下一个元素的前面
          // 这里可能是向前追加 可能是像后追加
          el.insertBefore(createElm(newChildren[i]), anchor);
        }
      }

      if (oldStartIndex <= oldEndIndex) {
        // 老的多余的  ,需要清理掉，直接删除即可
        for (let i = oldStartIndex; i <= oldEndIndex; i++) {
          let child = oldChildren[i]; // 因为child可能是undefined 所有要跳过空间点

          child && el.removeChild(child.el);
        }
      }
    }

    function createElm(vnode) {
      let {
        tag,
        data,
        children,
        text,
        vm
      } = vnode;

      if (typeof tag === 'string') {
        vnode.el = document.createElement(tag);
        updateProperties(vnode);
        children.forEach(child => {
          vnode.el.appendChild(createElm(child));
        });
      } else {
        vnode.el = document.createTextNode(text);
      }

      return vnode.el;
    }

    function updateProperties(vnode, oldProps = {}) {
      // 这里的逻辑 可能是初次渲染，初次渲染 直接 用oldProps 给vnode的el赋值即可
      // 更新逻辑 拿到老的props 和 vnode里面的data进行比对
      let el = vnode.el; // dom真实的节点

      let newProps = vnode.data || {}; // 新旧比对， 两个对象如何比对差异？

      let newStyle = newProps.style || {};
      let oldStyle = oldProps.style || {};

      for (let key in oldStyle) {
        // 老的样式有 新的没有，就把页面上的样式删除掉
        if (!newStyle[key]) {
          el.style[key] = '';
        }
      }

      for (let key in newProps) {
        //  直接用新的改掉老的就可以了
        // 如果前后一样，浏览器会去检测
        if (key == 'style') {
          for (let key in newStyle) {
            // {style:{color:red}}
            el.style[key] = newStyle[key];
          }
        } else {
          el.setAttribute(key, newProps[key]);
        }
      }

      for (let key in oldProps) {
        if (!newProps[key]) {
          el.removeAttribute(key);
        }
      }
    }

    let id$1 = 0;

    class Dep {
      constructor() {
        // 把Watcher放到dep上
        this.subs = [];
        this.id = id$1++;
      }

      depend() {
        //给Watcher加一个标识，防止重复
        // this.subs.push(Dep.target); //让dep记住这个watcher，watcher记住dep，相互关系
        Dep.target.addDep(this);
      }

      addSub(watcher) {
        this.subs.push(watcher); //让dep记住watcher
      }

      notify() {
        this.subs.forEach(watcher => watcher.update());
      }

    }

    Dep.target = null; //全局静态变量：window.target

    let queue = []; //队列，存放要更新的watcher

    let has = {}; //存放已有的watcher的id

    let pedding = false;

    function flushSchedulerQueue() {
      //beforeUpdate
      queue.forEach(watcher => watcher.run());
      queue = [];
      has = {};
      pedding = false;
    }

    function queueWatcher(watcher) {
      //一般情况下，写去重，可以采用这种方式，或者使用Set()
      let id = watcher.id;

      if (has[id] == null) {
        //去重：去掉重复的watcher
        has[id] = true;
        queue.push(watcher);

        if (!pedding) {
          //防抖，多次执行，只执行一次
          nextTick(flushSchedulerQueue);
          pedding = true;
        }
      }
    }

    let id = 0; //防止重复

    class Watcher {
      constructor(vm, fn, cb, options) {
        //dep放到Watcher中
        this.vm = vm;
        this.fn = fn;
        this.cb = cb;
        this.options = options;
        this.id = id++;
        this.depsId = new Set();
        this.deps = [];
        this.getter = fn; //页面渲染逻辑

        this.get(); //初始化
      }

      addDep(dep) {
        let did = dep.id;

        if (!this.depsId.has(did)) {
          this.depsId.add(did);
          this.deps.push(dep); //保存id，并让watcher记住dep

          dep.addSub(this);
        }
      }

      get() {
        Dep.target = this; //Dep.target = Watcher

        this.getter(); //页面渲染逻辑

        Dep.target = null; //渲染完成将标识清空，只有在渲染时候才会进行依赖收集
      }

      update() {
        //每次更新数据都会同步调用update，可以将更新的逻辑缓存起来，等会同步更新数据的逻辑执行完毕后，依次调用（去重）
        console.log("缓存次数");
        queueWatcher(this); //做异步更新vue.nextTick

        this.get();
      }

      run() {
        console.log("真正更新的次数");
        this.get();
      }

    }

    function mountComponent(vm) {
      //初始化流程
      let updateComponent = () => {
        vm._update(vm._render());
      };

      callhook(vm, 'beforeCreate'); //每个组件都有一个Watch（观察者）

      new Watcher(vm, updateComponent, () => {
        console.log("更新的钩子函数 Updata");
      });
      callhook(vm, 'mounted');
    }
    function leftCyleMixin(Vue) {
      Vue.prototype._update = function (vnode) {
        //先序深入遍历创建节点 ：遇到节点就创建节点，递归创建
        const vm = this; //第一次渲染是根据虚拟节点，生成真实节点，替换掉原来的节点
        //如果是第二次，生成新的虚拟节点和老的虚拟节点进行对比

        vm.$el = putch(vm.$el, vnode);
      };
    }
    function callhook(vm, hook) {
      let handlers = vm.$options[hook];
      handlers && handlers.forEach(fn => {
        fn.call(vm); //生命周期的this，永远指向实例
      });
    }

    let oldArrayPrototype = Array.prototype; // 获取数组的老的原型方法

    let arrayMethods = Object.create(oldArrayPrototype); // 让arrayMethods 通过__proto__ 能获取到数组的方法
    // arrayMethods.__proto__ == oldArrayPrototype
    // arrayMethods.push = function

    let methods = [// 只有这七个方法 可以导致数组发生变化
    'push', 'shift', 'pop', 'unshift', 'reverse', 'sort', 'splice'];
    methods.forEach(method => {
      arrayMethods[method] = function (...args) {
        // 数组新增的属性 要看一下是不是对象，如果是对象 继续进行劫持
        // 需要调用数组原生逻辑
        oldArrayPrototype[method].call(this, ...args); // todo... 可以添加自己逻辑 函数劫持 切片

        let inserted = null;
        let ob = this.__ob__;

        switch (method) {
          case 'splice':
            // 修改 删除  添加  arr.splice(0,0,100,200,300)
            inserted = args.slice(2); // splice方法从第三个参数起 是增添的新数据

            break;

          case 'push':
          case 'unshift':
            inserted = args; // 调用push 和 unshift 传递的参数就是新增的逻辑

            break;
        } // inserted[] 遍历数组 看一下它是否需要进行劫持


        if (inserted) ob.observeArray(inserted);
        ob.dep.notify();
      };
    }); // 属性的查找：是先找自己身上的，找不到去原型上查找

    // 2.每个原型上都有一个constructor属性 指向 函数本身 Function.prototype.constrcutr = Function

    class Observer {
      constructor(value) {
        // 不让__ob__ 被遍历到
        // value.__ob__ = this; // 我给对象和数组添加一个自定义属性
        this.dep = new Dep(); //给对象和数组本身增加dep属性 {}。__ob__.dep [].__ob__.dep

        Object.defineProperty(value, '__ob__', {
          value: this,
          enumerable: false // 标识这个属性不能被列举出来，不能被循环到

        });

        if (isArray(value)) {
          // 更改数组原型方法, 如果是数组 我就改写数组的原型链
          value.__proto__ = arrayMethods; // 重写数组的方法

          this.observeArray(value);
        } else {
          this.walk(value); // 核心就是循环对象
        }
      }

      observeArray(data) {
        // 递归遍历数组，对数组内部的对象再次重写 [[]]  [{}]
        // vm.arr[0].a = 100;
        // vm.arr[0] = 100;
        data.forEach(item => observe(item)); // 数组里面如果是引用类型那么是响应式的
      }

      walk(data) {
        Object.keys(data).forEach(key => {
          // 要使用defineProperty重新定义
          defineReactive(data, key, data[key]);
        });
      }

    }

    function dependArray(value) {
      for (let i = 0; i < value.length; i++) {
        let current = value[i];
        current.__ob__ && current.__ob__.dep.depend();

        if (Array.isArray(current)) {
          dependArray(current);
        }
      }
    } // vue2 应用了defineProperty需要一加载的时候 就进行递归操作，所以好性能，如果层次过深也会浪费性能
    // 1.性能优化的原则：
    // 1) 不要把所有的数据都放在data中，因为所有的数据都会增加get和set
    // 2) 不要写数据的时候 层次过深， 尽量扁平化数据 
    // 3) 不要频繁获取数据
    // 4) 如果数据不需要响应式 可以使用Object.freeze 冻结属性 


    function defineReactive(obj, key, value) {
      // vue2 慢的原因 主要在这个方法中
      let childOb = observe(value); // 递归进行观测数据，不管有多少层 我都进行defineProperty
      // childOb.dep //数组的dep

      let dep = new Dep(); //每隔属性都增加了dep
      // console.log('dep',dep)

      Object.defineProperty(obj, key, {
        get() {
          // 后续会有很多逻辑
          if (Dep.target) {
            dep.depend(); //属性依赖收集
          }

          if (childOb) {
            //取属性的时候，会对对应数组、对象本身进行依赖收集
            childOb.dep.depend(); //对象数组本身的依赖收集

            if (Array.isArray(value)) {
              dependArray(value);
            }
          }

          return value; // 闭包，次此value 会像上层的value进行查找
        },

        set(newValue) {
          // 如果设置的是一个对象那么会再次进行劫持
          if (newValue === value) return;
          observe(newValue);
          console.log('修改');
          value = newValue;
          dep.notify(); //拿到当前dep中的watcher，依次执行
        }

      });
    }

    function observe(value) {
      // 1.如果value不是对象，那么就不用观测了，说明写的有问题
      if (!isObject(value)) {
        return;
      }

      if (value.__ob__) {
        return; // 一个对象不需要重新被观测
      } // 需要对对象进行观测 （最外层必须是一个{} 不能是数组）
      // 如果一个数据已经被观测过了 ，就不要在进行观测了， 用类来实现，我观测过就增加一个标识 说明观测过了，在观测的时候 可以先检测是否观测过，如果观测过了就跳过检测


      return new Observer(value);
    }

    function proxy(vm, key, source) {
      // 取值的时候做代理，不是暴力的把_data 属性赋予给vm, 而且直接赋值会有命名冲突问题
      Object.defineProperty(vm, key, {
        get() {
          // ?
          return vm[source][key]; // vm._data.message 
        },

        set(newValue) {
          // ?
          vm[source][key] = newValue; // vm._data.message = newValue
        }

      });
    }

    function initState(vm) {
      const opts = vm.$options;

      if (opts.data) {
        initData(vm);
      }
    }

    function initData(vm) {
      let data = vm.$options.data; // 用户传入的数据

      data = vm._data = isFunction(data) ? data.call(vm) : data; // _data 已经是响应式的了
      // 需要将data变成响应式的 Object.defineProperty， 重写data中的所有属性

      observe(data); // 观测对象中的属性

      for (let key in data) {
        // vm.message => vm._data.message
        proxy(vm, key, '_data'); // 代理vm上的取值和设置值 和  vm._data 没关系了
      }
    }

    function initMixin(Vue) {
      Vue.prototype._init = function (options) {
        const vm = this;
        vm.$options = mergeOptions(vm.constructor.options, options);
        initState(vm);

        if (vm.$options.el) {
          // 要将数据挂载到页面上
          vm.$mount(vm.$options.el);
        }
      }; // new Vue({el}) new Vue().$mount


      Vue.prototype.$mount = function (el) {
        const vm = this;
        const opts = vm.$options;
        el = document.querySelector(el); // 获取真实的元素

        vm.$el = el; // 页面真实元素

        if (!opts.render) {
          // 模板编译
          let template = opts.template;

          if (!template) {
            template = el.outerHTML;
          }

          let render = compileToFunction(template);
          opts.render = render;
        } // console.log(opts.render)
        // 组件挂载(el, render)


        mountComponent(vm);
      };

      Vue.prototype.$nextTick = nextTick;
    }

    function renderMixin(Vue) {
      Vue.prototype._c = function () {
        //createElement 创建元素节点
        // console.log(arguments)
        const vm = this;
        return createElement(vm, ...arguments);
      };

      Vue.prototype._v = function (text) {
        //创建文本的虚拟节点
        // console.log(arguments)
        const vm = this;
        return createText(vm, text);
      };

      Vue.prototype._s = function (val) {
        //JSON.stringify()
        // console.log(arguments)
        if (isObject(val)) return JSON.stringify(val);
        return val;
      };

      Vue.prototype._render = function () {
        const vm = this; //vm中有所有的数据 vm.xxx => vm._data.xxx

        let {
          render
        } = vm.$options;
        let vnode = render.call(vm); //返回虚拟节点
        // console.log("vnode",vnode)

        return vnode;
      };
    }

    function Vue(options) {
      this._init(options); // 实现vue的初始化功能

    }

    initMixin(Vue); //render的扩展方法

    renderMixin(Vue); //真实节点

    leftCyleMixin(Vue); //渲染真实节点

    initGlobalAPI(Vue); //先生成一个虚拟节点

    let vm1 = new Vue({
      data() {
        return {
          name: 'zj'
        };
      }

    });
    let render1 = compileToFunction(`<div style="color:red;">
    <li key='a'>1</li>
    <li key='b'>2</li>
</div>`);
    let oldVnode = render1.call(vm1);
    let el1 = createElm(oldVnode);
    document.body.appendChild(el1); //再生成一个新的虚拟节点，patch

    let vm2 = new Vue({
      data() {
        return {
          name: 'zz'
        };
      }

    });
    let render2 = compileToFunction(`<div style="color:red;">
    <li key='1'>4</li>
    <li key='2'>5</li>
    <li key='3'>6</li>
</div>`);
    let newVnode = render2.call(vm2);
    setTimeout(() => {
      putch(oldVnode, newVnode); //比对虚拟节点的差异
    }, 1000);

    return Vue;

}));
//# sourceMappingURL=vue.js.map
