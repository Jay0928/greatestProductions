import Dep from "./dep";
let id = 0;//防止重复
class Watcher {
    constructor(vm, fn, cb, options) { //dep放到Watcher中
        this.vm = vm;
        this.fn = fn;
        this.cb = cb;
        this.options = options;
        this.id = id++;
        this.depsId = new Set()
        this.deps = []

        this.getter = fn; //页面渲染逻辑

        this.get();//初始化
    }
    addDep(dep) {
        let did = dep.id;
        if(!this.depsId.has(did)) {
            this.depsId.add(did)
            this.deps.push(dep);//保存id，并让watcher记住dep
            dep.addSub(this);
        }
    }
    get() {
        Dep.target = this; //Dep.target = Watcher
        this.getter(); //页面渲染逻辑
        Dep.target = null; //渲染完成将标识清空，只有在渲染时候才会进行依赖收集
    }
    update() {
        //做异步更新
        this.get();
    }
}

export default Watcher