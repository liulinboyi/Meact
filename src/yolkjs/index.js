
/**
 * 创建虚拟dom的方法
 * @param {string} type 元素类型
 * @param {any} props jsx传递的属性
 * @param  {...any} children 子元素 
 */
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

export default {
  createElement,
  render,
}