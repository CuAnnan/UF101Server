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

async function decryptAndPopulateForm(password, user)
{
    $('#registration_submit_to').val('update');
    $('#registration_email').val(user.email);
    $('#registration_firstname').val(user.firstname);
    $('#registration_lastname').val(user.lastname);
}

async function encryptAndSubmitForm(password, form)
{
    // create a blank FormData object
    const formData = new FormData();

    // lambda to store fields in the form, encrypting if necessary, removing the prefix which is just to prevent
    // ambiguity in the HTML structure
    const stripPrefixAndAddToFormData = async (key, encryptField=false)=> {
        if(form.elements[key].value)
        {
            let data = form.elements[key].value;
            if(encryptField)
            {
                data = await encrypt(data, encryptionKey);
            }
            formData.append(key.replace('registration_', ''), data);
        }
    };

    // set and store the password hash
    formData.append('passwordHash',await hashPassword(password));

    // set the encryption key, wrap it and store the wrapped key
    $modalFeedback.innerText = 'Generating secure key for encrypting data';
    let encryptionKey = await getEncryptionKey();
    let wrappedKey = await wrapCryptoKey(encryptionKey, password);
    formData.append('wrappedEncryptionKey', wrappedKey);

    await stripPrefixAndAddToFormData('registration_email');
    await stripPrefixAndAddToFormData('registration_firstname');
    await stripPrefixAndAddToFormData('registration_lastname');
    await stripPrefixAndAddToFormData('registration_submit_to');


    // encrypt and secure the privileged data
    $modalFeedback.innerText = 'Encrypting sensitive data';
    await stripPrefixAndAddToFormData('registration_uasOperatorRegistrationNumber', true);
    await stripPrefixAndAddToFormData('registration_stsCertificateNumber', true);
    await stripPrefixAndAddToFormData('registration_operationAuthorisationApprovalNumber', true);

    const response = await fetch(
        '/users/account',
        {
            method:"POST",
            body: formData
        }
    );
    return response.json();
}


window.addEventListener('load', function(){
    const $form = document.getElementById('registration_form');
    const $formElements = $form.elements;
    const formElementsArray = Array.from($form.elements);
    const $passwordFeedback = document.getElementById('registration_password_feedback');
    const $emailFeedback = document.getElementById('registration_email_feedback');
    const $modal = $('#registration_modal').modal({backdrop:'static'});
    const $modalFeedback = document.getElementById('registrationModalFeedBack');

    document.getElementById('registration_registerButton').addEventListener('click', function(){

        formElementsArray.forEach((element)=>{
            element.classList.remove('is-invalid');
        });
        const password = $formElements['registration_password'].value;

        if(password !== $formElements['registration_passwordConfirmation'].value)
        {
            $passwordFeedback.innerText = "Password mismatch";
            $formElements['registration_password'].classList.add('is-invalid');
        }
        else
        {
            let error = validatePassword(password);
            if(error)
            {
                $passwordFeedback.innerText = error;
                $formElements['registration_password'].classList.add('is-invalid');
                return null;
            }
            if($formElements['registration_email'].value !== $formElements['registration_emailConfirmation'].value)
            {
                $formElements['registration_email'].classList.add('is-invalid');
                $emailFeedback.innerText = 'Email mismatch';
                return null;
            }
            if(!$formElements['registration_privacy'].checked)
            {
                $formElements['registration_privacy'].classList.add('is-invalid');
                return null;
            }

            $modal.modal('show');
            $modalFeedback.innerText = 'Securing your password';
            encryptAndSubmitForm(password, $form).then((response)=> {
                if(response.success)
                {
                    $($form).hide();
                    document.getElementById('registration_email_sent').innerText = $formElements['registration_email'].value;
                    $('#registration_success').show();
                }
                else
                {
                    if(response.error && response.error.keyPattern)
                    {
                        // get the offending duplicate field
                        const duplicate = Object.keys(response.error.keyPattern)[0];
                        if(duplicate === 'email')
                        {
                            $formElements['registration_email'].classList.add('is-invalid');
                            $emailFeedback.innerText = 'Email already in use';
                        }
                        else
                        {
                            console.log(duplicate);
                        }
                    }
                }
                $modal.modal('hide');
            });
        }
    });
});