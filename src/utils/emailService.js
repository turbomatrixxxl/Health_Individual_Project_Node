/* eslint-disable no-undef */
// const sgMail = require('@sendgrid/mail');
// const { v4: uuidv4 } = require('uuid');

// require('dotenv').config();

// // eslint-disable-next-line no-undef
// const senderEmail = process.env.SECRET_EMAIL;

// const sendVerificationEmail = async (email) => {
//   const verificationToken = uuidv4();
//   const verificationUrl = `https://health-individual-project-node.onrender.com/api/users/verify/${verificationToken}`;

//   if (!senderEmail) throw new Error('Sender email is missing.');

//   const msg = {
//     to: email,
//     from: senderEmail,
//     subject: 'Account Verification Email',
//     text: `Your verification code is ${verificationToken}. Verify your account here: ${verificationUrl}`,
//     html: `<p>Your verification code is: <strong>${verificationToken}</strong></p>
//            <p>Click <a href="${verificationUrl}">here</a> to verify your account.</p>`,
//   };

//   try {
//     await sgMail.send(msg);
//     console.log('Verification email sent!');
//     return verificationToken; // Return the token for saving in the database if needed
//   } catch (error) {
//     console.error('Email not sent! Error:', error.message);
//     throw new Error(`Email not sent! The error is: ${error.message}`);
//   }
// };

// module.exports = sendVerificationEmail;

const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

require('dotenv').config();

// console.log('SECRET_EMAIL:', process.env.SECRET_EMAIL);
// console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD);

const senderEmail = process.env.SECRET_EMAIL;
const senderPass = process.env.GMAIL_APP_PASSWORD; // parola de aplicație Gmail

// configurare nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: senderEmail,
    pass: senderPass,
  },
});

const sendVerificationEmail = async (email) => {
  const verificationToken = uuidv4();
  const verificationUrl = `https://health-individual-project-node.onrender.com/api/users/verify/${verificationToken}`;

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
    await transporter.sendMail(msg);
    console.log('Verification email sent!');
    return verificationToken; // Return the token for saving in the database if needed
  } catch (error) {
    console.error('Email not sent! Error:', error.message);
    throw new Error(`Email not sent! The error is: ${error.message}`);
  }
};

module.exports = sendVerificationEmail;
