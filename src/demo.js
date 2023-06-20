import React from './yolkjs'

// 定义一个快速排序函数
function quickSort(arr) {
    // 如果数组长度小于等于1，直接返回数组
    if (arr.length <= 1) {
        return arr;
    }
    // 选择第一个元素作为基准元素
    let pivot = arr[0];
    // 定义两个空数组，用来存放比基准元素小和大的元素
    let leftArr = [];
    let rightArr = [];
    // 从第二个元素开始遍历数组
    for (let i = 1; i < arr.length; i++) {
        // 如果当前元素小于基准元素，就放到左边的数组中
        if (arr[i] < pivot) {
            leftArr.push(arr[i]);
        } else {
            // 否则，就放到右边的数组中
            rightArr.push(arr[i]);
        }
    }
    // 返回左边数组、基准元素和右边数组拼接后的结果
    return [...quickSort(leftArr), pivot, ...quickSort(rightArr)];
}

// 定义一个数组洗牌函数
function shuffle(arr) {
    // 获取数组的长度
    let len = arr.length;
    // 从最后一个元素开始遍历数组
    for (let i = len - 1; i > 0; i--) {
        // 随机生成一个[0, i]之间的整数作为索引
        let j = Math.floor(Math.random() * (i + 1));
        // 交换arr[i]和arr[j]的位置
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    // 返回打乱后的数组
    return arr;
}


function many() {
    let arr = []
    for (let i = 0; i < 1000000; i++) {
        arr.push(i)
    }
    shuffle(arr)
    quickSort(arr)
}

let index = 0

export function App(props) {
    index++
    const [count, setCount] = React.useState(1)
    console.warn("[count]", count)
    const [demo, setDemo] = React.useState('hello')

    React.useEffect(() => {
        if (index !== 0) {
            many()
        }
        console.log("[useEffect]", count)
        console.log(document.querySelector(".count-dom").innerHTML)
    }, [count])

    const addTwice = () => {
        const c1 = Math.random() * 10 + count
        console.warn("[c1]", c1)
        setCount(c1)
        Promise.resolve().then(() => {
            const c2 = Math.random() * 10 + count
            console.warn("[c2]", c2)
            // debugger
            setCount(c2)
            setTimeout(() => {
                const c3 = Math.random() * 10 + count
                console.warn("[c3]", c3)
                // debugger
                setCount(c3)
            })
        })
    }
    return (
        <div id="app">
            <h1>hello, {props.title}</h1>
            <p className='count-dom'>react dom {count}</p>
            <p>react demo {demo}</p>
            <a href="https://jd.com">shop</a>
            <button onClick={() => addTwice()}>add</button>
            <button onClick={() => setDemo(demo + Math.random() * 10)}>change</button>
        </div>
    )
}
