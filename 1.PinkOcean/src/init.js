import { initState } from './state'
export function initMixin(Vue) {
    Vue.prototype._init = function(options) {
        const vm = this;
        vm.$options = options; 
        initState(vm);
        if (vm.$options.el) {
            // 要将数据挂载到页面上
        }
    }
}