import { isSameVnode } from "./index";

export function putch(oldVnode, vnode) {
    //unmount

    const isRealElement = oldVnode.nodeType
    if(isRealElement){
        const elm = createElm(vnode);//根据虚拟节点返回真实节点
        let parentNode = oldVnode.parentNode
        parentNode.insertBefore(elm, oldVnode.nextSibling)//el.nextSibling不存在就是null, insertBefore就是appendChild
        parentNode.removeChild(oldVnode)
    
        return elm //返回最新节点
    } else {
        //diff算法如何实现？ 
        // console.log(oldVnode, vnode)
        if(!isSameVnode(oldVnode, vnode)) {//如果新旧节点不是同一个，删除老的换成新的
            return oldVnode.el.parentNode.replaceChild(createElm(vnode), oldVnode.el)
        }
        //是相同节点，复用，再更新不一样的地方
        let el = vnode.el = oldVnode.el;//复用节点
        //（属性：文本特殊处理）
        if(!oldVnode.tag) {
            //文本比对
            if(oldVnode.text !== vnode.text) {
                return oldVnode.textContent = vnode.text
            }

        }

        //元素
        updataProperties(vnode, oldVnode.data)
    }
}

export function createElm(vnode) {
    let {tag,data,children,text ,vm, el} = vnode;

    //让虚拟节点和真实节点映射：后续更新某个虚拟节点，我们可以跟踪真实节点，并更新真实节点
    if(typeof tag === 'string') {
        vnode.el =  document.createElement('tag');
        //如果有data需要更新到属性上
        updataProperties(vnode,data);
        children.forEach(child => {
            vnode.el.appendChild(createElm(child))
        });
    } else {
        vnode.el = document.createTextNode(text);
    }

    return vnode.el
} 

function updataProperties(vnode,oldProps = {}) { //后续写diff算法时候在进行完善
    //初次渲染：直接用oldProps给vnode的赋值即可
    //更新逻辑：拿到老的props 和 vnode中的data做对比 
    let el = vnode.el;//dom真实节点
    let newProps = vnode.data || {}

    //新旧比对，两个对象对比差异？
    let newStyle = newProps.style || {};
    let oldStyle = oldProps.style || {};
    for(let key in oldStyle) {
        if(!oldStyle[key]) {
            el.style[key] = ""
        } 
    }
    for(let key in newProps){
        if(key == 'style') {
            for(let key in newStyle) {
                el.style[key] = newStyle[key]
            }
        } else {
            el.setAttribute(key, newProps[key])
        }
    }
    for(let key in oldProps){
        if(!newProps[key]) {
            el.removeAttribute(key);
        }
    }
}