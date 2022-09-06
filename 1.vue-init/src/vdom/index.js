export function createElement(vm, tag, data = {}, ...children) { //返回虚拟节点
    return vnode(vm, tag, data, children, undefined,undefined)
}

export function createText(vm, text) { //返回虚拟节点
    return vnode(vm, undefined, undefined, undefined, undefined,text)
}
// 看两个节点是不是相同节点，就看tag和key是否一样
//vue2性能问题：递归比对
export function isSameVnode (newVnode, oldVnode) {
    return (newVnode.tag === oldVnode.tag) && (newVnode.key === oldVnode.key)
}
function vnode(vm, tag, data, children, key, text) {
    return { vm, tag, data, children, key, text }
}

//vnode和ast的区别
//ast 描述语法的，并没有用户自己的逻辑，只有语法解析出来的逻辑；
//vnode 描述dom结构，可以自己去扩展