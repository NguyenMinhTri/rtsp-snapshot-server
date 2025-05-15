export const handelTimePresent = () => {
    const timePresent = new Date();
    const dayPresent = timePresent.getDate();
    const monthPresent = timePresent.getMonth();
    const yearsPresent = timePresent.getFullYear();

    return {
        dayPresent,
        monthPresent: monthPresent + 1,
        yearsPresent,
    };
};