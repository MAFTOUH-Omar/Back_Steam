PayPal: async (subscriptionId) => {
    try {
        // Récupérer l'abonnement existant en utilisant l'ID de l'abonnement
        const subscription = await Subscription.findById(subscriptionId).populate('packageId');
        if (!subscription) {
            return { success: false, message: 'Abonnement non trouvé.' };
        }

        // Vérifier que les propriétés nécessaires de l'abonnement et du package sont définies
        if (!subscription.packageId || !subscription.packageId.name || !subscription.packageId.price || !subscription.packageId.currency) {
            return { success: false, message: 'Les informations de paiement de l\'abonnement sont incomplètes.' };
        }

        const package = subscription.packageId;

        const create_payment_json = {
            intent: 'sale',
            payer: {
                payment_method: 'paypal'
            },
            transactions: [{
                item_list: {
                    items: [{
                        name: package.name,
                        sku: subscription._id.toString(),
                        price: package.price.toFixed(2),
                        currency: package.currency,
                        quantity: 1
                    }]
                },
                amount: {
                    currency: package.currency,
                    total: package.price.toFixed(2)
                },
                description: 'Achat d\'abonnement'
            }]
        };

        // Créer une promesse pour gérer la réponse de PayPal
        return new Promise((resolve, reject) => {
            paypal.payment.create(create_payment_json, async (error, payment) => {
                if (error) {
                    console.error(error);
                    reject({ success: false, message: 'Une erreur est survenue lors de la création du paiement PayPal.' });
                } else {
                    // Mettre à jour les champs dans le modèle de souscription
                    for(let i = 0 ; i < payment.links.length ; i++){
                        if(payment.links[i].rel === 'approval_url'){
                            res.redirect(payment.links[i].href);
                        }
                    }
                    subscription.paymentMethod = 'paypal';
                    subscription.paymentStatus = 'success';
                    subscription.paymentId = payment.id;
                    subscription.paymentDate = new Date();
                    subscription.activationStatus = true;
                    await subscription.save();

                    resolve({ success: true, message: 'Le paiement a été créé avec succès.' });
                }
            });
        });
    } catch (error) {
        console.error('Erreur lors de la tentative de paiement PayPal:', error);
        return { success: false, message: 'Une erreur est survenue lors de la tentative de paiement PayPal.' };
    }
}