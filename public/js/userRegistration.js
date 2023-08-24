let $modalFeedback;

/**
 * @param $password  The field containing the password to validate
 * @param $passwordConfirmation The field containing the password confirmation
 * @param $passwordFeedback The element for the password feedback
 * @returns {Boolean} Returns true if there's nothing wrong with the password or false if there is
 */
function validatePassword($password, $passwordConfirmation, $passwordFeedback)
{
    let error = '';
    const password = $password.value;
    const passwordConfirmation = $passwordConfirmation.value;
    if(password !== passwordConfirmation)
    {
        error = 'Password strings do not match';

    }
    if(password.length < 8)
    {
        error = 'Passwords must be at least 8 characters long';
    }
    else if(password.length < 13 && !(password.match(/[a-z]/) && password.match(/[A-Z]/) && password.match(/[0-9]/) && password.match(/[^a-z^A-Z\d]/)))
    {
        error = 'Passwords with fewer than 13 characters must have at least one upper case letter, one lower case letter, one number, and one character that is not a letter or number';
    }
    else if(password.length < 16 && !(password.match(/[a-z]/) && password.match(/[A-Z]/) && password.match(/[0-9]/)))
    {
        error = 'Passwords with fewer than 13 characters must have at least one upper case letter, one lower case letter, and one number';
    }
    else if(password.length < 20 && !(password.match(/[a-z]/) && password.match(/[A-Z]/)))
    {
        error = 'Passwords with fewer than 13 characters must have at least one upper case letter, and one lower case letter';
    }
    $passwordFeedback.innerText = error;

    return !error;
}

function validateEmail($email, $emailConfirmation)
{
    if($email.value !== $emailConfirmation.value)
    {
        $email.addClass('is-invalid');
        return false;
    }
    return true;
}

/**
 * This is sufficiently verbose a function as to require its own function.
 * @param password
 * @returns {Promise<void>}
 */
async function decryptLoggedInUser(password)
{
    const $feedback = $('#login_decryption_feedback');
    $('.loginPhaseTwo').hide();
    $('.loginPhaseThree').show();
    $feedback.text('Password validated, unwrapping encryption key');

    const user = MOAP_CONTAINER.user;
    const encryptionKey = await unwrapCryptoKey(user.wrappedEncryptionKey, password);
    MOAP_CONTAINER.unwrappedKey = encryptionKey;
    const decryptedUserFields = {
        uasOperatorRegistrationNumber:null,
        stsCertificateNumber: null,
        operationAuthorisationApprovalNumber: null,
        primaryPhoneNumber:null,
        secondaryPhoneNumber:null,
    };
    if(user.uasOperatorRegistrationNumber)
    {
        $feedback.text('Decrypting UAS Operator Registration Number');
        decryptedUserFields.uasOperatorRegistrationNumber = await decrypt(user.uasOperatorRegistrationNumber, encryptionKey);
    }
    if(user.stsCertificateNumber)
    {
        $feedback.text('Decrypting STS Certificate Number');
        decryptedUserFields.stsCertificateNumber = await decrypt(user.stsCertificateNumber, encryptionKey);
    }
    if(user.operationAuthorisationApprovalNumber)
    {
        $feedback.text('Decrypting Operation Authorisation Approval Number');
        decryptedUserFields.operationAuthorisationApprovalNumber = await decrypt(user.operationAuthorisationApprovalNumber, encryptionKey);
    }
    if(user.primaryPhoneNumber)
    {
        $feedback.text('Decrypting Primary Phone Number');
        decryptedUserFields.primaryPhoneNumber = await decrypt(user.primaryPhoneNumber, encryptionKey);
    }
    if(user.secondaryPhoneNumber)
    {
        $feedback.text('Decrypting Secondary Phone Number');
        decryptedUserFields.secondaryPhoneNumber = await decrypt(user.secondaryPhoneNumber, encryptionKey);
    }
    MOAP_CONTAINER.decryptedUserFields = decryptedUserFields;
    MOAP_CONTAINER.password = password;
    $('#loginModal').modal('hide');
    // store the user data, including the password, in the localstorage
    localStorage.setItem('user', btoa(JSON.stringify(MOAP_CONTAINER)));
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
    await stripPrefixAndAddToFormData('registration_primaryPhoneNumber', true);
    await stripPrefixAndAddToFormData('registration_secondaryPhoneNumber', true);

    console.log(formData);

    const response = await fetch(
        '/users/account',
        {
            method:"POST",
            body: formData
        }
    );
    return response.json();
}

function validateFormForUpdate($formElements, $passwordFeedback, $emailFeedback)
{
    if($formElements['registration_password'].value && $formElements['registration_passwordConfirmation'].value)
    {
        if(!validatePassword($formElements['registration_password'], $formElements['registration_passwordConfirmation'], $passwordFeedback))
        {
            return false;
        }
        console.log("As this point I need to implement password management");
    }

    if($formElements['registration_emailConfirmation'].value && $formElements['registration_emailConfirmation'].value)
    {
        if(!validateEmail($formElements['registration_email'].value, $formElements['registration_emailConfirmation'].value))
        {
            return false;
        }
    }

    return true;
}

function validateFormForRegistration($formElements, $passwordFeedback, $emailFeedback)
{
    if(!validatePassword($formElements['registration_password'], $formElements['registration_passwordConfirmation'], $passwordFeedback))
    {
        return false;
    }

    if(!validateEmail($formElements['registration_email'].value, $formElements['registration_emailConfirmation'].value))
    {
        return false
    }

    if(!$formElements['registration_privacy'].checked)
    {
        $formElements['registration_privacy'].classList.add('is-invalid');
        return false;
    }

    return true;
}


window.addEventListener('load', function(){
    const $form = document.getElementById('registration_form');
    const $formElements = $form.elements;
    const formElementsArray = Array.from($form.elements);
    const $passwordFeedback = document.getElementById('registration_password_feedback');
    const $emailFeedback = document.getElementById('registration_email_feedback');
    const $modal = $('#registration_modal').modal({backdrop:'static'});
    $modalFeedback = document.getElementById('registrationModalFeedBack');

    document.getElementById('registration_registerButton').addEventListener('click', function(){

        formElementsArray.forEach((element)=>{
            element.classList.remove('is-invalid');
        });
        let password;


        if($formElements['registration_submit_to'].value === 'register')
        {
            password = $formElements['registration_password'].value;
            if (!validateFormForRegistration($formElements, $passwordFeedback, $emailFeedback))
            {
               return null;
            }
        }
        if($formElements['registration_submit_to'].value === 'update')
        {
            password = MOAP_CONTAINER.password;
            if(!validateFormForUpdate($formElements, $passwordFeedback, $emailFeedback))
            {

                return null;
            }
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
                        const id = `registration_${duplicate}`;
                        console.log(id)
                        $formElements[id].classList.add('is-invalid');
                        document.getElementById(`${id}_feedback`).innerText=`Dupicate ${duplicate}`;
                    }
                }
            }
            $modal.modal('hide');
        });

    });
});