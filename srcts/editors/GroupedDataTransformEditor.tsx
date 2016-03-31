import * as React from "react";
import * as lodash from "lodash";
import StatefulTextField from "../ui/StatefulTextField";
import {linkReactStateRef} from "../utils/WeaveReactUtils";
import ReactUtils from "../utils/ReactUtils";
import WeaveTree from "../ui/WeaveTree";
import {HBox, VBox} from "../react-ui/FlexBox";
import HelpIcon from "../react-ui/HelpIcon";
import SelectableAttributeComponent from "../ui/SelectableAttributeComponent";
import SelectableAttributesList from "../ui/SelectableAttributesList";
import DataSourceEditor from "./DataSourceEditor";
import {IDataSourceEditorProps, IDataSourceEditorState} from "./DataSourceEditor";

import GroupedDataTransform = weavejs.data.source.GroupedDataTransform;
import URLRequestUtils = weavejs.api.data.IWeaveTreeNode;
import ILinkableHashMap = weavejs.api.core.ILinkableHashMap;
import LinkableHashMap = weavejs.core.LinkableHashMap;

export default class ForeignDataMappingTransformEditor extends DataSourceEditor
{
	get editorFields():[JSX.Element, JSX.Element][]
	{
		let ds = (this.props.dataSource as GroupedDataTransform);
		let keyTypeSuggestions = weavejs.WeaveAPI.QKeyManager.getAllKeyTypes();
		let editorFields:[JSX.Element, JSX.Element][] = [
			[
				<div>
					{Weave.lang("Group by")}
					<HelpIcon>
						{Weave.lang('The keyType of the "Group by" column should match the keyType of each column to be transformed. The values in this column will be treated as foreign keys which map to aggregated values in the transformed columns.')}
					</HelpIcon>
				</div>, 
				<SelectableAttributeComponent label="alpha" attribute={ds.groupByColumn}/>
			],
			[
				<div>
					{Weave.lang("Group keyType")}
					<HelpIcon>
						{Weave.lang('Specifies the keyType of the foreign keys referenced by the "Group by" column. By default, the dataType of the "Group by" column is used as the foreign keyType.')}
					</HelpIcon>
				</div>,
				<StatefulTextField selectOnFocus={true} 
								   ref={linkReactStateRef(this, { content: ds.groupKeyType }) }/>
			],
			[
				<span>{Weave.lang("Data to transform")}</span>,
				<SelectableAttributesList label="alpha" columns={ds.dataColumns as LinkableHashMap} showLabelAsButton={true}/>
			]
		];
		return super.editorFields.concat(editorFields)
	}
}