import React, { Component } from 'react';
import map from './ground_floor.png'
import styled from 'styled-components'
import ReactCrop, { makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import './Builder.css';
import { cloneDeep, isEqual } from 'lodash'
import {Tooltip} from 'react-tippy'
import { isDeepStrictEqual } from 'util';


class Builder extends Component {
    constructor(props) {
        super(props);
        this.state = {
            crop: {
                x: 10,
                y: 10,
                width: 0,
                height: 0,
            },
            selectedBlock: null,
            blocks: [],
            showAllAssets: false,
            showAssetDetails: false,
            allAssets:[],
            allTickets: [],
            showAllTickets: false,
            allowEdit: false
        }
        
        this.styleMap = {
            "low": {
                "backgroundColor": "#1CB697",
                "boxShadow": "0 2px 4px 0 #00B797, 0 2px 10px 0 #00B897"
            },
            "medium": {
                "backgroundColor": "#459FFC",
                "boxShadow": "0 2px 4px 0 #459FFC, 0 2px 10px 0 #459FFC"
            },
            "high":{
                "backgroundColor": "#F69A3C",
                "boxShadow": "0 2px 4px 0 #F89B2D, 0 2px 10px 0 #F89B2D"
            },
            "urgent":{
                "backgroundColor": "#FF5959",
                "boxShadow": "0 2px 4px 0 #FF5959, 0 2px 10px 0 #FF5959"
            }
        }
    }

    componentDidMount() {        
        const {context, client} = this.props.params;
        if(client && client.db){
            client.db.get('asset_mappings').then(function(data){
                if(data && context.data.page == "hawk_eye"){
                    this.getAllTickets()
                    let allBlocks = [];
                    for(var prop in data){
                        allBlocks.push(data[prop])
                    }
                    console.log('allblocks:: ',allBlocks);
                    this.setState({blocks : allBlocks})
                }
                else if(data && Object.keys(data).indexOf(context.data.assetId.toString()) > -1){
                    this.setState({blocks : [data[context.data.assetId]]})
                }
                console.log('alldata:: ',data);
                
            }.bind(this))
        }
        if(context && context.data && context.data.page !== "ticket"){
            this.setState({allowEdit: true})
        }
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    handleKeyDown(e) {
        const {context} = this.props.params;
        if(context.data.page !== "hawk_eye") {
            switch (e.keyCode) {
                case 13://enter
                    this.createBlock();
                    break;
                case 8://delete
                     this.deleteBlock();
                    break;
                case 27://esc
                    break;
            }
        }
        this.clearCroparea()
    }

    clearCroparea = () => {
        this.setState({
            crop: {
                x: 10,
                y: 10,
                width: 0,
                height: 0,
            },
            selectedBlock: null,
            showAssetDetails: false,
            allAssets:[],
            showAllAssets: false,
            showAllTickets: false

        })
    }

    onImageLoaded = image => {
        console.log('onCropComplete', image)
    }

    onCropComplete = crop => {
        console.log('onCropComplete', crop)
    }

    onCropChange = crop => {
        if(this.state.allowEdit){
            this.setState({ crop })
        }
    }

    createBlock = () => {
        const { selectedBlock, blocks } = this.state;
        let allBlocks = cloneDeep(blocks);
        const newBlock = this.state.crop;
        allBlocks.push(newBlock);
        this.setState({ blocks: allBlocks });
    }

    deleteBlock = (index) => {
        const { selectedBlock, blocks } = this.state;
        if(selectedBlock >= 0){
            let allBlocks = cloneDeep(blocks);
            allBlocks.splice(selectedBlock, 1);
            this.setState({ blocks: allBlocks });
        } 
    }

    renderBlocks = () => {
        const {context} = this.props.params;
        const { selectedBlock, blocks, allTickets } = this.state;
        
        let hawkEyeMode = context.data.page === "hawk_eye";
        let modifiedBlocks = blocks;
        let style = {}
        return (
            modifiedBlocks.map((item, idx) => {
                let itemColor = item.color;
                let currentAssetTicket = {};
                if (hawkEyeMode && allTickets.length) {
                    currentAssetTicket = allTickets.find(el => {
                        for(var prop in el.asset){
                            if(el.asset[prop].id === item.associations.display_id) return true
                        }
                })
                if(currentAssetTicket && Object.keys(currentAssetTicket).length){
                    itemColor = this.styleMap[currentAssetTicket.ticket.priority_name.toLowerCase()];
                }    
                }
                if(typeof item.color === "string" && item.color.length){
                    itemColor = item.color;
                }
                else{
                    style = itemColor ? itemColor : {};
                    itemColor = ""
                }
                return (
                    // <Tooltip
                    //     position="bottom"
                    //     trigger="mouseenter"
                    //     delay={500}
                    //     animation="shift"
                    //     arrow
                    //     distance={-60}
                    //     inertia={true}
                    //     duration={500}
                    //     className="table-tooltip"
                    //     hideDelay={200}
                    //     title="Space troopers"
                    // >
                    <Block item={item} style={style} isSelected={idx == this.state.selectedBlock} color={itemColor} onClick={() => {
                        this.setState({ selectedBlock: idx })
                        this.viewAssetDetails(idx);
                    }}></Block>
                    // </Tooltip>
                )
            })
        )
    }

    saveMappings = () => {
        const {blocks} = this.state;
        const {client} = this.props.params;
        let filteredBlocks = blocks.filter(item => item.associations).map(item => {
            
            return{
                [item.associations.display_id]: item
            }
        })
        let map = {};
        for(let i=0;i<blocks.length;i++){
            if(blocks[i].associations){
                map[blocks[i].associations.display_id] = blocks[i];
            }
        }
        console.log(map);
        if(Object.keys(map).length){
            client.db.set("asset_mappings", map).then(function (data) {
                console.log('on save', data);
                client.interface.trigger("showNotify", {
                    type: "success",
                    message: "Pulished successfully"
                  /* The "message" should be plain text */
                  }).then(function(data) {
                  // data - success message
                  }).catch(function(error) {
                  // error - error object
                  });
            })
        }
        else{
            client.db.delete("asset_mappings").then(function (data) {
                console.log('on save', data);
                client.interface.trigger("showNotify", {
                    type: "success",
                    message: "All asset mappings removed successfully"
                  /* The "message" should be plain text */
                  }).then(function(data) {
                  // data - success message
                  }).catch(function(error) {
                  // error - error object
                  });
            })
        }
    
       
    }

    showAssetDetails = () => {
        const {selectedBlock, blocks, showAssetDetails} = this.state
        if (showAssetDetails && blocks[selectedBlock] && blocks[selectedBlock].associations) {
            let field = blocks[selectedBlock].associations;
            return (
                <OverlayAssetDetail>
                    <AssetTitle>{field.name}</AssetTitle>
                    <div className="flex row center mt8">
                        <Subsection>{field.ci_type_name}</Subsection>
                        <Splitter></Splitter>
                        <Subsection>Business Impact : {field.business_impact}</Subsection>
                    </div>
                    <div className="flex col start mt26 half-width">
                        <div className="flex row start full-width">
                            <Field className="half-width">Name</Field>
                            <SubField>{field.name}</SubField>
                        </div>
                        <div className="flex row start mt8 full-width">
                            <Field className="half-width">Type</Field>
                            <SubField>{field.ci_type_name}</SubField>
                        </div>
                        <div className="flex row start mt8 full-width">
                            <Field className="half-width">Impact</Field>
                            <SubField>{field.business_impact}</SubField>
                        </div>
                    </div>
                </OverlayAssetDetail>
            )
        }
        else return ''

    }

    getAllTickets = () => {
        const { client } = this.props.params;
        
        client.request.get("https://space.freshservice.com/helpdesk/tickets/filter/all_tickets?format=json&page=1", {
            headers: {
                Authorization: "Basic <%= encode('K4rl3U8d8fkWxlmnSPQI:X')%>",
                "Content-Type": "application/json;charset=utf-8"
            }
        })
            .then(function (res) {
                console.log("All Tickets");
                let allTickets = JSON.parse(res.response);
                let allTicketsWithAssets = [] 
                let count = 0;
                allTickets.forEach((ticket, i) => {
                    count += 1;
                    client.db.get(`ticket${ticket.display_id}`).then(function(data){
                        // for(var prop in data){
                        //     allTicketsWithAssets.push({ticket, asset: data[prop]})
                        // }
                        allTicketsWithAssets.push({ticket, asset: data});
                        if(i == count-1) {
                            this.setState({allTickets: allTicketsWithAssets, showAllTickets: true})
                        }
                    }.bind(this))
                    .catch(function (error) {
                        if(i == count-1) {
                            allTicketsWithAssets.push({ticket, asset: {}});
                            this.setState({allTickets: allTicketsWithAssets, showAllTickets: true})
                        }
                    }.bind(this));
                })
            }.bind(this))
            .catch(function (error) {
                console.error(error);
            });
    }

    mapAssetDetails = () => {
        const { client } = this.props.params;
        
        //client.request.get("https://space.freshservice.com/api/v2/assets", {
        client.request.get("https://space.freshservice.com/cmdb/items.json", {
            headers: {
                Authorization: "Basic <%= encode('K4rl3U8d8fkWxlmnSPQI:X')%>",
                "Content-Type": "application/json;charset=utf-8"
            }
        })
            .then(function (res) {
                console.log(JSON.parse(res.response));
                this.setState({ allAssets: JSON.parse(res.response), showAllAssets: true })
            }.bind(this))
            .catch(function (error) {
                console.error(error);
            });
    }

    viewAssetDetails = (idx) => {
        const {blocks} = this.state
        if(blocks[idx].associations){
            this.setState({showAssetDetails: true})
        }
        else{
            this.mapAssetDetails()
        }  
    }

    mapcurrentAsset = (item) => {
        const {selectedBlock, blocks} = this.state;
        let allBlocks = cloneDeep(blocks);
        let updatedSelectedBlock = {...allBlocks[selectedBlock], associations: item}
        allBlocks[selectedBlock] = updatedSelectedBlock;
        this.setState({blocks : allBlocks});
        this.setState({showAllAssets: false});
        this.setState({showAssetDetails: true});
    }

    showSelectedAsset =  (item) => {
        const {selectedBlock, blocks} = this.state;
        let modifiedBlocks = blocks.map(el => {
            var arr = [];
            for(var prop in item.asset) {
                arr.push(item.asset[prop].id)
            }
            console.log(arr);
            return{
                ...el,
                color: arr.indexOf(el.associations.display_id) > -1 ? "green" : ""
            }
        });
        console.log(modifiedBlocks);
        this.setState({blocks: modifiedBlocks});
    }

    showAllAssets = () => {
        const {allAssets} = this.state;
        return(
            <Overlay>
                <AssetTypes noHover>
                    <AssetName>Asset Name</AssetName>
                    <AssetName>Asset Type</AssetName>
                    <AssetName>Business Impact</AssetName>
                </AssetTypes>
                {allAssets.map(item => {
                    return(
                        <AssetTypes onClick={() => {this.mapcurrentAsset(item)}}>
                            <Asset>{item.name}</Asset>
                            <Asset>{item.ci_type_name}</Asset>
                            <Asset>{item.business_impact}</Asset>
                            {/* <Asset>{item.author_type}</Asset> */}
                        </AssetTypes>
                    )
                })}
            </Overlay>
        )
    }

    showAllTickets = () => {
        const {allTickets} = this.state;
        console.log("showAllTickets", allTickets)
        return(
            <Overlay>
                <AssetTypes noHover>
                    <AssetName>Ticket Subject</AssetName>
                    <AssetName>Requester</AssetName>
                    <AssetName>Status</AssetName>
                </AssetTypes>
                {allTickets.map(item => {
                    return(
                        <AssetTypes onClick={() => {this.showSelectedAsset(item)}}>
                            <Asset style={{textOverflow: "ellipsis",overflow: "hidden",whiteSpace: "nowrap"}} title={item.ticket.subject}>{item.ticket.subject}</Asset>
                            <Asset>{item.ticket.requester_name}</Asset>
                            <Asset>{item.ticket.status_name}</Asset>
                        </AssetTypes>
                    )
                })}
            </Overlay>
        )
    }

    toogleTicketOverLay = () => {
        const {showAllTickets} = this.state;
        this.setState({showAllTickets: !showAllTickets});
    }
    

    render() {
        const {showAssetDetails, showAllAssets, allowEdit, showAllTickets} = this.state;
        const {context} = this.props.params;
        return (
            <div>
                <ReactCrop
                    src={map}
                    crop={this.state.crop}
                    onImageLoaded={this.onImageLoaded}
                    onComplete={this.onCropComplete}
                    onChange={this.onCropChange}
                >
                {this.renderBlocks()}
                </ReactCrop>
                {showAssetDetails && this.showAssetDetails()}
                {showAllAssets && this.showAllAssets()}
                {showAllTickets && this.showAllTickets()}
                {context.data.page == "hawk_eye" ? 
                    <Button onClick={() => this.toogleTicketOverLay()}>{showAllTickets ? "Hide" : "Show"}</Button>
                    :
                    allowEdit && <Button onClick={() => this.saveMappings()}>Publish</Button>
                }
            </div>
        )
    }
}

const OverlayAssetDetail = styled.div`
    margin: 8px;
    width: calc(100vw - 38px);
    padding-left: 20px;
    background: #FFF;
    box-shadow: 0 2px 18px 0 rgba(18,52,77,0.16);
    border: 1px solid #EBEEF0;
    height: 200px;
    overflow: scroll;
    position: absolute;
    bottom: 0;
    border-radius: 4px;
`

const Subsection = styled.div`
    opacity: 0.6;	
    color: #12344D;	
    font-size: 14px;	
    line-height: 16px;	
    text-align: center;

`
const Splitter = styled.div`
    width: 1px;
    opacity: 0.6;	
    color: #12344D;	
    font-size: 14px;	
    line-height: 16px;	
    text-align: center;
    border-left: 1px solid #12344D;
    height: 16px;
    margin-left: 8px;
    margin-right: 8px;
    color: #12344D;
    opacity: 0.6;
`

const Field = styled.div`	
    color: #12344D;	
    font-size: 13px;	
    line-height: 20px;
`

const SubField = styled.div`
    color: #12344D;	
    font-size: 13px;
    font-weight: 600;	
    line-height: 20px;
`

const Overlay = styled.div`
    margin: 8px;
    width: calc(100vw - 18px);
    background: #FFF;
    box-shadow: 0 2px 18px 0 rgba(18,52,77,0.16);
    border: 1px solid #EBEEF0;
    height: 300px;
    overflow: scroll;
    position: absolute;
    bottom: 0;
    border-radius: 4px;
`

const Asset = styled.div`
    width: 33.33%;
    padding: 12px 17px;
    line-height: 20px;
    color: #12344D;
    border-top: 1px solid #EBEEF0;
    font-size: 14px;
    font-weight: 500;
`

const AssetName = styled.div`
    width: 50%;
    padding: 12px 17px;
    line-height: 20px;
    color: #12344D;
    opacity: 0.6;
    border-top: 1px solid #EBEEF0;
    font-size: 13px;	
    font-weight: 600;	
    background: #F5f7f9;
`

const AssetTitle = styled.div`
    font-size: 18px;	
    font-weight: bold;	
    line-height: 21px;
    color: #12344D;
    padding-top: 20px;
`

const AssetTypes = styled.div`
    cursor: pointer;
    display: flex;
    align-items:center;
    background-color: #FFF;
    border-radius: 4px;
    ${props => !props.noHover && `
        &:hover{
            background-color: #EBEFF3;
        }
    `}
`

const Block = styled.div`
    cursor: pointer;
    position: absolute;
    transform: ${props => `translate3d(${props.item.x}px,${props.item.y}px,0)`};
    background-color: ${props => props.color ? props.color : "#90C6FE"};
    border-radius: 2px;
    border: ${props => props.isSelected ? "2px solid #2C5CC5" : "2px solid transparent"};
    width: ${props => props.item.width}px;
    height: ${props => props.item.height}px;
`

const Button = styled.button`
    z-index:1;
    position:absolute;
    top: 8px;
    right: 8px;
    padding: 8px 16px;
    border-radius: 4px;
    border: 1px solid #dadfe3;
    box-shadow: 0 2px 4px 0 rgba(18,52,77,0.06), 0 2px 18px 0 rgba(18,52,77,0.16);
    background-color: #009A79;
    cursor:pointer;
    color: #FFF;
    font-weight: 600;
    &:hover{
        border: 1px solid green;
    }
    &:focus{
        outline: none;
    }
`

export default Builder