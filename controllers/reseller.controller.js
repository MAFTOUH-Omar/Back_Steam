const User = require('../models/user.model')
const Subscription = require('../models/subscription.model')

const ResellerController = {
    updateResellerStatus : async (userId) => {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }
    
            const successfulSubscriptionsCount = await Subscription.countDocuments({
                user: userId,
                paymentStatus: 'success'
            });
    
            if (successfulSubscriptionsCount >= 5 && !user.reseller) {
                user.reseller = true;
                await user.save();
                console.log(`User ${userId} has been promoted to reseller.`);
            }

            return { reseller: user.reseller };
        } catch (error) {
            console.error('Error updating reseller status:', error);
            throw error;
        }
    }
}
module.exports = ResellerController;