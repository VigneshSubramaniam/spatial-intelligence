import React, { Component } from 'react';
import map from './ground_floor.png'
import styled from 'styled-components'
import ReactCrop, { makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import './Builder.css';
import { cloneDeep } from 'lodash'
import {Tooltip} from 'react-tippy'


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
            allowEdit: false
        }
    }

    componentDidMount() {        
        const {context, client} = this.props.params;
        if(client && client.db){
            client.db.get('asset_mappings').then(function(data){
                if(data && context.data.page == "asset"){
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
        switch (e.keyCode) {
            case 13://enter
                this.createBlock();
                this.clearCroparea()
                break;
            case 8://delete
                this.deleteBlock();
                this.clearCroparea();
                break;
            case 27://esc
                this.clearCroparea();
                break;
        }
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
        return (
            this.state.blocks.map((item, idx) => {
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
                    <Block item={item} isSelected={idx == this.state.selectedBlock} color={item.color} onClick={() => {
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
            })
        }
        else{
            client.db.delete("asset_mappings").then(function (data) {
                console.log('on save', data);
            })
        }
    
       
    }

    showAssetDetails = () => {
        const {selectedBlock, blocks, showAssetDetails} = this.state
        if(showAssetDetails && blocks[selectedBlock] && blocks[selectedBlock].associations){
            return(
                <Overlay>
                    <AssetDetail>{blocks[selectedBlock].associations.name}</AssetDetail>
                </Overlay>
            )
        }
        else return ''
        
    }

    mapAssetDetails = () => {
        const { client } = this.props.params;
        
        client.request.get("https://space.freshservice.com/api/assets", {
            headers: {
                Authorization: "Basic <%= encode('K4rl3U8d8fkWxlmnSPQI:X')%>",
                "Content-Type": "application/json;charset=utf-8"
            }
        })
            .then(function (res) {
                console.log(JSON.parse(res.response).assets);
                this.setState({ allAssets: JSON.parse(res.response).assets, showAllAssets: true })
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

    showAllAssets = () => {
        const {allAssets} = this.state;
        return(
            <Overlay>
                <AssetTypes noHover>
                    <AssetName>Asset Name</AssetName>
                    <AssetName>Asset Type</AssetName>
                </AssetTypes>
                {allAssets.map(item => {
                    return(
                        <AssetTypes onClick={() => {this.mapcurrentAsset(item)}}>
                            <Asset>{item.name}</Asset>
                            <Asset>{item.author_type}</Asset>
                        </AssetTypes>
                    )
                })}
            </Overlay>
        )
    }

    render() {
        const {showAssetDetails, showAllAssets, allowEdit} = this.state;
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
                {allowEdit && <Button onClick={() => this.saveMappings()}>Publish</Button>}
            </div>
        )
    }
}

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
    width: 50%;
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

const AssetDetail = styled.div`

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