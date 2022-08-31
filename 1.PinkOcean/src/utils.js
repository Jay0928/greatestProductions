export function isFunction(val){
    return typeof val == 'function'
}
export function isObject(val){
    return typeof val == 'object' && val !== null;
}
export let isArray = Array.isArray


let callBacks = [];
let waiting = false;
function flushCallBacks () {
    callBacks.forEach(fn => fn())
    callBacks = []
    waiting = false
}
export function nextTick(fn) { //VUE3的nextTick就是Promise,VUE2里面做了一些兼容性处理
    callBacks.push(fn);
    if(!waiting) {
        Promise.resolve().then(flushCallBacks)
        waiting = true;
    } 
}


let strats = {};//存放所有策略
let lifeCycle = [
    "beforeCreate",
    "created",
    "beforeMount",
    "mounted"
]
lifeCycle.forEach(hook => {
    strats[hook] = function (parentVal, childValue) {
        if(childValue){
            if(parentVal) {
                return parentVal.concat(childValue)
            } else {
                if(isArray(childValue)) {
                    return childValue
                } else {
                    return [childValue]
                }
            }
        } else {
            return parentVal
        }
    }
})
export function mergeOptions(parentVal, childValue) {
    const options = {}

    for(let key in parentVal) {
        mergeFiled(key)
    }

    for(let key in childValue) {
        if(!parentVal.hasOwnProperty(key)) {
            mergeFiled(key)
        }
    }

    function mergeFiled(key) {
        //设计模式 策略模式
        let strat = strats[key]
        if(strat) {
            options[key] =  strat(parentVal[key],childValue[key]); // 合并两个值
        } else {
            options[key] = childValue[key] || parentVal[key]
        }
        
    }
    return options
}
// console.log(mergeOptions({a: 1}, {a:2,b:3}))