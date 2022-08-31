import { mergeOptions } from "../utils"

export function initGlobalAPI (Vue) {
    Vue.options = {} //全局属性
    Vue.mixin = function (options) {
        this.options = mergeOptions(this.options, options)
        return this
    }
    Vue.component = function (options) {

    }
    Vue.filter = function (options) {

    }
    Vue.directive = function (options) {

    }
}