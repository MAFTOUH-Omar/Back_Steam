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
        subject: "Steam Sign Up Verification (code: Clean Cow)",
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
                <h1>Welcome ${user.FirstName}</h1>
              <h1 style="color:#333;font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,&quot;Roboto&quot;,&quot;Oxygen&quot;,&quot;Ubuntu&quot;,&quot;Cantarell&quot;,&quot;Fira Sans&quot;,&quot;Droid Sans&quot;,&quot;Helvetica Neue&quot;,sans-serif;font-size:18px;font-weight:normal;margin:30px 0;padding:0">Verify your email to sign up for <b>Steam</b></h1>
            </td></tr>
            </tbody></table>
            
            <p style="color:#000;font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,&quot;Roboto&quot;,&quot;Oxygen&quot;,&quot;Ubuntu&quot;,&quot;Cantarell&quot;,&quot;Fira Sans&quot;,&quot;Droid Sans&quot;,&quot;Helvetica Neue&quot;,sans-serif;font-size:14px;line-height:24px">
                An attempt to sign up has been made with the provided code
            </p>
            <br>
            
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%!important">
              <tbody><tr>
                <td align="center" bgcolor="#f6f6f6" valign="middle" height="40" style="font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,&quot;Roboto&quot;,&quot;Oxygen&quot;,&quot;Ubuntu&quot;,&quot;Cantarell&quot;,&quot;Fira Sans&quot;,&quot;Droid Sans&quot;,&quot;Helvetica Neue&quot;,sans-serif;font-size:16px;font-weight:bold">Clean Cow</td>
              </tr>
            </tbody></table>
            
            <br>
            <p style="color:#000;font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,&quot;Roboto&quot;,&quot;Oxygen&quot;,&quot;Ubuntu&quot;,&quot;Cantarell&quot;,&quot;Fira Sans&quot;,&quot;Droid Sans&quot;,&quot;Helvetica Neue&quot;,sans-serif;font-size:14px;line-height:24px">To complete the signup process, please click on the button below. Please note that by completing your signup you are agreeing to our <a href="#" style="color:#067df7;text-decoration:none" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://vercel.com/terms&amp;source=gmail&amp;ust=1702896804218000&amp;usg=AOvVaw1_l_JNABJ-CAow-VUnHIFT">Terms of Service</a> and <a href="#" style="color:#067df7;text-decoration:none" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://vercel.com/privacy&amp;source=gmail&amp;ust=1702896804218000&amp;usg=AOvVaw2dlcx4jMTLCeECQwslANYP">Privacy Policy</a>:</p>
            <br>
            
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%!important">
              <tbody><tr><td align="center">
            <div>
              
                <a href='${confirmationLink}' style="background-color:#000;border-radius:5px;color:#fff;display:inline-block;font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,&quot;Roboto&quot;,&quot;Oxygen&quot;,&quot;Ubuntu&quot;,&quot;Cantarell&quot;,&quot;Fira Sans&quot;,&quot;Droid Sans&quot;,&quot;Helvetica Neue&quot;,sans-serif;font-size:12px;font-weight:500;line-height:50px;text-align:center;text-decoration:none;width:200px" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://vercel.com/confirm?email%3Domar.ort0000%2540gmail.com%26token%3DGdXqyMfvGnniTBs3fmN5o2Ud%26mode%3Dsignup&amp;source=gmail&amp;ust=1702896804218000&amp;usg=AOvVaw1ASWN_5C0rkZmWLluDYbIe">VERIFY</a>
              
            </div>
            </td></tr>
            </tbody></table>
            
            <br>
            <p style="color:#000;font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,&quot;Roboto&quot;,&quot;Oxygen&quot;,&quot;Ubuntu&quot;,&quot;Cantarell&quot;,&quot;Fira Sans&quot;,&quot;Droid Sans&quot;,&quot;Helvetica Neue&quot;,sans-serif;font-size:14px;line-height:24px">Or copy and paste this URL into a new tab of your browser:</p>
            <p style="color:#000;font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,&quot;Roboto&quot;,&quot;Oxygen&quot;,&quot;Ubuntu&quot;,&quot;Cantarell&quot;,&quot;Fira Sans&quot;,&quot;Droid Sans&quot;,&quot;Helvetica Neue&quot;,sans-serif;font-size:14px;line-height:24px"><a href="${confirmationLink}" style="color:#067df7;text-decoration:none" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://vercel.com/confirm?email%3Domar.ort0000%2540gmail.com%26token%3DGdXqyMfvGnniTBs3fmN5o2Ud%26mode%3Dsignup&amp;source=gmail&amp;ust=1702896804218000&amp;usg=AOvVaw1ASWN_5C0rkZmWLluDYbIe">${confirmationLink}</a></p>
            <br>
            <hr style="border:none;border-top:1px solid #eaeaea;margin:26px 0;width:100%">
            <p style="color:#666666;font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,&quot;Roboto&quot;,&quot;Oxygen&quot;,&quot;Ubuntu&quot;,&quot;Cantarell&quot;,&quot;Fira Sans&quot;,&quot;Droid Sans&quot;,&quot;Helvetica Neue&quot;,sans-serif;font-size:12px;line-height:24px">If you didn't attempt to sign up but received this email, </p>
            </div></td></tr>
            </tbody></table>
            </td></tr>
            </tbody></table><div class="yj6qo"></div><div class="adL">
            </div>
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