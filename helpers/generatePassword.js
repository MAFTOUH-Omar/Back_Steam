const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d|\W).+$/;

const generateRandomPassword = () => {
    const passwordLength = 8;
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';

    let newPassword = '';
    
    while (!passwordRegex.test(newPassword)) {
        newPassword = '';
        for (let i = 0; i < passwordLength ; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            newPassword += characters.charAt(randomIndex);
        }
    }

    return newPassword;
};

module.exports = generateRandomPassword;