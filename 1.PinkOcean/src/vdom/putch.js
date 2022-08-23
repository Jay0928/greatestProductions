export function putch(el, vnode) {
    const elm = createElm(vnode);//根据虚拟节点返回真实节点
    let parentNode = el.parentNode
    parentNode.insertBefore(elm, el.nextSibling)//el.nextSibling不存在就是null, insertBefore就是appendChild
    parentNode.removeChild(el)

    return elm //返回最新节点
}

function createElm(vnode) {
    let {tag,data,children,text ,vm, el} = vnode;

    //让虚拟节点和真实节点映射：后续更新某个虚拟节点，我们可以跟踪真实节点，并更新真实节点
    if(typeof tag === 'string') {
        vnode.el =  document.createElement('tag');
        //如果有data需要更新到属性上
        updataProperties(vnode.el,data);
        children.forEach(child => {
            vnode.el.appendChild(createElm(child))
        });
    } else {
        vnode.el = document.createTextNode(text);
    }

    return vnode.el
} 

function updataProperties(el,props = {}) { //后续写diff算法时候在进行完善
    for(let key in props){
        el.setAttribute(key, props[key])
    }
}