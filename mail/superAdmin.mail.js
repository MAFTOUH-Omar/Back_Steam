const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service : 'gmail' ,
    auth: {
        user :  'omar.maftou0000@gmail.com',
        pass : 'tdia kafi tlqs umnu'
    }
});

const sendCredentialsEmail = ( supAdmin ) => {
    return new Promise((resolve, reject) => {
    const mailOptions = {
        from: process.env.EMAIL,
        to: supAdmin.email,
        subject: "Steam Sign In Verification As Super Admin",
        html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Document</title>
            </head>
            <body>
            <div class="adM">
            </div><table width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%!important">
                <tbody><tr><td align="center">
            <table style="border:1px solid #eaeaea;border-radius:5px;margin:40px 0" width="600" border="0" cellspacing="0" cellpadding="40">
                <tbody><tr><td align="center"><div style="font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,&quot;Roboto&quot;,&quot;Oxygen&quot;,&quot;Ubuntu&quot;,&quot;Cantarell&quot;,&quot;Fira Sans&quot;,&quot;Droid Sans&quot;,&quot;Helvetica Neue&quot;,sans-serif;text-align:left;width:465px">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%!important">
            <tbody><tr><td align="center">
                <h2>Steam Sign In Verification</h2>
            </td></tr>
            </tbody></table>
            
            <p style="color:#000;font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,&quot;Roboto&quot;,&quot;Oxygen&quot;,&quot;Ubuntu&quot;,&quot;Cantarell&quot;,&quot;Fira Sans&quot;,&quot;Droid Sans&quot;,&quot;Helvetica Neue&quot;,sans-serif;font-size:14px;line-height:24px">
                An attempt to sign in has been made. Use the following verification code
            </p>
            <br>
            
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%!important">
            <tbody><tr>
                <td align="center" bgcolor="#f6f6f6" valign="middle" height="40" style="font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,&quot;Roboto&quot;,&quot;Oxygen&quot;,&quot;Ubuntu&quot;,&quot;Cantarell&quot;,&quot;Fira Sans&quot;,&quot;Droid Sans&quot;,&quot;Helvetica Neue&quot;,sans-serif;font-size:16px;font-weight:bold">${supAdmin.code}</td>
            </tr>
            </tbody></table> 
        </body>
        </html>
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