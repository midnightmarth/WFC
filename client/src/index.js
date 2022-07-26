import React from "react";
import ReactDOM from "react-dom";

import * as Tiles from "../../images"
import TileValues from "./TileValues/tile_values.json"

class App extends React.Component{
    constructor(props){
        super(props);
        this.setRef = this.setRef.bind(this)
        this.loadedTiles = {}
        this.cursor = {x: 0, y: 0}
        this.gridDims = 960
        this.grid = []
        this.time = undefined;
        this.state = {
            canvas: React.createRef(),
            ctx: undefined
        }
    }

    setRef(node){
        this.setState({canvas: node, ctx: node.getContext("2d")}, ()=> {
            this.init()
        })
    }

    loadImage(img, imgName){
        return new Promise((res, rej) => {
            let obj = {}
            obj[imgName] = document.createElement("img")
            // const image = document.createElement("img")
            obj[imgName].onload = e => {return res(obj)} 
            obj[imgName].onerror = e => {return rej(new Error (`load ${img} failed to load`))} 
            obj[imgName].src = img;
        })
    }

    init(){
        let allPromises = [] 
        
        Object.keys(Tiles["default"]).forEach(tileName => {
            allPromises.push(this.loadImage(Tiles["default"][tileName], tileName))
        });
        Promise.all(allPromises).then(tileArr => {
            tileArr.forEach(tile => {
                this.loadedTiles[Object.keys(tile)[0]] = {tile: tile[Object.keys(tile)], 
                    name: Object.keys(tile)[0], 
                    rules: TileValues[Object.keys(tile)[0]]}
            })
            this.drawGrid()
        })
    }

    drawGrid(){
        const { ctx } = this.state;

        let {cursor, grid} = this;
        let tileDim = 96;

        for(; cursor.y*tileDim < this.gridDims; cursor.y++){
            cursor.x = 0;
            grid[cursor.y] = []
            for(; cursor.x*tileDim < this.gridDims; cursor.x++){
                ctx.strokeRect(cursor.x*96, cursor.y*96, tileDim, tileDim);
                grid[cursor.y].push({tile: "", entropy: this.loadedTiles.length})
            }
        }
        this.grid = grid
        this.time = Date.now()
        this.startWFC()
    }

    calculateEntropy(tile, grid, x, y){

        let topTile, rightTile, bottomTile, leftTile
        let adj = []

        if(y != 0){
            topTile = grid[y-1][x]
        }
        if(x != this.grid[0].length-1){
            rightTile = grid[y][x+1]
        }
        if(y != this.grid.length - 1){
            bottomTile = grid[y+1][x]
        }
        if(x != 0){
             leftTile = grid[y][x-1]
        }

        if(topTile && topTile.entropy == undefined){
            topTile.avail = Object.keys(this.loadedTiles).filter(t => this.loadedTiles[t].rules.Bottom === tile.rules.Top)
            topTile.entropy = topTile.avail.length
            grid[y-1][x].entropy = topTile.entropy
            grid[y-1][x].avail = topTile.avail
            adj.push({x: x,   y: y-1, entropy: topTile.entropy, avail: topTile.avail})
        }else if(topTile && topTile.entropy !== 'collapsed'){
            topTile.avail = topTile.avail.filter(t => this.loadedTiles[t].rules.Bottom === tile.rules.Top)
            topTile.entropy = topTile.avail.length
            grid[y-1][x].entropy = topTile.entropy
            grid[y-1][x].avail = topTile.avail
            adj.push({x: x,   y: y-1, entropy: topTile.entropy, avail: topTile.avail})
        }
        if(rightTile && rightTile.entropy == undefined){
            rightTile.avail = Object.keys(this.loadedTiles).filter(t => this.loadedTiles[t].rules.Left === tile.rules.Right)
            rightTile.entropy = rightTile.avail.length
            grid[y][x+1].entropy = rightTile.entropy
            grid[y][x+1].avail = rightTile.avail
            adj.push({x: x+1, y: y,   entropy: rightTile.entropy,  avail: rightTile.avail})
        }else if(rightTile && rightTile.entropy !== 'collapsed'){
            rightTile.avail = rightTile.avail.filter(t => this.loadedTiles[t].rules.Left === tile.rules.Right)
            rightTile.entropy = rightTile.avail.length
            grid[y][x+1].entropy = rightTile.entropy
            grid[y][x+1].avail = rightTile.avail
            adj.push({x: x+1, y: y,   entropy: rightTile.entropy,  avail: rightTile.avail})
        }
        if(bottomTile && bottomTile.entropy == undefined){
            bottomTile.avail = Object.keys(this.loadedTiles).filter(t => this.loadedTiles[t].rules.Top === tile.rules.Bottom)
            bottomTile.entropy = bottomTile.avail.length
            grid[y+1][x].entropy = bottomTile.entropy
            grid[y+1][x].avail = bottomTile.avail
            adj.push({x: x,   y: y+1, entropy: bottomTile.entropy, avail: bottomTile.avail})
        }else if (bottomTile && bottomTile.entropy !== 'collapsed'){
            bottomTile.avail = bottomTile.avail.filter(t => this.loadedTiles[t].rules.Top === tile.rules.Bottom)
            bottomTile.entropy = bottomTile.avail.length
            grid[y+1][x].entropy = bottomTile.entropy
            grid[y+1][x].avail = bottomTile.avail
            adj.push({x: x,   y: y+1, entropy: bottomTile.entropy, avail: bottomTile.avail})
        }
        if(leftTile && leftTile.entropy == undefined){
            leftTile.avail = Object.keys(this.loadedTiles).filter(t => this.loadedTiles[t].rules.Right === tile.rules.Left)
            leftTile.entropy = leftTile.avail.length
            grid[y][x-1].entropy = leftTile.entropy
            grid[y][x-1].avail = leftTile.avail
            adj.push({x: x-1, y: y,   entropy: leftTile.entropy,   avail: leftTile.avail})
        } else if (leftTile && leftTile.entropy !== 'collapsed'){
            leftTile.avail = leftTile.avail.filter(t => this.loadedTiles[t].rules.Right === tile.rules.Left)
            leftTile.entropy = leftTile.avail.length
            grid[y][x-1].entropy = leftTile.entropy
            grid[y][x-1].avail = leftTile.avail
            adj.push({x: x-1, y: y,   entropy: leftTile.entropy,   avail: leftTile.avail})
        }

        this.grid = grid;
        return adj
    }

    startWFC(){
        const {ctx} = this.state;
        const grid = this.grid
        const randomTileName = Object.keys(this.loadedTiles)[Math.floor(Math.random()*Object.keys(this.loadedTiles).length)]
        const randomTile = this.loadedTiles[randomTileName]
        //pick random place on grid and insert a tile

        // let randomXY = {x: 1, y: 1}
        let randomXY = {x: Math.floor(Math.random()*10), y: Math.floor(Math.random()*10)}

        ctx.drawImage(randomTile.tile, randomXY.x*96, randomXY.y*96)

        grid[randomXY.y][randomXY.x].tile = randomTileName
        grid[randomXY.y][randomXY.x].rules = randomTile.rules
        grid[randomXY.y][randomXY.x].entropy = 'collapsed'

        // calculate entropy for surrounding tiles 
        let queue = this.calculateEntropy(randomTile, grid, randomXY.x, randomXY.y)

        while(queue.length){
            let selectedTile;
            let selectedIndex = 0;
            for(let t in queue){
                if(queue[selectedIndex].entropy > queue[t].entropy){
                    selectedIndex = t;
                }
            }

            selectedTile = queue[selectedIndex]

            if(grid[selectedTile.y][selectedTile.x].entropy === "collapsed"){
                queue = queue.filter((x, i) =>  i != selectedIndex)
                continue;
            }
            queue = queue.filter((x, i) =>  i != selectedIndex)
            queue = [...queue, ...this.selectAndDrawTile(selectedTile)]
        }
    }

    selectAndDrawTile(tile){
        const {ctx} = this.state
        const {grid} = this
        let randomTile = tile.avail[Math.floor(Math.random()*tile.avail.length)]
        ctx.drawImage(this.loadedTiles[randomTile].tile, tile.x*96, tile.y*96)

        grid[tile.y][tile.x].entropy = "collapsed"
        grid[tile.y][tile.x].tile = randomTile

        delete grid[tile.y][tile.x].rules
        delete grid[tile.y][tile.x].avail

        return this.calculateEntropy(this.loadedTiles[randomTile], grid, tile.x, tile.y)
    }

    render(){
        return(
            <div>
                <canvas ref={this.setRef} id="output" width={this.gridDims} height={this.gridDims}></canvas>
            </div>)
    }
} 

ReactDOM.render(<App />, document.getElementById("app"));