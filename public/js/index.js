const MOAP_CONTAINER = {

};

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
        operationAuthorisationApprovalNumber: null
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
    MOAP_CONTAINER.decryptedUserFields = decryptedUserFields;
    MOAP_CONTAINER.password = password;
    $('#loginModal').modal('hide');
    // store the user data, including the password, in the localstorage
    localStorage.setItem('user', btoa(JSON.stringify(MOAP_CONTAINER)));
}


function updateLoggedInStatus(loggedIn)
{
    if(loggedIn)
    {
        const user = MOAP_CONTAINER.user;
        const decrypted = MOAP_CONTAINER.decryptedUserFields;
        $('form .loggedInOnlyRow').removeClass('d-none');
        $('#account-tab').text('Account details');
        $('#logged_in_user_email').text(user.email);
        const $formElements = document.getElementById('registration_form').elements;
        $formElements['registration_firstname'].value = user.firstname;
        $formElements['registration_lastname'].value = user.lastname;
        $formElements['registration_email'].value=user.email;
        for(const [key, val] of Object.entries(decrypted))
        {
           $formElements[`registration_${key}`].value=val;
        }
    }
    else
    {
        $('.loggedOutOnly').show();
        $('.loggedInOnly').hide();
        $('.loginPhaseOne').show();
        $('.loginPhaseTwo').hide();
        $('form .loggedInOnly').addClass('d-none');
        $('#account-tab').text('Register');
        document.getElementById('registration_form').reset();
    }
}

(function($){


    $(function()
    {
        /*
         * Check if the user is logged in on the server side
         */
        fetch('/users/checkLoginStatus',{
            method:'POST'
        }).then(async response=>{
            const json = await response.json();
            if(json.user){
                // if so, unpack the user
                const userString = localStorage.getItem('user');
                if(userString)
                {
                    const json = JSON.parse(atob(userString));
                    for(const [key, value] of Object.entries(json))
                    {
                        MOAP_CONTAINER[key] = value;
                    }
                    await decryptLoggedInUser(MOAP_CONTAINER.password);
                    updateLoggedInStatus(true);
                }
                else
                {
                    // there's nothing in localstorage. It could have been cleared.
                    console.log('Local storage empty. Logging out fully.')
                    fetch('/users/logout',{method:'POST'}).then(()=>{
                        window.location.reload();
                        updateLoggedInStatus(false);
                    });
                }
            }
            else
            {
                // just double check that a logged out user has nothing in the localstore
                localStorage.clear();
            }
        });

        // function to handle the url stuff
        const hash = window.location.hash;
        $(".nav-tabs").find("li button").each(function(key, value) {
            let $button = $(value);
            let target = $button.data('bsTarget');
            if (hash === target)
            {
                $button.tab('show');
            }
            $button.click(function() {
                window.location.hash = $(this).data('bsTarget');
            });
        });

        // handle the logout button
        $('#logoutNav').click(function(){
            fetch('/users/logout',{
                method:'POST'
            }).then(response=>{
                localStorage.clear();
                return response.json();
            }).then(responseJSON=>{
                if(responseJSON.success)
                {
                    document.getElementById('registration_form').reset();
                    updateLoggedInStatus(false);
                }
            });
        });

        /*
        Handle the login process.
        Part One.
        This is actually an involved process. The login mechanism involves sending a request
        to the server to get it to generate and email the user a login key. That key and a key from an authenticator
        are then used to actually login
         */
        $('#login_button').click(function(){
            const $form = this.form;
            const $elements = $form.elements;
            let formData = new FormData();
            let email = $elements['login_email'].value;
            $('#login_form_email').val(email);

            formData.append('email', email);
            if(email)
            {

                fetch(
                    '/users/requestLoginTokens',
                    {
                        method:"POST",
                        body: formData
                    }
                ).then((response)=>{
                    // I need a handler for this as unhandled promises will cause problems in future versions of JS
                    response.json().then(
                        (json)=>{
                            console.log(json);
                        }
                    );
                });
                // just show the login modal for the keys immediately. No point in waiting.
                $('#loginModal').modal('show');
            }
        });
        /*
        Handle the login process.
        Part Two.
        Check the two keys against the TOTPs on the server
         */
        $('#login_form_login_button').click(function(){
            const $elements = this.form.elements;
            const formData = new FormData();
            formData.append('email',$elements['login_form_email'].value);
            formData.append('emailKey',$elements['login_form_email_key'].value);
            formData.append('authKey', $elements['login_form_auth_key'].value);

            fetch(
                '/users/login',
                {
                    method:'POST',
                    body:formData
                }
            ).then((response)=>{
                return response.json();
            }).then(async responseJSON=>{
                if(responseJSON.success)
                {
                    // store the user in the DOM
                    MOAP_CONTAINER.user = responseJSON.user;
                    // update some fields
                    updateLoggedInStatus(true);
                }
            });
        });

        /*
        Handle the login process.
        Part Three.
        Decrypt the returned data
         */
        $('#decrypt_button').click(function(){
            const [algorithm, digest, iterationsString, salt, hash] = MOAP_CONTAINER.user.passwordHash.split(':');
            const iterations = parseInt(iterationsString);
            const password =$('#decryption_password').val();
            verifyPassword(
                password,
                {algorithm, digest, iterations, salt, hash}
            ).then(async (valid)=>{
                await decryptLoggedInUser(password);
            });
        });
    });
})(window.jQuery);