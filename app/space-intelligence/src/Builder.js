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
            overlayVisible: false,
            showAllAssets: false,
            showAssetDetails: false,
            allAssets:[]
        }
    }

    componentDidMount() {        
        const {context, client} = this.props.params;
        if(client && client.db){
            client.db.get('asset_mappings').then(function(data){
                if(Object.keys(data['0']).indexOf(context.data.assetId.toString()) > -1)
                this.setState({blocks : [data['0'][context.data.assetId]]})
            }.bind(this))
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
            showAllAssets: false
        })
    }

    onImageLoaded = image => {
        console.log('onCropComplete', image)
    }

    onCropComplete = crop => {
        console.log('onCropComplete', crop)
    }

    onCropChange = crop => {
        this.setState({ crop })
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
                    <Block item={item} isSelected={idx == this.state.selectedBlock} onClick={() => {
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
        client.db.set( "asset_mappings", filteredBlocks).then(function(data){
            console.log(data);
        })
    }

    showAssetDetails = () => {
        const {selectedBlock, blocks} = this.state
        return(
            <Overlay>
                <AssetDetail>{blocks[selectedBlock].associations.name}</AssetDetail>
            </Overlay>
        )
    }

    mapAssetDetails = () => {
        const { client } = this.props.params;
        console.log(this.props.params);
        client.request.get("https://space.freshservice.com/api/v2/assets", {
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
                {allAssets.map(item => {
                    return(
                        <Asset onClick={() => {this.mapcurrentAsset(item)}}>{item.name}</Asset>
                    )
                })}
            </Overlay>
        )
    }

    render() {
        const {showAssetDetails, showAllAssets} = this.state;
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
                <Button onClick={() => this.saveMappings()}>Finish</Button>
            </div>
        )
    }
}

const Overlay = styled.div`
    background: #FFF;
    height: 400px;
    width: 100vw;
    position: absolute;
    bottom: 0;
`

const Asset = styled.div`
    padding: 12px 17px;
    line-height: 20px;
    color: black;
    border-top: 1px solid #EBEEF0;
`
const AssetDetail = styled.div`

`

const Block = styled.div`
    cursor: pointer;
    position: absolute;
    transform: ${props => `translate3d(${props.item.x}px,${props.item.y}px,0)`};
    background-color: blue;
    border-radius: 2px;
    border: ${props => props.isSelected ? "1px solid red" : "1px solid transparent"};
    width: ${props => props.item.width}px;
    height: ${props => props.item.height}px;
`

const Button = styled.button`
    z-index:1;
    position:absolute;
    top: 20px;
    left: 20px;
    padding: 8px 16px;
    border-radius: 4px;
    border: 1px solid #dadfe3;
    box-shadow: 0 2px 4px 0 rgba(18,52,77,0.06), 0 2px 18px 0 rgba(18,52,77,0.16);
    background-color: #009A79;
    cursor:pointer;
    color: #FFF;
    &:hover{
        border: 1px solid green;
    }
    &:focus{
        outline: none;
    }
`

export default Builder