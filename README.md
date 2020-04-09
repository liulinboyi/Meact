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

JSX 写起来像 html， 其实是 babel 转义成 `React.createElement` 来执行的，用来构建虚拟 dom,

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

这个 json 基本符合我们一开始的预期效果，不过为了方便后面操作 dom 我们需要简单改造一下，把 `children` 中的文本也改造成一个节点，所以我们需要实现一个 `createTextElement()` 的方法，并且遍历 children 的属性根据类型来判断是否返回文本节点：

```js
// /src/yolkjs/index.js

function createElement(type, props, ...children) {
  delete props.__source
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === 'object' ? child : createTextElement(child)
      )
    }
  }
}

function createTextElement(text) {
  return {
    type: 'TEXT',
    props: {
      nodeValue: text,
      children: [],
    }
  }
}

// ...
```

再访问下 [http://localhost:3000](http://localhost:3000) 应该可以得到结果：

![初始版 yolkjs 修正文本节点](/static/json1.jpg)

### render

现在的 `render()` 只是简单地渲染一个虚拟对象结构，我们需要转换成真实的 dom 渲染，这一步其实没啥特别的，就是挨个遍历，创建dom，然后添加到父视图中。

```js
// /src/yolkjs/index.js
// ...
function render(vdom, container) {
  // container.innerHTML = `<pre>${JSON.stringify(vdom, null, 2)}</pre>`
  const dom = vdom.type === "TEXT" ? document.createTextNode("") : document.createElement(vdom.type)

  // 设置属性
  Object.keys(vdom.props).forEach(name => {
    if (name !== 'children') {
      // @todo: 属性判断，事件处理
      dom[name] = vdom.props[name]
    }
  })

  // 递归渲染的子元素
  vdom.props.children.forEach(child => render(child, dom))

  container.appendChild(dom)
}
// ...
```

### concurrent

细心的同学已经发现，上面的 `render()` 函数，一旦开始就会不断地递归，无法停止，本身在这里是没啥问题，但是如果应用变大以后就会有卡顿。后面状态修改后的 diff 过程也是一样的道理，整个 vdom 变大以后，diff 的过程也会递归过多而导致卡顿。

那如何解决这个问题呢？

浏览器提供了一个 api `reauestIdleCallback` 可以利用浏览器的业余时间，我们可以把任务拆解成一个一个的小任务，然后利用浏览器空闲的时间来做 diff， 如果当前任务来了，比如用户的点击或者动画，就会先执行，等待空闲后再回去把 `requestIdleCallback` 没完成的任务完成

```js
// /src/yolkjs/index.js
// ...
function render(vdom, container) {
  //... 
}

// 下一个单元任务
// render 函数会初始化第一个任务
let nextUnitOfWork = null

//  调度我们的 diff 或者渲染任务
function workLoop(deadline) {
  // 有下一个任务，且当前帧还没有结束
  while (nextUnitOfWork && deadline.timeRemaining() > 1) {
    // 
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
  }
  requestIdleCallback(workLoop)
}

function performUnitOfWork(fiber) {
  // 获取下一个任务
  // 根据当前任务获取下一个任务
}

//  启动空闲时间渲染
requestIdleCallback(workLoop)
// ...
```

> PS: react 已经重写了 requestIdleCallback, 不用系统的，但是整个过程是一致的。

### fibers

我们有了调度逻辑，之前的 vdom 结构是一个树形结构，diff 过程是没法中断的，为了我们 vdom 树之间的关系，我们需要把树形结构的内部关系改造成链表(方便中止)，之前 children 作为一个数组递归遍历，现在 父 => 子， 子 => 父， 子 => 兄弟， 都有关系。

![fiber tree](/static/fiberTree.png)

整个任务从 render 开始， 每次只遍历一个小单元，一旦被打断，就去执行优先级高的任务(用户交互，动画)，回来后，由于回来的元素知道父，子，兄弟元素，很容易恢复遍历的状态。

首先我们需要把创建 dom 的函数提取出来，新建一个 `createDom()` 方法 

```js
// /src/yolkjs/index.js
/**
 *  通过虚拟 dom 新建 dom
 * @param {*} vdom 
 */

// ...
function createDom(vdom) {
  // 创建 dom
  const dom = vdom.type === "TEXT"
    ? document.createTextNode("")
    : document.createElement(vdom.type)
  // 设置属性
  Object.keys(vdom.props).forEach(name => {
    if (name !== 'children') {
      // @todo: 属性判断，事件处理
      dom[name] = vdom.props[name]
    }
  })
  return dom
}

function render(vdom, container) {

  nextUnitOfWork = {
    dom: container,
    props: {
      children: [vdom]
    }
  }
  // container.innerHTML = `<pre>${JSON.stringify(vdom, null, 2)}</pre>`
  // 递归渲染的子元素
  // vdom.props.children.forEach(child => render(child, dom))

  // container.appendChild(dom)
}

// 下一个单元任务
// render 函数会初始化第一个任务
let nextUnitOfWork = null

//  调度我们的 diff 或者渲染任务
function workLoop(deadline) {
  // 有下一个任务，且当前帧还没有结束
  while (nextUnitOfWork && deadline.timeRemaining() > 1) {
    // 
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
  }
  requestIdleCallback(workLoop)
}

function performUnitOfWork(fiber) {
  // 获取下一个任务
  // 根据当前任务获取下一个任务

  if (!fiber.dom) {
    // 不是入口
    fiber.dom = createDom(fiber)
  }

  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom)
  }
  const elements = fiber.props.children
  // 构建成 fiber
  let index = 0
  let preSibling = null
  while (index < elements.length) {
    let element = elements[index]
    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    }
    if (index === 0) {
      // 第一个元素，是父 fiber 的 child 属性
      fiber.child = newFiber
    } else {
      // 其他元素是兄弟元素
      preSibling.sibling = newFiber
    }
    preSibling = fiber
    index++
    // fiber 基本结构构建完毕
  }

  // 找下一个任务
  // 先找子元素
  if (fiber.child) {
    return fiber.child
  }

  let nextFiber = fiber
  // 没有子元素，就找兄弟元素
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    // 没有兄弟元素，找父元素
    nextFiber = nextFiber.parent
  }
}

// ...
```

### commit

给 dom 添加节点的时候，如果渲染过程中被打断，ui 渲染会变得很奇怪，所以我们需要把 dom 操作独立出来。用一个全局变量来存储正在工作的根节点。

```js
// /src/yolkjs/index.js
// ...
function render(vdom, container) {

  wipRoot = {
    dom: container,
    props: {
      children: [vdom],
    }
  }

  nextUnitOfWork = wipRoot
  // container.innerHTML = `<pre>${JSON.stringify(vdom, null, 2)}</pre>`
  // 递归渲染的子元素
  // vdom.props.children.forEach(child => render(child, dom))

  // container.appendChild(dom)
}

function commitRoot() {
  commitWorker(wipRoot.child)
  wipRoot = null
}

function commitWorker(fiber) {
  if (!fiber) {
    return
  }
  const domParent = fiber.parent.dom
  domParent.appendChild(fiber.dom)
  commitWorker(fiber.child)
  commitWorker(fiber.sibling)
}

// 下一个单元任务
// render 函数会初始化第一个任务
let nextUnitOfWork = null
let wipRoot = null

//  调度我们的 diff 或者渲染任务
function workLoop(deadline) {
  // 有下一个任务，且当前帧还没有结束
  while (nextUnitOfWork && deadline.timeRemaining() > 1) {
    // 
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
  }
  if (!nextUnitOfWork && wipRoot) {
    // 没有任务了，并且根节点还在
    commitRoot()
  }
  requestIdleCallback(workLoop)
}

function performUnitOfWork(fiber) {
  // 获取下一个任务
  // 根据当前任务获取下一个任务

  if (!fiber.dom) {
    // 不是入口
    fiber.dom = createDom(fiber)
  }

  // // 真实的 dom 操作
  // if (fiber.parent) {
  //   fiber.parent.dom.appendChild(fiber.dom)
  // }
  // ...
}
// ...
```

### Recon

现在已经能够渲染了，但是如何更新和删除节点呢？这里我们需要保存一个被中断前工作的 fiber 节点 currentRoot

```js
// /src/yolkjs/index.js
let currentRoot = null
let deletions = null
```

每个 fiber 都有一个字段，存储这上一个状态的 fiber 并且针对子元素，设计一个 reconcileChildren 函数,并且我们需要对 fiber 增加一个 base 字段进行对比。同时还要根据节点类型进行比较，如果类型相同，dom 可以复用，更新节点即可，如果类型不同，就直接替换，否则就直接删除。

```js
function reconcileChildren(wipFiber, elements) {
  // 构建成 fiber
  let index = 0
  let oldFiber = wipFiber.base && wipFiber.base.child
  let preSibling = null
  // console.log('oldFiber:', oldFiber)
  while (index < elements.length) {
    // while (index < elements.length) {
    let element = elements[index]
    let newFiber = null
    // 对比 oldfiber 的状态和当前 element
    // 先比较类型，
    const sameType = oldFiber && element && oldFiber.type === element.type
    if (sameType) {
      // 复用节点，更新
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        base: oldFiber,
        effectTag: "UPDATE",
      }
    }

    if (!sameType && element) {
      // 新增节点
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        base: null,
        effectTag: "PLACEMENT",
      }
    }
    if (!sameType && oldFiber) {
      // 删除
      oldFiber.effectTag = "DELETION"
      deletions.push(oldFiber)
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling
    }
    if (index === 0) {
      // 第一个元素，是父 fiber 的 child 属性
      wipFiber.child = newFiber
    } else {
      // 其他元素是兄弟元素
      preSibling.sibling = newFiber
    }
    preSibling = newFiber
    index++
    // fiber 基本结构构建完毕
  }
}
```

我们还要新增一个方法 `updateDom()` ，来完成事件的监听: 

```js
// /src/yolkjs/index.js
// ...
/**
 * 通过虚拟 dom 新建 dom 元素
 * @param {*} vdom 虚拟 dom
 */
function createDom(vdom) {
  const dom = vdom.type === "TEXT"
    ? document.createTextNode("")
    : document.createElement(vdom.type)
  updateDom(dom, {}, vdom.props)
  // Object.keys(vdom.props).forEach(name => {
  //   if (name !== "children") {
  //     // @todo: 属性判断，事件处理
  //     dom[name] = vdom.props[name]
  //   }
  // })
  return dom
}

function updateDom(dom, preProps, nextProps) {
  /**
   * 1. 规避 children 属性
   * 2. 老得存在，取消
   * 3. 新的存在，新增， 
   */

  //  @todo 兼容性问题  

  Object.keys(preProps)
    .filter(name => name !== 'children')
    .filter(name => !(name in nextProps))
    .forEach(name => {
      if (name.slice(0, 2) === 'on') {
        // onclick => chick
        dom.removeEventListener(name.slice(2).toLowerCase(), preProps[name], false)
      } else {
        dom[name] = ''
      }
    })

  Object.keys(nextProps)
    .filter(name => name !== 'children')
    .forEach(name => {
      if (name.slice(0, 2) === 'on') {
        // onclick => chick
        dom.addEventListener(name.slice(2).toLowerCase(), preProps[name], false)
      } else {
        dom[name] = nextProps[name]
      }
    })
}
```

最后修改下 render 和 commit 相关的一些代码，我们即可实现 fiber 的架构

```js
// /src/yolkjs/index.js
// ...
function render(vdom, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [vdom],
    },
    base: currentRoot, // 分身
  }
  deletions = []
  nextUnitOfWork = wipRoot
  // container.innerHTML = `<pre>${JSON.stringify(vdom, null, 2)}</pre>`
  // 递归渲染的子元素
  // vdom.props.children.forEach(child => render(child, dom))

  // container.appendChild(dom)
}

function commitRoot() {
  deletions.forEach(commitWorker)
  commitWorker(wipRoot.child)
  currentRoot = wipRoot
  wipRoot = null
}

function commitWorker(fiber) {
  if (!fiber) {
    return
  }
  const domParent = fiber.parent.dom
  // domParent.appendChild(fiber.dom)
  if (fiber.effectTag === 'PLACEMENT' && fiber.dom !== null) {
    domParent.appendChild(fiber.dom)
  } else if (fiber.effectTag === 'DELETION') {
    domParent.removeChild(fiber.dom)
  } else if (fiber.effectTag === 'UPDATE' && fiber.dom !== null) {
    // 更新dom
    updateDom(fiber.dom, fiber.base.props, fiber.props)
  }
  commitWorker(fiber.child)
  commitWorker(fiber.sibling)
}
// ...
```

### 函数式组件

为了让我们方便测试函数式组件的实现，我们先把页面代码改造成函数式组件的写法:

```js
// /src/index.js
// ...
function App(props) {
  return (
    <div id="app">
      <h1>hello, {props.title}</h1>
      <p>react dom</p>
      <a href="https://jd.com">shop</a>
    </div>
  )
}

let element = <App title="yolkjs" />

ReactDOM.render(element, document.getElementById('root'))
```

其实函数也是一样的渲染，只不过 type 是函数，而不是字符串，我们需要在处理 vdom 的时候识别其和普通 dom 的区别

1. 根据type 执行不同的函数来初始化 fiber, 

```js
// /src/yolkjs/index.js
// ...
function performUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function
  console.log('iisFunctionComponents', isFunctionComponent, fiber.type, fiber)
  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    // dom
    updateHostComponent(fiber)
  }
  // 找下一个任务
  // 先找子元素
  if (fiber.child) {
    return fiber.child
  }
  let nextFiber = fiber
  // 没有子元素，就找兄弟元素
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    // 没有兄弟元素，找父元素
    nextFiber = nextFiber.parent
  }
}

function updateFunctionComponent(fiber) {
  const children = [fiber.type(fiber.props)]
  reconcileChildren(fiber, children)
}

function updateHostComponent(fiber) {
  // 获取下一个任务
  // 根据当前任务获取下一个任务
  if (!fiber.dom) {
    // 不是入口
    fiber.dom = createDom(fiber)
  }

  // // 真实的 dom 操作
  // if (fiber.parent) {
  //   fiber.parent.dom.appendChild(fiber.dom)
  // }

  const elements = fiber.props.children

  reconcileChildren(fiber, elements)

}
// ...
```

2. 函数组件没有 dom 属性（没有 dom 属性，查找 dom 需要向上循环查找）

```js
// /src/yolkjs/index.js
// ...
function commitWorker(fiber) {
  if (!fiber) {
    return
  }
  // const domParent = fiber.parent.dom
  // domParent.appendChild(fiber.dom)
  let domParentFiber = fiber.parent
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }
  const domParent = domParentFiber.dom
  if (fiber.effectTag === 'PLACEMENT' && fiber.dom !== null) {
    domParent.appendChild(fiber.dom)
  } else if (fiber.effectTag === 'DELETION') {
    commitDeletion(fiber, domParent)
    // domParent.removeChild(fiber.dom)
  } else if (fiber.effectTag === 'UPDATE' && fiber.dom !== null) {
    // 更新dom
    updateDom(fiber.dom, fiber.base.props, fiber.props)
  }
  commitWorker(fiber.child)
  commitWorker(fiber.sibling)
}

function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom)
  } else {
    commitDeletion(fiber.child, domParent)
  }
}
// ...
```

### Hooks

实际上 hooks 是通过链表来查找具体的 state， 这里我们通过数组来简单模拟一下，把 userState 存储的 hooks, 存储在 fiber 中

