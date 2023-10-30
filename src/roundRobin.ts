
const fourPlayerMap = new Map()
fourPlayerMap.set(1, [[1, 2], [3, 4]])
fourPlayerMap.set(2, [[1, 3], [2, 4]])
fourPlayerMap.set(3, [[1, 4], [3, 2]])


const fivePlayerMap = new Map()
fivePlayerMap.set(1, [[1, 2], ['bye', 3], [4, 5]])
fivePlayerMap.set(2, [[1, 3], [2, 4], ['bye', 5]])
fivePlayerMap.set(3, [[1, 4], [3, 5], [2, 'bye']])
fivePlayerMap.set(4, [[1, 5], ['bye', 4], [3, 2]])
fivePlayerMap.set(5, [[1, 'bye'], [5, 2], [3, 4]])


const sixPlayerMap = new Map()
sixPlayerMap.set(1, [[1, 2], [6, 3], [4, 5]])
sixPlayerMap.set(2, [[1, 3], [2, 4], [6, 5]])
sixPlayerMap.set(3, [[1, 4], [3, 5], [2, 6]])
sixPlayerMap.set(4, [[1, 5], [6, 4], [3, 2]])
sixPlayerMap.set(5, [[1, 6], [5, 2], [3, 4]])


const sevenPlayerMap = new Map()
sevenPlayerMap.set(1, [[1, 2], ['bye', 3], [4, 7], [6, 5]])
sevenPlayerMap.set(2, [[1, 3], [2, 4], ['bye', 5], [7, 6]])
sevenPlayerMap.set(3, [[1, 4], [3, 5], [2, 6], ['bye', 7]])
sevenPlayerMap.set(4, [[1, 5], [6, 4], [3, 7], [2, 'bye']])
sevenPlayerMap.set(5, [[1, 6], [5, 7], ['bye', 4], [3, 2]])
sevenPlayerMap.set(6, [[1, 7], [6, 'bye'], [5, 2], [3, 4]])
sevenPlayerMap.set(7, [[1, 'bye'], [7, 2], [6, 3], [5, 4]])


const eightPlayerMap = new Map()
eightPlayerMap.set(1, [[1, 2], [8, 3], [4, 7], [6, 5]])
eightPlayerMap.set(2, [[1, 3], [2, 4], [8, 5], [7, 6]])
eightPlayerMap.set(3, [[1, 4], [3, 5], [2, 6], [8, 7]])
eightPlayerMap.set(4, [[1, 5], [6, 4], [3, 7], [2, 8]])
eightPlayerMap.set(5, [[1, 6], [5, 7], [8, 4], [3, 2]])
eightPlayerMap.set(6, [[1, 7], [6, 8], [5, 2], [3, 4]])
eightPlayerMap.set(7, [[1, 8], [7, 2], [6, 3], [5, 4]])

export {
    fourPlayerMap,
    fivePlayerMap,
    sixPlayerMap,
    sevenPlayerMap,
    eightPlayerMap
}