document.addEventListener('DOMContentLoaded',function() {
    var ticketAssets = [];
    var ticketId;
    window.app.initialized()
        .then(function(_client) {
            var assetsListEl = document.getElementById("assosiated_assets");
            var client = _client;
            client.data.get("ticket").then(
                function(res) {
                    ticketId = res.ticket.display_id
                    client.data.get("ticketAssets").then(
                        function(data) {
                            ticketAssets = data.ticketAssets;
                            appendChild(ticketAssets);
                            client.db.set(`ticket${ticketId}`, ticketAssets).then(function (data) {})
                        },
                        function(error) {
                            // failure operation
                        }
                    );
                },
                function(error) {
                    // failure operation
                }
            );
            
            client.events.on("ticket.assetAssociated", (data) => {
                client.request.get(`https://<%=iparam.freshservice_subdomain%>.freshservice.com/api/v2/tickets/${ticketId}?include=assets`, {
                    headers: {
                        Authorization: "Basic <%= encode(iparam.freshservice_api_key)%>",
                        "Content-Type": "application/json;charset=utf-8"
                    }
                }).then(function (res) {
                        let data = JSON.parse(res.response);
                        ticketAssets = data.ticket.assets;
                        client.db.set(`ticket${ticketId}`, ticketAssets).then(function (data) {})
                        deleteChild(assetsListEl, "ul");
                        appendChild(ticketAssets);
                }).catch(function (error) {
                    console.error(error);
                });
            });

            function openModal(event) {
                client.interface.trigger("showModal", {
                    title: "Spaces",
                    template: "./space-intelligence/build/index.html",
                    data: {assetId: event.data.asset.id, page:'ticket'}
                }).then(function(data) {
                }).catch(function(error) {
                });
            }

            function appendChild(ticketAssets) { 
                ticketAssets.forEach(asset => {
                    let $element = $(`<li class="assets-list"><img class="locate" src="./locate.svg"/>${asset.name}</li>`);
                    $element.attr('id', asset.id);
                    $element.on( "click", {asset: asset}, openModal)
                    $('#assosiated_assets').append($element);
                }); 
            } 

            function deleteChild() { 
                $("#assosiated_assets").empty();
            } 
        })
});