import { observe } from "./observe";
import { isFunction } from "./utils";

function proxy(vm,key,source){ // 取值的时候做代理，不是暴力的把_data 属性赋予给vm, 而且直接赋值会有命名冲突问题
    Object.defineProperty(vm,key,{
        get(){ // ?
            return vm[source][key]; // vm._data.message 
        },
        set(newValue){ // ?
            vm[source][key] = newValue; // vm._data.message = newValue
        }
    })
}

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

    for(let key in data){ // vm.message => vm._data.message
        proxy(vm,key,'_data');// 代理vm上的取值和设置值 和  vm._data 没关系了
    }
}
