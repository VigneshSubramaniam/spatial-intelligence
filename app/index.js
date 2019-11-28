document.addEventListener('DOMContentLoaded',function() {
    document.getElementById("openModal").addEventListener('click', function() {
        window.app.initialized()
        .then(function(_client) {
            console.log('inside client', _client)
            var client = _client;
            client.interface.trigger("showModal", {
            title: "Sample Modal",
            template: "./space-intelligence/build/index.html",
            data: {ticketId: 4}
            }).then(function(data) {
                console.log("Kanna", data)
            }).catch(function(error) {
                console.log(error);
            });
        }).catch(function(error) {
        console.log(error);
        })
    });
});