(function($){


    $(function()
    {
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
            fetch('/users/logout', {
               method:'POST'
            }).then(response=>{
                return response.json();
            }).then(responseJSON=>{
                if(responseJSON.success)
                {
                    $('.loggedOutOnly').show();
                    $('.loggedInOnly').hide();
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
            }).then(responseJSON=>{
                if(responseJSON.success)
                {
                    $('#logged_in_user_email').text(responseJSON.user.email);
                    $('.loggedOutOnly').hide();
                    $('.loggedInOnly').show();
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

                });
                $('#loginModal').modal('show');
            }
        });
    });
})(window.jQuery);