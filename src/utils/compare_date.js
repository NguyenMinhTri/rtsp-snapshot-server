// compare format : MM/DD/YYYY
const compareDate = (dateCompare, datePresent) => {
    let date1 = new Date(dateCompare).getTime();
    let date2 = new Date(datePresent).getTime();

    if (date1 < date2) {
        // console.log('het han');
        return 1;
    } else if (date1 > date2 || date1 == date2) {
        // console.log('con han');

        return 2;
    }
};

export default compareDate;
