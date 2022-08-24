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