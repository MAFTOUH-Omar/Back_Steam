const Subscription = require('../models/subscription.model');
const User = require('../models/user.model');

const StatisticController = {
    getSubscriptionStatistics : async () => {
        try {
            const totalSubscriptions = await Subscription.countDocuments();
            const pendingSubscriptions = await Subscription.countDocuments({ paymentStatus: 'pending' });
            const successSubscriptions = await Subscription.countDocuments({ paymentStatus: 'success' });
            const failedSubscriptions = await Subscription.countDocuments({ paymentStatus: 'failed' });
    
            const successSubscribers = await User.countDocuments({
                _id: { $in: await Subscription.distinct('user', { paymentStatus: 'success' }) }
            });
    
            const pendingPercentage = (pendingSubscriptions / totalSubscriptions) * 100;
            const successPercentage = (successSubscriptions / totalSubscriptions) * 100;
            const failedPercentage = (failedSubscriptions / totalSubscriptions) * 100;
            const successSubscriberPercentage = (successSubscribers / totalSubscriptions) * 100;
    
            return {
                pendingPercentage,
                successPercentage,
                failedPercentage,
                successSubscriberPercentage
            };
        } catch (error) {
            console.error('Error fetching subscription statistics:', error);
        }
    },
    getUserAndSubscriptionCounts: async () => {
        try {
            const userCountsByMonth = await User.aggregate([
                {
                    $group: {
                        _id: { $month: "$created" },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { "_id": 1 }
                }
            ]);

            const subscriptionCountsByMonth = await Subscription.aggregate([
                {
                    $group: {
                        _id: { $month: "$createdAt" },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { "_id": 1 }
                }
            ]);

            const userCountsByMonthWithLabel = userCountsByMonth.map(item => ({
                month: item._id,
                count: item.count,
                label: `Mois ${item._id}`
            }));

            const subscriptionCountsByMonthWithLabel = subscriptionCountsByMonth.map(item => ({
                month: item._id,
                count: item.count,
                label: `Mois ${item._id}`
            }));

            return {
                userCountsByMonth: userCountsByMonthWithLabel,
                subscriptionCountsByMonth: subscriptionCountsByMonthWithLabel
            };
        } catch (error) {
            console.error('Error fetching user and subscription counts:', error);
            throw error;
        }
    },
}

module.exports = StatisticController;