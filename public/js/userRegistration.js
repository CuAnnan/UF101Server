
window.addEventListener('load', function(){
    /**
     * @param password  The password to validate
     * @returns {null|string} Returns null if there's nothing wrong with the password or the password validation error
     */
    function validatePassword(password)
    {
        if(password.length < 8)
        {
            return 'Passwords must be at least 8 characters long';
        }
        else if(password.length < 13 && !(password.match(/[a-z]/) && password.match(/[A-Z]/) && password.match(/[0-9]/) && password.match(/[^a-z^A-Z\d]/)))
        {
            return 'Passwords with fewer than 13 characters must have at least one upper case letter, one lower case letter, one number, and one character that is not a letter or number';
        }
        else if(password.length < 16 && !(password.match(/[a-z]/) && password.match(/[A-Z]/) && password.match(/[0-9]/)))
        {
            return 'Passwords with fewer than 13 characters must have at least one upper case letter, one lower case letter, and one number';
        }
        else if(password.length < 20 && !(password.match(/[a-z]/) && password.match(/[A-Z]/)))
        {
            return 'Passwords with fewer than 13 characters must have at least one upper case letter, and one lower case letter';
        }
        return null;
    }

    async function encryptAndSubmitForm(password, form)
    {
        const formData = new FormData(form);
        // remove unencrypted form data fields
        formData.delete('registration_password');
        formData.delete('registration_passwordConfirmation');
        formData.delete('registration_openCategoryId');
        formData.delete('registration_specificCategoryId');
        formData.delete('registration_operationalAuthorisationId');


        formData.append('passwordHash',await hashPassword(password));
        $modalFeedback.innerText = 'Generating secure key for encrypting data';
        // generate the encryption key to encrypt sensitive data
        let encryptionKey = await getEncryptionKey();
        let wrappedKey = await wrapCryptoKey(encryptionKey, password);
        formData.append('wrappedEncryptionKey', wrappedKey);
        let unwrappedKey = await unwrapCryptoKey(wrappedKey, password);

        $modalFeedback.innerText = 'Encrypting sensitive data';
        let encryptedOCId = await encrypt(form.elements['registration_openCategoryId'].value, encryptionKey);

        formData.append('openCategoryId', encryptedOCId);
        console.log(await decrypt(encryptedOCId, unwrappedKey));

    }

    const $password = document.getElementById('registration_password');
    const $passwordConfirmation = document.getElementById('registration_passwordConfirmation');
    const $form = document.getElementById('registration_form');
    const $formElements = Array.from($form.elements);
    const $passwordFeedback = document.getElementById('passwordFeedback');
    const $modal = $('#registration_modal').modal({backdrop:'static'});
    const $modalFeedback = document.getElementById('registrationModalFeedBack');

    document.getElementById('registration_registerButton').addEventListener('click', function(){

        $formElements.forEach((element)=>{
            element.classList.remove('is-invalid');
        });
        const password = $password.value;

        if(password !== $passwordConfirmation.value)
        {
            $password.innerText = "Password strings do not match";
            $password.classList.add('is-invalid');
        }
        else
        {
            const error = validatePassword(password);
            if(error)
            {
                $passwordFeedback.innerText = error;
                $password.classList.add('is-invalid');
            }
            else
            {

                $modal.modal('show');
                $modalFeedback.innerText = 'Securing your password';
                encryptAndSubmitForm(password, $form).then(()=> {
                    $modal.modal('hide');
                });
            }
        }
    });
});