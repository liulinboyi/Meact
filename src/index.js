// import React from 'react'
// import ReactDOM from 'react-dom'

import React from './yolkjs'

const ReactDOM = React

function App(props) {
  const [count, setCount] = React.useState(1)
  return (
    <div id="app">
      <h1>hello, {props.title}</h1>
      <p>react dom {count}</p>
      <a href="https://jd.com">shop</a>
      <button onClick={() => setCount(count + 1)}>add</button>
    </div>
  )
}

let element = <App title="yolkjs" />

ReactDOM.render(element, document.getElementById('root'))
