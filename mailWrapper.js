import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service:'gmail',
    auth: {
        user: 'my.oa.paperwork@gmail.com',
        pass: 'acfdcoaugzwyxruz'
    }
});

function sendMail(mailObject)
{
    return new Promise((resolve, reject)=> {
        mailObject.from = 'doNotReply@moap.org';
        transporter.sendMail(mailObject, function (error, info) {
            if (error) {
                console.log(error);
                reject(error);
            }
            resolve(info);
        });
    });
}

export default sendMail;