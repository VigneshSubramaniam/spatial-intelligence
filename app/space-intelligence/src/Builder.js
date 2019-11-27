import React, { Component } from 'react';
import map from './ground_floor.png'
import styled from 'styled-components'
import ReactCrop, { makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import './Builder.css';
import { cloneDeep } from 'lodash'


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
            blocks: []
        }
    }

    componentDidMount() {
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
            selectedBlock: null
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
                    <Block item={item} isSelected={idx == this.state.selectedBlock} onClick={() => {
                        this.setState({ selectedBlock: idx })
                    }}></Block>
                )
            })
        )
    }

    render() {
        return (
            <div>
                <ReactCrop
                    src={map}
                    crop={this.state.crop}
                    onImageLoaded={this.onImageLoaded}
                    onComplete={this.onCropComplete}
                    onChange={this.onCropChange}
                />
                {this.renderBlocks()}
            </div>
        )
    }
}

const Img = styled.img`
    width: 100%;
    height: 100%;
`
const Block = styled.div`
    cursor: pointer;
    position: absolute;
    transform: ${props => `translate3d(${props.item.x}px,${props.item.y}px,0)`};
    background-color: blue;
    border-radius: 4px;
    border: ${props => props.isSelected ? "1px solid red" : "1px solid transparent"};
    width: ${props => props.item.width}px;
    height: ${props => props.item.height}px;
`

export default Builder