// const mergeObjectInArraySameKey = (array) => {
//     array.forEach(function (item) {
//         var existing = output.filter(function (v, i) {
//             return v.time == item.time;
//         });

//         if (existing.length) {
//             var existingIndex = output.indexOf(existing[0]);
//             output[existingIndex].value = output[existingIndex].value.concat(item.value);
//         } else {
//             let arr = [];
//             arr.push(item.value);
//             if (typeof item.value == 'object') {
//                 item.value = arr;
//             }
//             // console.log(item);
//             output.push(item);
//         }
//     });
// };
