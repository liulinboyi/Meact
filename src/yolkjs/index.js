
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
      dom[name] = vdom.props[name]
    }
  })

  // 递归渲染的子元素
  vdom.props.children.forEach(child => render(child, dom))

  container.appendChild(dom)
}

export default {
  createElement,
  render,
}