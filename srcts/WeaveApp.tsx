import * as React from "react";
import * as _ from "lodash";

import prefixer from "./react-ui/VendorPrefixer";
import {MenuItemProps} from "./react-ui/Menu";
import SideBarContainer from "./react-ui/SideBarContainer";
import {HBox, VBox} from "./react-ui/FlexBox";
import PopupWindow from "./react-ui/PopupWindow";
import WeaveMenuBar from "./WeaveMenuBar";
import DynamicComponent from "./ui/DynamicComponent";
import WeaveComponentRenderer from "./WeaveComponentRenderer";
import FlexibleLayout from "./FlexibleLayout";
import {LayoutState} from "./react-flexible-layout/Layout";
import MiscUtils from "./utils/MiscUtils";
import WeaveTool from "./WeaveTool";
import {WeavePathArray, PanelProps} from "./FlexibleLayout";
import DataSourceManager from "./ui/DataSourceManager";
import ContextMenu from "./menus/ContextMenu";
import {IVisTool} from "./tools/IVisTool";
import ReactUtils from "./utils/ReactUtils";
import {forceUpdateWatcher} from "./utils/WeaveReactUtils";
import WeaveProgressBar from "./ui/WeaveProgressBar";
import WeaveToolEditor from "./ui/WeaveToolEditor";
import WeaveArchive from "./WeaveArchive";

import IDataSource = weavejs.api.data.IDataSource;
import LinkableHashMap = weavejs.core.LinkableHashMap;
import LinkableWatcher = weavejs.core.LinkableWatcher;
import LinkableBoolean = weavejs.core.LinkableBoolean;
import LinkablePlaceholder = weavejs.core.LinkablePlaceholder;
import ColumnUtils = weavejs.data.ColumnUtils;
import WeavePath = weavejs.path.WeavePath;
import ICallbackCollection = weavejs.api.core.ICallbackCollection;
import ILinkableObject = weavejs.api.core.ILinkableObject;
import IColumnReference = weavejs.api.data.IColumnReference;
import IWeaveTreeNode = weavejs.api.data.IWeaveTreeNode;
import StandardLib = weavejs.util.StandardLib;


const WEAVE_EXTERNAL_TOOLS = "WeaveExternalTools";

export interface WeaveAppProps extends React.HTMLProps<WeaveApp>
{
	weave:Weave;
	renderPath?:string[];
	readUrlParams?:boolean;
}

export interface WeaveAppState
{
	toolPathToEdit?:WeavePathArray;
}

export default class WeaveApp extends React.Component<WeaveAppProps, WeaveAppState>
{
	enableMenuBarWatcher:LinkableWatcher;
	
	menuBar:WeaveMenuBar;

	static defaultProps:WeaveAppProps = {
		weave: null,
		renderPath: ['Layout'],
		readUrlParams: false
	};

	constructor(props:WeaveAppProps)
	{
		super(props);
		this.state = {
			toolPathToEdit: null
		}
	}
	
	getRenderPath():string[]
	{
		return this.props.renderPath || WeaveApp.defaultProps.renderPath;
	}
	
	getRenderedComponent():React.Component<any, any>
	{
		if (!this.props.weave)
			return null;
		return this.props.weave.getObject(this.getRenderPath()) as React.Component<any, any>;
	}


	private createDefaultSessionElements()
	{
		let DEFAULT_COLOR_COLUMN = "defaultColorColumn";
		let DEFAULT_COLOR_BIN_COLUMN = "defaultColorBinColumn";
		let DEFAULT_COLOR_DATA_COLUMN = "defaultColorDataColumn";

		let DEFAULT_SUBSET_KEYFILTER = "defaultSubsetKeyFilter";
		let DEFAULT_SELECTION_KEYSET = "defaultSelectionKeySet";
		let DEFAULT_PROBE_KEYSET = "defaultProbeKeySet";
		let ALWAYS_HIGHLIGHT_KEYSET = "alwaysHighlightKeySet";
		let SAVED_SELECTION_KEYSETS = "savedSelections";
		let SAVED_SUBSETS_KEYFILTERS = "savedSubsets";

		let root = this.props.weave.root;
		/* default keysets */
		root.requestObject(DEFAULT_PROBE_KEYSET, weavejs.data.key.KeySet, true);
		root.requestObject(DEFAULT_SELECTION_KEYSET, weavejs.data.key.KeySet, true);
		root.requestObject(DEFAULT_SUBSET_KEYFILTER, weavejs.data.key.KeyFilter, true);
		/* default color column stuff */
		let cc = root.requestObject("defaultColorColumn", weavejs.data.column.ColorColumn, true);
		let bc = cc.internalDynamicColumn.requestGlobalObject(DEFAULT_COLOR_BIN_COLUMN, weavejs.data.column.BinnedColumn, true);
		let fc = bc.internalDynamicColumn.requestGlobalObject(DEFAULT_COLOR_DATA_COLUMN, weavejs.data.column.FilteredColumn, true);
		fc.filter.requestGlobalObject(DEFAULT_SUBSET_KEYFILTER);
	}
	
	urlParams:{ file: string, editable: boolean };
	
	componentDidMount()
	{
		this.createDefaultSessionElements();
		if (this.props.readUrlParams)
		{
			this.urlParams = MiscUtils.getUrlParams();
			this.urlParams.editable = StandardLib.asBoolean(this.urlParams.editable) || this.menuBar.systemMenu.fileMenu.pingAdminConsole();

			try
			{
				var weaveExternalTools:any = window.opener && (window.opener as any)[WEAVE_EXTERNAL_TOOLS];
			}
			catch (e)
			{
				console.error(e);
			}
			
			if (this.urlParams.file)
			{
				// read content from url
				this.menuBar.systemMenu.fileMenu.loadUrl(this.urlParams.file);
			}
			else if (weaveExternalTools && weaveExternalTools[window.name])
			{
				// read content from flash
				var ownerPath:WeavePath = weaveExternalTools[window.name].path;
				var content:Uint8Array = atob(ownerPath.getValue('btoa(Weave.createWeaveFileContent())') as string) as any;
				WeaveArchive.setWeaveSessionFromContent(this.props.weave, content);
				this.forceUpdate();
			}
		}
	}
	
	handleSideBarClose=()=>
	{
		this.setState({ toolPathToEdit: null });
	}
	
	handleGearClick=(tool:WeaveTool):void=>
	{
		var path = tool.props.path;
		this.setState({
			toolPathToEdit: path
		});
	}

	isMaximized=(tool:WeaveTool):boolean=>
	{
		var path = tool.props.path;
		var layout = Weave.AS(this.getRenderedComponent(), FlexibleLayout);
		if (!layout)
			return false;
		var state = _.cloneDeep(layout.getSessionState());
		var obj = FlexibleLayout.findStateNode(state, path);
		if (!obj)
			return false;
		return obj.maximized;
	}

	handleMaximizeClick=(tool:WeaveTool):void=>
	{
		var path = tool.props.path;
		var layout = Weave.AS(this.getRenderedComponent(), FlexibleLayout);
		if (!layout)
			return;
		var state = _.cloneDeep(layout.getSessionState());
		var obj = FlexibleLayout.findStateNode(state, path);
		if (!obj)
			return;
		obj.maximized = !obj.maximized;
		layout.setSessionState(state);
	}
	
	handlePopoutClick=(tool:WeaveTool):void=>
	{
		var path = tool.props.path;
		var popoutWindow:Window;
		var onBeforeUnLoad:Function = () => { };
		var onLoad:Function = () => { };
		var options:any = { transferStyle: true };
		var isMaximized:boolean = false, screenWidth:number, screenHeight:number;

		this.removeFromLayout(path);
		var content:JSX.Element = (
			<WeaveTool
				weave={this.props.weave}
				path={path}
				style={{width: "100%", height: "100%"}}
				onGearClick={this.handleGearClick}
				onMaximizeClick={() => {
					if (isMaximized)
					{
						isMaximized = false;
						popoutWindow.resizeTo(screenWidth, screenHeight);
					}
					else
					{
						isMaximized = true;
						screenWidth = popoutWindow.innerWidth;
						screenHeight = popoutWindow.innerHeight;
						popoutWindow.moveTo(0,0);
						popoutWindow.resizeTo(screen.availWidth, screen.availHeight);
					}
				}}
				onPopinClick={() => {
					this.addToLayout(path);
					popoutWindow.close();
				}}
				onCloseClick={(tool:WeaveTool) => {
					this.handleCloseClick(tool);
					popoutWindow.close();
				}}
				onDragEnd={() => {}}
				onDragStart={() => {}}
				onDragOver={() => {}}
			>
				<WeaveComponentRenderer
					weave={this.props.weave}
					path={path}
					style={{ width: "100%", height: "100%" }}
					props={{itemRenderer: this.renderTool}}
				/>
			</WeaveTool>
		);
		popoutWindow = ReactUtils.openPopout(content, onLoad, onBeforeUnLoad, options);

	}
	
	handleCloseClick=(tool:WeaveTool)=>
	{
		var weave = this.props.weave;
		var path = tool.props.path;
		this.removeFromLayout(path);
		weave.removeObject(path);
	
		if (_.isEqual(path, this.state.toolPathToEdit))
		{
			this.setState({
				toolPathToEdit: null
			});
		}
	}

	renderTool=(path:WeavePathArray, panelProps:PanelProps)=>
	{
		var tool = this.props.weave.getObject(path);
		if (_.isEqual(path, this.state.toolPathToEdit))
			console.log('editing', path.join(','));
		return (
			<WeaveTool
				ref={this.handleWeaveTool}
				weave={this.props.weave}
				path={path}
				style={{width: "100%", height: "100%"}}
				{...panelProps}
				onGearClick={this.handleGearClick}
				onMaximizeClick={this.handleMaximizeClick}
				isMaximized={this.isMaximized}
				onPopoutClick={this.handlePopoutClick}
				onCloseClick={this.handleCloseClick}
			/>
		);
	}

	private toolSet = new Set<WeaveTool>();

	handleWeaveTool=(tool:WeaveTool)=>
	{
		if (tool)
			this.toolSet.add(tool);
	}

	createObject=(type:new(..._:any[])=>any):void=>
	{
		// need to generate path here instead of letting LinkableHashMap generate a name because async types can't be instantiated immediately
		var weave = this.props.weave;
		var baseName = weavejs.WeaveAPI.ClassRegistry.getDisplayName(type);
		var path = [weave.root.generateUniqueName(baseName)];
		weave.requestObject(path, type);
		var instance = weave.getObject(path);
		var resultType = LinkablePlaceholder.getClass(instance);
		
		if (resultType != type)
			return;
		
		if (Weave.IS(instance, IDataSource))
		{
			DataSourceManager.openInstance(this.menuBar.dataMenu, instance as IDataSource);
		}
		
		if (React.Component.isPrototypeOf(type))
		{
			var placeholder = Weave.AS(instance, LinkablePlaceholder);
			if (placeholder)
				Weave.getCallbacks(placeholder).addDisposeCallback(this, this.handlePlaceholderDispose.bind(this, path, placeholder));
			this.setState({ toolPathToEdit: path });
			this.addToLayout(path);
		}
	}

	//sorts the array of column refs by numeric columns
	//TODO put this function elsewhere?
	prioritizeNumericColumns(columnRefs:Array<IWeaveTreeNode&IColumnReference>) : IColumnReference[]
	{
		var sortedRefs = _.sortBy(columnRefs, function(item) {
			var ref = Weave.AS(item, IColumnReference);
			let meta:{[key:string]:string} = ref && ref.getColumnMetadata();
			let dataType = meta && meta["dataType"];
			switch(dataType)
			{
				case 'number':
					return 0;
				default:
					return 1;
				case 'geometry':
					return 2;
			}
		});
		return sortedRefs.reverse();
	}

	private handlePlaceholderDispose(path:WeavePathArray, placeholder:LinkablePlaceholder<any>)
	{
		// hack
		var INIT = 'initSelectableAttributes';
		var instance = placeholder.getInstance();
		if (instance[INIT])
		{
			var refs = ColumnUtils.findFirstDataSet(this.props.weave.root).concat();
			var sortedRefs = this.prioritizeNumericColumns(refs);
			instance[INIT](sortedRefs);
		}
		this.forceUpdate();
	}

	addToLayout(path:WeavePathArray)
	{
		var layout = Weave.AS(this.props.weave.getObject(this.getRenderPath()), FlexibleLayout);
		if (layout)
		{
			var state = layout.getSessionState();
			// check if the current layout is empty
			if (!state.id && (state.children && !state.children.length))
			{
				state = {id: path};
			}
			else
			{
				state = {
					children: [state, {id: path}],
					direction: state.direction == 'horizontal' ? 'horizontal' : 'vertical'
				};
			}
			layout.setSessionState(state);
		}
	}

	removeFromLayout(path:WeavePathArray)
	{
		var layout = Weave.AS(this.props.weave.getObject(this.getRenderPath()), FlexibleLayout);
		if (layout)
		{
			var state = _.cloneDeep(layout.getSessionState());
			var node = FlexibleLayout.findStateNode(state, path);
			if (node)
			{
				delete node.id;
				node.children = [];
				layout.setSessionState(state);
			}
		}
	}
	
	componentWillUpdate(nextProps:WeaveAppProps, nextState:WeaveAppState)
	{
		for (var tool of this.toolSet)
		{
			if (Weave.wasDisposed(tool))
				this.toolSet.delete(tool);
			else
				tool.setState({ highlightTitle: _.isEqual(nextState.toolPathToEdit, tool.props.path) });
		}
	}
		
	componentWillUnmount()
	{
		Weave.dispose(this.enableMenuBarWatcher);
	}
		
	get enableMenuBar():LinkableBoolean
	{
		// temporary hack until LinkableWatcher can be reused for multiple instances of Weave
		if (this.props.weave != Weave.getWeave(this.enableMenuBarWatcher))
		{
			Weave.dispose(this.enableMenuBarWatcher);
			this.enableMenuBarWatcher = Weave.disposableChild(this.props.weave, LinkableWatcher);
			this.enableMenuBarWatcher.targetPath = ['WeaveProperties', 'enableMenuBar'];
			Weave.getCallbacks(this.enableMenuBarWatcher).addGroupedCallback(this, this.forceUpdate);
		}
		
		return this.enableMenuBarWatcher.target as LinkableBoolean;
	}
	
	render():JSX.Element
	{
		var weave = this.props.weave;
		var renderPath = this.getRenderPath();
		
		if (!weave)
			return <VBox>Cannot render WeaveApp without an instance of Weave.</VBox>;
		
		// backwards compatibility hack
		var sideBarUI:JSX.Element = null;
		var toolToEdit = weave.getObject(this.state.toolPathToEdit) as IVisTool; // hack
		if (toolToEdit && toolToEdit.renderEditor) // hack
			sideBarUI = <WeaveToolEditor tool={toolToEdit}
			                             onCloseHandler={this.handleSideBarClose}
			                             style={ {flex:1} }
			                             className="weave-ToolEditor"/>
		
		return (
			<VBox
				className="weave-app"
				{...this.props as React.HTMLAttributes}
				style={_.merge({flex: 1}, this.props.style)}
				onContextMenu={ContextMenu.open}
			>
				<WeaveProgressBar/>
				<SideBarContainer barSize={.4} leftSideBarChildren={ sideBarUI } onSideBarClose={this.handleSideBarClose}>
					<WeaveComponentRenderer
						weave={weave}
						path={renderPath}
						defaultType={FlexibleLayout}
						style={{width: "100%", height: "100%"}}
						props={{itemRenderer: this.renderTool}}
					/>
				</SideBarContainer>
				{
					!this.enableMenuBar || this.enableMenuBar.value || (this.urlParams && this.urlParams.editable)
					?	<WeaveMenuBar
							style={prefixer({order: -1, opacity: !this.enableMenuBar || this.enableMenuBar.value ? 1 : 0.5 })}
							weave={weave}
							ref={(c:WeaveMenuBar) => this.menuBar = c}
							createObject={this.createObject}
						/>
					:	null
				}
			</VBox>
		);
	}
}
