import { putch } from "./vdom/putch";

export function mountComponent(vm) {
    vm._update(vm._render());
}

export function leftCyleMixin(Vue) {
    Vue.prototype._update = function (vnode) {
        //先序深入遍历创建节点 ：遇到节点就创建节点，递归创建
        const vm = this;
        putch(vm.$el, vnode)
    }
}