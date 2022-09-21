import nodemailer from 'nodemailer';

const transport = {
    host: process.env.MAIL_HOST ?? 'smtp.gmail.com',
    port: process.env.MAIL_PORT != undefined ? +process.env.MAIL_PORT : 465,
    secure: true,
    auth: {
        user: process.env.MAIL,
        pass: process.env.MAIL_PW
    },
};
const transporter = nodemailer.createTransport(transport);

export function sendMails(from: string, to: string[], subjects: string, HTMLContent: string) {
    const mailOptions = {
        from: from,
        to: to,
        subject: subjects,
        html: HTMLContent,
    };

    return transporter.sendMail(mailOptions);
}