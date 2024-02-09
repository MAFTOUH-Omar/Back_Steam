const paypal = require('@paypal/checkout-server-sdk')
const Subscription = require('../models/subscription.model')
const Package = require('../models/packages.model')

// PayPal Cardinality
const clientId = process.env.CLIENT_ID_PAYPAL ;
const clientSecret = process.env.SECRET_KEY ;

// Configurez l'environnement PayPal
const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
const client = new paypal.core.PayPalHttpClient(environment);

const PayementController = {
    PayPal: async (idSubscription) => {
        try {
            // Récupérer l'abonnement existant en utilisant l'idSubscription
            const subscription = await Subscription.findById(idSubscription);
            if (!subscription) {
                return { success: false, message: 'Abonnement non trouvé.' };
            }
            
            // Récupérer les détails du package à partir de l'abonnement
            const package = await Package.findById(subscription.packageId);
            if (!package) {
                return { success: false, message: 'Package non trouvé.' };
            }

            // Créer une commande PayPal avec le montant du package
            const request = new paypal.orders.OrdersCreateRequest();
            request.prefer("return=representation");
            request.requestBody({
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: {
                        currency_code: package.currency,
                        value: package.price.toFixed(2)
                    }
                }]
            });
    
            // Exécuter la requête PayPal pour créer la commande
            const response = await client.execute(request);
    
            // Si le paiement est réussi, mettre à jour le modèle Subscription
            if (response.statusCode === 201) {
                const order = response.result;
                const paymentId = order.id;
                const paymentDate = new Date(order.create_time);
    
                // Mettre à jour les champs paymentId et paymentDate dans l'abonnement
                subscription.paymentId = paymentId;
                subscription.paymentDate = paymentDate;
                subscription.paymentStatus = 'success';
    
                await subscription.save();
                
                // Retourner la réussite avec l'URL de paiement PayPal
                return { success: true, message: 'Paiement effectué avec succès.', paypalUrl: order.links.find(link => link.rel === 'approve').href };
            } else {
                return { success: false, message: 'Le paiement a échoué.' };
            }
        } catch (error) {
            console.error('Erreur lors de la tentative de paiement PayPal:', error);
            return { success: false, message: 'Une erreur est survenue lors de la tentative de paiement PayPal.' };
        }
    }
}

module.exports = PayementController;