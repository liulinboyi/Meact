// import React from 'react'
// import ReactDOM from 'react-dom'

import React from './yolkjs'

const ReactDOM = React

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
