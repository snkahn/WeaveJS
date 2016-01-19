///<reference path="../../typings/lodash/lodash.d.ts"/>
///<reference path="../../typings/react/react.d.ts"/>
///<reference path="../../typings/react-bootstrap/react-bootstrap.d.ts"/>
///<reference path="../../typings/weave/WeavePath.d.ts"/>
///<reference path="../utils/StandardLib.ts"/>

import AbstractWeaveTool from "./AbstractWeaveTool";
import {registerToolImplementation} from "../WeaveTool";
import * as React from "react";
import ui from "../react-ui/ui";
import {ListGroupItem, ListGroup, DropdownButton, MenuItem} from "react-bootstrap";
import * as _ from "lodash";
import {IAbstractWeaveToolProps} from "./AbstractWeaveTool";
import {IAbstractWeaveToolPaths} from "./AbstractWeaveTool";
import {MouseEvent} from "react";
import {CSSProperties} from "react";

//TODO: This is a hack to allow react to be imported in generated JSX. Without this, import is missing and render encounters an exception
var stub:any = React;
const sessionStateMenuStyle:CSSProperties = {display:"flex", flex:1, height:"100%", flexDirection:"column", overflow:"auto"};
const sessionStateComboBoxStyle:CSSProperties = {display:"flex", flex:1, height:"100%", flexDirection:"column", overflow:"auto"};

class SessionStateMenuTool extends AbstractWeaveTool {
    private choices:WeavePath;
    protected toolPath:WeavePath;

    constructor(props:IAbstractWeaveToolProps) {
        super(props);
        this.toolPath.push("choices").addCallback(this, this.forceUpdate);
        this.toolPath.push("selectedChoice").addCallback(this, this.forceUpdate);
        this.toolPath.push("layoutMode").addCallback(this, this.forceUpdate);
    }

    protected handleMissingSessionStateProperties(newState:any)
	{

	}

    componentDidMount() {
    }

    handleItemClick(index:number, event:MouseEvent):void {
        this.toolPath.state("selectedChoice", this.choices.getNames()[index]);
        var targets:WeavePath = this.toolPath.push("targets");
        var choice:any = this.choices.getState(index);
        targets.forEach(choice, function (value:any, key:string) {
            this.push(key, null).state(value)
        });
    }

    render() {
        this.choices = this.toolPath.push("choices");
        var selectedChoice:string = this.toolPath.getState("selectedChoice");
        var layoutMode:string = this.toolPath.getState("layoutMode");

        var menus:JSX.Element[] = this.choices.getNames().map((choice:string, index:number) => {
            if(layoutMode === "ComboBox"){
                return choice === selectedChoice ?<MenuItem active key={index} onSelect={this.handleItemClick.bind(this, index)}>{choice}</MenuItem>
                    :<MenuItem key={index} onSelect={this.handleItemClick.bind(this, index)}>{choice}</MenuItem>;
            }else {
                return choice === selectedChoice ?<ListGroupItem active key={index} onClick={this.handleItemClick.bind(this, index)}>{choice}</ListGroupItem>
                    :<ListGroupItem key={index} onClick={this.handleItemClick.bind(this, index)}>{choice}</ListGroupItem>;
            }
        });

        var container:JSX.Element;

        if(layoutMode === "ComboBox"){
            container =
                <ui.VBox style={{height:"100%", flex:1.0, alignItems:"center"}}>
                    <DropdownButton title={selectedChoice} id={`dropdown-${this.toolPath.getState("class")}`} >
                        {menus}
                    </DropdownButton>
                </ui.VBox>
        }else{
            container =
                <ListGroup>
                    {menus}
                </ListGroup>
        }

        return (<div style={layoutMode === "ComboBox" ? sessionStateComboBoxStyle : sessionStateMenuStyle}>
            {container}
        </div>);
    }
}

export default SessionStateMenuTool;

registerToolImplementation("weave.ui::SessionStateMenuTool", SessionStateMenuTool);
//Weave.registerClass("weavejs.tools.SessionStateMenuTool", SessionStateMenuTool, [weavejs.api.core.ILinkableObjectWithNewProperties]);
