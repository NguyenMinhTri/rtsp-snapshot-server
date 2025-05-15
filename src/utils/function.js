// unique key of object
const getUniqueListBy = (arr, key) => {
    return [...new Map(arr.map((item) => [item[key], item])).values()];
};

export { getUniqueListBy };
