import { compileToFunction } from "./compiler";
import { initGlobalAPI } from "./global-api";
import { initMixin } from "./init";
import { leftCyleMixin } from "./leftCycle";
import { renderMixin } from "./render";
import { createElm, putch } from "./vdom/putch";

function Vue(options){
    this._init(options); // 实现vue的初始化功能
}

initMixin(Vue);

//render的扩展方法
renderMixin(Vue);//真实节点
leftCyleMixin(Vue);//渲染真实节点


initGlobalAPI(Vue)


//先生成一个虚拟节点
let vm1= new Vue({
    data() {
        return {name: 'zj'}
    }
})
let render1 = compileToFunction(`<div style="color:red;">{{name}}</div>`)
let oldVnode = render1.call(vm1);
let el1 = createElm(oldVnode)
document.body.appendChild(el1)

//再生成一个新的虚拟节点，patch
let vm2= new Vue({
    data() {
        return {name: 'zz'}
    }
})
let render2 = compileToFunction(`<div style="color:blue;">{{name}}</div>`)
let newVnode = render2.call(vm2);


setTimeout(()=> {
    putch(oldVnode, newVnode);//比对虚拟节点的差异
}, 1000)


export default Vue; 