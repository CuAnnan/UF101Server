const MOAP_CONTAINER = {

};

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
    $('#loginModal').modal('hide');
    localStorage.setItem('user', btoa(JSON.stringify(MOAP_CONTAINER)));
}


function updateLoggedInStatus(loggedIn)
{
    if(loggedIn)
    {
        $('.loggedOutOnly').hide();
        $('.loggedInOnly').show();
        $('.loginPhaseOne').hide();
        $('.loginPhaseTwo').show();
        $('form .loggedInOnly').removeClass('d-none');
        $('#account-tab').text('Account details');
    }
    else
    {
        $('.loggedOutOnly').show();
        $('.loggedInOnly').hide();
        $('.loginPhaseOne').show();
        $('.loginPhaseTwo').hide();
        $('form .loggedInOnly').addClass('d-none');
        $('#account-tab').text('Register');
    }
}

(function($){


    $(function()
    {

        fetch('/users/checkLoginStatus',{
            method:'POST'
        }).then(async response=>{
            const json = await response.json();
            if(json.user){

            }
            else
            {
                localStorage.clear();
            }
        });

        const hash = window.location.hash;
        // function to handle the url stuff
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

        $('#logoutNav').click(function(){
            fetch('/users/logout',{
                method:'POST'
            }).then(response=>{
                return response.json();
            }).then(responseJSON=>{
                if(responseJSON.success)
                {
                    document.getElementById('registration_form').reset();
                    updateLoggedInStatus(false);
                }
            });
        });

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
                    MOAP_CONTAINER.user = responseJSON.user;
                    updateLoggedInStatus(true);
                }
            });
        });

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
                    response.json().then(
                        (json)=>{
                            console.log(json);
                        }
                    );
                });
                $('#loginModal').modal('show');
            }
        });

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

        const userString = localStorage.getItem('user');
        if(userString)
        {
            const json = JSON.parse(atob(userString));
            console.log(json);
        }
    });
})(window.jQuery);