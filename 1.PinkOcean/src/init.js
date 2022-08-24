import { compileToFunction } from "./compiler";
import { mountComponent } from "./leftCycle";
import { initState } from './state'
import { nextTick } from "./utils";
export function initMixin(Vue) {
    Vue.prototype._init = function(options) {
        const vm = this;
        vm.$options = options; 
        initState(vm);
        if (vm.$options.el) {
            // 要将数据挂载到页面上
            vm.$mount(vm.$options.el);
        }
    }
    
    // new Vue({el}) new Vue().$mount
    Vue.prototype.$mount = function(el) {
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
            let render = compileToFunction(template)
            opts.render = render;

        }

        // console.log(opts.render)

        // 组件挂载(el, render)
        mountComponent(vm)
    }

    Vue.prototype.$nextTick = nextTick
}