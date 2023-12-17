const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service : 'gmail' ,
    auth: {
        user :  'omar.maftou0000@gmail.com',
        pass : 'tdia kafi tlqs umnu'
    }
});

const sendCredentialsEmail = ( user ) => {
    return new Promise((resolve, reject) => {
    const confirmationLink = `https://api-steam-v3.vercel.app/auth/confirm-signup/${user.token}`;
    const mailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: "Your Login Credentials",
        html: `
            <div style="background-color: #ecfccb; padding: 50px 30px; display: flex; justify-content: center; align-items: center; height: 100vh;">
                <div style="background-color: #f7fee7; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);text-align: center;">
                    <h2 style="color: #1e293b; margin-bottom: 20px; font-size: 24px;">Greetings, ${user.FirstName}&nbsp;${user.LastName}!</h2>
                    <p style="font-size: 18px; margin-bottom: 20px; color: #374151;">Your login credentials are ready:</p>
                    <ul style="font-size: 18px; list-style-type: none; padding-left: 0; margin-bottom: 20px;">
                        <li><strong style="color: #1e293b;">First Name:</strong> ${user.FirstName}</li>
                        <li><strong style="color: #1e293b;">Last Name:</strong> ${user.LastName}</li>
                        <li><strong style="color: #1e293b;">Email:</strong> ${user.email}</li>
                        <li><strong style="color: #1e293b;">Password:</strong> ${user.password}</li>
                    </ul>
                    <a href='${confirmationLink}' style="display: inline-block; padding: 12px 60px; background-color: #84cc16; color: #fff; text-decoration: none; border-radius: 5px; transition: background-color 0.3s; font-size: 18px;">Verify Account</a>
                    <p style="font-size: 18px; color: #374151; margin-top: 20px;">Thank you for choosing our service at Steam.</p>
                </div>
            </div>
        `};

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email:", error);
            reject(error);
        } else {
            console.log("Email sent:", info.response);
            resolve(info.response);
        }
    });
})
};

module.exports = sendCredentialsEmail;