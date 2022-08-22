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

    function putch(el, vnode) {
      const elm = createElm(vnode); //根据虚拟节点返回真实节点

      let parentNode = el.parentNode;
      parentNode.insertBefore(elm, el.nextSibling); //el.nextSibling不存在就是null, insertBefore就是appendChild

      parentNode.removeChild(el);
    }

    function createElm(vnode) {
      let {
        tag,
        data,
        children,
        text,
        vm,
        el
      } = vnode; //让虚拟节点和真实节点映射：后续更新某个虚拟节点，我们可以跟踪真实节点，并更新真实节点

      if (typeof tag === 'string') {
        vnode.el = document.createElement('tag'); //如果有data需要更新到属性上

        updataProperties(vnode.el, data);
        children.forEach(child => {
          vnode.el.appendChild(createElm(child));
        });
      } else {
        vnode.el = document.createTextNode(text);
      }

      return vnode.el;
    }

    function updataProperties(el, props = {}) {
      //后续写diff算法时候在进行完善
      for (let key in props) {
        el.setAttribute(key, props[key]);
      }
    }

    function mountComponent(vm) {
      vm._update(vm._render());
    }
    function leftCyleMixin(Vue) {
      Vue.prototype._update = function (vnode) {
        //先序深入遍历创建节点 ：遇到节点就创建节点，递归创建
        const vm = this;
        putch(vm.$el, vnode);
      };
    }

    function isFunction(val) {
      return typeof val == 'function';
    }
    function isObject(val) {
      return typeof val == 'object' && val !== null;
    }
    let isArray = Array.isArray;

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
      };
    }); // 属性的查找：是先找自己身上的，找不到去原型上查找

    // 2.每个原型上都有一个constructor属性 指向 函数本身 Function.prototype.constrcutr = Function

    class Observer {
      constructor(value) {
        // 不让__ob__ 被遍历到
        // value.__ob__ = this; // 我给对象和数组添加一个自定义属性
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

    } // vue2 应用了defineProperty需要一加载的时候 就进行递归操作，所以好性能，如果层次过深也会浪费性能
    // 1.性能优化的原则：
    // 1) 不要把所有的数据都放在data中，因为所有的数据都会增加get和set
    // 2) 不要写数据的时候 层次过深， 尽量扁平化数据 
    // 3) 不要频繁获取数据
    // 4) 如果数据不需要响应式 可以使用Object.freeze 冻结属性 


    function defineReactive(obj, key, value) {
      // vue2 慢的原因 主要在这个方法中
      observe(value); // 递归进行观测数据，不管有多少层 我都进行defineProperty

      Object.defineProperty(obj, key, {
        get() {
          // 后续会有很多逻辑
          return value; // 闭包，次此value 会像上层的value进行查找
        },

        set(newValue) {
          // 如果设置的是一个对象那么会再次进行劫持
          if (newValue === value) return;
          observe(newValue);
          console.log('修改');
          value = newValue;
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
        vm.$options = options;
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
    }

    function createElement(vm, tag, data = {}, ...children) {
      //返回虚拟节点
      return vnode(vm, tag, data, children, undefined, undefined);
    }
    function createText(vm, text) {
      //返回虚拟节点
      return vnode(vm, undefined, undefined, undefined, undefined, text);
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

    return Vue;

}));
//# sourceMappingURL=vue.js.map
