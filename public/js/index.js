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
    });
})(window.jQuery);