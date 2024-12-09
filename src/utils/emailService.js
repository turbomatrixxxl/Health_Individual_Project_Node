const sgMail = require('@sendgrid/mail');
const { v4: uuidv4 } = require('uuid');

require('dotenv').config();

// eslint-disable-next-line no-undef
const senderEmail = process.env.SECRET_EMAIL;

const sendVerificationEmail = async (email) => {
  const verificationToken = uuidv4();
  const verificationUrl = `http://localhost:5000/api/users/verify/${verificationToken}`;

  if (!senderEmail) throw new Error('Sender email is missing.');

  const msg = {
    to: email,
    from: senderEmail,
    subject: 'Account Verification Email',
    text: `Your verification code is ${verificationToken}. Verify your account here: ${verificationUrl}`,
    html: `<p>Your verification code is: <strong>${verificationToken}</strong></p>
           <p>Click <a href="${verificationUrl}">here</a> to verify your account.</p>`,
  };

  try {
    await sgMail.send(msg);
    console.log('Verification email sent!');
    return verificationToken; // Return the token for saving in the database if needed
  } catch (error) {
    console.error('Email not sent! Error:', error.message);
    throw new Error(`Email not sent! The error is: ${error.message}`);
  }
};

module.exports = sendVerificationEmail;
