// compare format : MM/DD/YYYY
const compareDate = (dateCompare, datePresent) => {
    let date1 = new Date(dateCompare).getTime();
    let date2 = new Date(datePresent).getTime();

    if (date1 < date2) return 1;   // hết hạn
    else return 2;                 // còn hạn
};

export default compareDate;




// Function to subscribe/unsubscribe token to/from a topic
export const subscribeTokenToTopic = async (token, topic, isSub) => {
    if (!token) {
        console.error("No token available for subscription.");
        return;
    }
    debugger;
    try {
        const response = await fetch(
            "https://asia-east2-weatherstationiotdaiviet.cloudfunctions.net/HttpPostRequest/subscribe-to-topic",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    token,
                    topic,
                    isSub,
                }),
            }
        );
    debugger;
        if (response.ok) {
            console.log(
                `Successfully ${isSub ? "subscribed" : "unsubscribed"} to topic ${topic}`
            );
        } else {
            console.error("Failed to subscribe/unsubscribe.");
        }
    } catch (err) {
        console.error("Error while subscribing/unsubscribing:", err);
    }
};
