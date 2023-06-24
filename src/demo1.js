import React from './Meact'

export function App(props) {
    const [count, setCount] = React.useState(1)
    console.warn("[count]", count)
    const [demo, setDemo] = React.useState('hello')
    console.warn("[demo]", demo)

    React.useEffect(() => {
        console.log("[useEffect]", count)
        console.log(document.querySelector(".count-dom").innerHTML)
    }, [count])

    const addTwice = () => {
        const c1 = Math.random() * 10 + count
        console.warn("[c1]", c1)
        setCount(c1)

        const c2 = Math.random() * 10 + count
        console.warn("[c2]", c2)
        setCount(c2)
    }
    const changeDemo = () => {
        debugger;console.log(demo);setDemo(demo + Math.random() * 10)
    }
    return (
        <div id="app" className="wrapper">
            <h1>hello, {props.title}</h1>
            <p className='count-dom'>react dom {count}</p>
            <p>react demo {demo}</p>
            <button onClick={addTwice}>add</button>
            <button onClick={changeDemo}>change</button>
        </div>
    )
}
