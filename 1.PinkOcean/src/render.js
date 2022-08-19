import { isObject } from "./utils"
import { createElement, createText } from "./vdom"

export function renderMixin(Vue) {
    Vue.prototype._c = function () { //createElement 创建元素节点
        // console.log(arguments)
        const vm = this;
        return createElement(vm, ...arguments)

    }
    Vue.prototype._v = function (text) {  //创建文本的虚拟节点
        // console.log(arguments)
        const vm = this;
        return createText(vm, text)
    }
    Vue.prototype._s = function (val) {  //JSON.stringify()
        // console.log(arguments)
        if(isObject(val)) return JSON.stringify(val);
        return val
    }
    Vue.prototype._render = function () {
        const vm = this; //vm中有所有的数据 vm.xxx => vm._data.xxx
        let {render} = vm.$options;
        let vnode = render.call(vm);//返回虚拟节点
        // console.log("vnode",vnode)
        return vnode
    }
}