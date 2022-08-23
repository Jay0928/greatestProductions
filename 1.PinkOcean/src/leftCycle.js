import { putch } from "./vdom/putch";
import Watcher from "./observe/watcher";

export function mountComponent(vm) {
    //初始化流程
    let updateComponent = () => {
        vm._update(vm._render());
    }

    //每个组件都有一个Watch（观察者）
    new Watcher(vm, updateComponent, () => {
        console.log("更新的钩子函数 Updata")
    })
}

export function leftCyleMixin(Vue) {
    Vue.prototype._update = function (vnode) {
        //先序深入遍历创建节点 ：遇到节点就创建节点，递归创建
        const vm = this;
        vm.$el = putch(vm.$el, vnode)
    }
}