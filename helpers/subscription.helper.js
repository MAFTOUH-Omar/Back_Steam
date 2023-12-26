function updateSelectedProperty(subscriptionArray, requestBodyArray) {
    subscriptionArray.forEach(item => item.selected = false);

    if (requestBodyArray && requestBodyArray.length > 0) {
        subscriptionArray.forEach(item => {
            const existingItem = requestBodyArray.find(requestItem => requestItem._id.equals(item._id));
            if (existingItem) {
                item.selected = true;
            }
        });
    }
}

module.exports = updateSelectedProperty;