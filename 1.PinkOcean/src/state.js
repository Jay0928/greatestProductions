import { observe } from "./observe";
import { isFunction } from "./utils";

export function initState(vm){
    const opts = vm.$options;

    if(opts.data){
        initData(vm);
    }

}
function initData(vm){
    let data = vm.$options.data; // 用户传入的数据
    
    data = vm._data =  isFunction(data) ? data.call(vm) : data; // _data 已经是响应式的了

    // 需要将data变成响应式的 Object.defineProperty， 重写data中的所有属性
    observe(data); // 观测对象中的属性
}
