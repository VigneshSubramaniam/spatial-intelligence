document.addEventListener('DOMContentLoaded',function() {
    window.app.initialized()
        .then(function(_client) {
            var client = _client;
            client.events.on("app.activated", onAppActivated);
            
            function onAppActivated() {
                document.getElementById("hawk_eye").click();
            }

            $('#hawk_eye').click(function() {
                client.interface.trigger("showModal", {
                    title: "Sample Modal",
                    template: "./space-intelligence/build/index.html",
                    data: {page:'hawk_eye'}
                }).then(function(data) {
                }).catch(function(error) {
                });
              });
        })
});