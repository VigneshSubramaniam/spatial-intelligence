document.addEventListener('DOMContentLoaded',function() {
    var asset = {};
    window.app.initialized()
        .then(function(_client) {
            var client = _client;
            deleteChild();
            client.data.get("asset").then(
                function(data) {
                    asset = data.asset;
                    appendChild(asset);
                },
                function(error) {
                    // failure operation
                }
            );

            function openModal(event) {
                console.log(event.data)
                client.interface.trigger("showModal", {
                    title: "Sample Modal",
                    template: "./space-intelligence/build/index.html",
                    data: {assetId: event.data.asset.display_id, page:'asset'}
                }).then(function(data) {
                }).catch(function(error) {
                });
            }

            function appendChild(asset) { 
                let $element = $(`<li class="assets-list"><img class="locate" src="./locate.svg"/>${asset.name}</li>`);
                $element.attr('id', asset.id);
                $element.on( "click", {asset: asset}, openModal)
                $('#assosiated_assets').append($element);
            } 

            function deleteChild() { 
                $("#assosiated_assets").empty();
            } 
        })
});