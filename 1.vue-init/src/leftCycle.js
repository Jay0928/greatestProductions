import { putch } from "./vdom/putch";
import Watcher from "./observe/watcher";

export function mountComponent(vm) {
    //初始化流程
    let updateComponent = () => {
        vm._update(vm._render());
    }
    callhook(vm, 'beforeCreate')
    //每个组件都有一个Watch（观察者）
    new Watcher(vm, updateComponent, () => {
        console.log("更新的钩子函数 Updata")
    })
    callhook(vm, 'mounted')
}

export function leftCyleMixin(Vue) {
    Vue.prototype._update = function (vnode) {
        //先序深入遍历创建节点 ：遇到节点就创建节点，递归创建
        const vm = this;

        //第一次渲染是根据虚拟节点，生成真实节点，替换掉原来的节点

        //如果是第二次，生成新的虚拟节点和老的虚拟节点进行对比
        vm.$el = putch(vm.$el, vnode)
    }
}

export function callhook(vm, hook) {
    let handlers = vm.$options[hook];
    handlers && handlers.forEach(fn => {
        fn.call(vm);//生命周期的this，永远指向实例
    })
}