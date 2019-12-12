# yolkjs

一个学习 React 源码的例子

### 学习目标
> 1. JSX
> 2. createElement
> 3. Render
> 4. fiber
> 5. functional component
> 6. hooks


### 初始环境

通过 [Create React App](https://github.com/facebook/create-react-app) 创建初始的 `React` 项目

然后在浏览器打开 [http://localhost:3000](http://localhost:3000) 查看

### JSX 

JSX 写起来像 html， 其实是 babel 转义成 `React.crxeateElement` 来执行的，用来构建虚拟 dom,

```js
<h1 title="app">Yolk test</h1>
```

解析成：
```js
React.createElement(
  "h1",
  { title: "app"},
  "Yolk test"
)
```

这也是为什么用了 JSX 的文件，必须要 `import React from 'react'` 的原因所在

我们知道通过 createElement 构建虚拟 dom 这种形式是组件化的最佳实践，那为什么要用 JSX 呢？这就需要从虚拟 dom 的概念说起，简单来说，虚拟 dom 就是用 JS 对象来描述真实的 dom。

```js
const element = {
  type: "h1",
  props: {
    title: "app",
    children: "Yolk, test",
  }
}
```

我们用 JS 对象，来完整地描述 dom， 后续有任何的修改需求，只需要频繁的操作这个 dom，尽可能少的操作真实 dom， 这也就是为什么虚拟 dom 性能良好的原因所在： 在两次操作之间进行 diff，只做最少的修改次数。

### createElement

我们通过改写 `index.js` 文件，实现一个原始的 JSX 项目：

```js
// index.js
import React from 'react'
import ReactDOM from 'react-dom'

const App = (
  <div>
    <h1>Yolkjs</h1>
    <p>react dom</p>
    <a href="https://jd.com">shop</a>
  </div>
)

ReactDOM.render(App, document.getElementById('root'))

```

由于可以预知我们需要要构建虚拟 dom，上述 JSX 应该会解析成这样：

```js
React.createElement(
  "div",
  {id: "app"},
  React.createElement(
    "h1",
    null,
    "Yolkjs"
  ),
  React.createElement(
    "p",
    null,
    "react dom"
  ),
  React.createElement(
    "a",
    { href: "https://jd.com"},
    "shop"
  )
)
```

期待返回的对象如下：

```js
const element = {
  type: "div",
  props: {
    id: "app",
    children: [
      { type: "h1", props: { value: "Yolkjs"}},
      { type: "p", props: { value: "react dom"}},
      { type: "a", props: { href: "https://jd.com", value: "shop"}},
    ]
  }
}
```

所以我们 `yolkjs` 的源码中的 `createElement()` 方法也可以想到该如何实现了, 其实就是在 `createElement` 的时候创建一个合适的 *JSON* 结构数据。让我们先在 `src` 目录下创建一个 `yolkjs` 文件夹，然后再创建一个 `index.js` 文件，实现我们的源码

```js
// /src/yolkjs/index.js
function createElement(type, props, ...children) {
  // 删除掉开发调试的 source，避免干扰
  delete props.__source
  return {
    type,
    props: {
      ...props,
      children,
    }
  }
}

function render(vdom, container) {
  // 我们先在页面上渲染处 dom 的 json 结构
  container.innerHTML = `<pre>${JSON.stringify(vdom, null, 2)}</pre>`
}

export default {
  createElement,
  render,
}

```

最后我们再改造下 `/src/index.js` 的代码:

```js
// /src/index.js
// import React from 'react'
// import ReactDOM from 'react-dom'

import React from './yolkjs'
const ReactDOM = React

// ...
```

运行 `yarn start`，然后访问 [http://localhost:3000](http://localhost:3000) 应该可以得到如下界面:

![初始版 yolkjs json](/static/json.jpg)

这个 json 基本符合我们一开始的预期效果