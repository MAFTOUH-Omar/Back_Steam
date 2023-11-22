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
    const confirmationLink = `http://localhost:3030/auth/confirm-signup/${user.token}`;
    const mailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: "Your Login Credentials",
        html: `
            <div style="background-color: #f0f0f0; padding: 20px;">
                <div style="background-color: #ffffff; padding: 20px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                    <h2 style="color: #000;">Hello ${user.FirstName}&nbsp;${user.LastName},</h2>
                    <p style="font-size: 16px;">Your login credentials are as follows:</p>
                    <ul style="font-size: 16px; list-style-type: none; padding-left: 0;">
                        <li><strong>First Name :</strong> ${user.FirstName}</li>
                        <li><strong>Last Name :</strong> ${user.LastName}</li>
                        <li><strong>Email :</strong> ${user.email}</li>
                        <li><strong>Password :</strong> ${user.password}</li>
                    </ul>
                    <a href='${confirmationLink}' style="display: inline-block; padding: 10px 20px; background-color: #84cc16; color: #fff; text-decoration: none; border-radius: 5px;">Sign In</a>
                    <p style="font-size: 16px;">Please log in and change your password immediately for security reasons.</p>
                    <p style="font-size: 16px;">Thank you for choosing our service.</p>
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