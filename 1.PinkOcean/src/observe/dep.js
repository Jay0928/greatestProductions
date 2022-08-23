let id = 0;
class Dep {
    constructor() { // 把Watcher放到dep上
        this.subs = [];
        this.id = id++;
    }
}

Dep.target = null; //全局静态变量：window.target

export default Dep;