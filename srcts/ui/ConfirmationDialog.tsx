import * as React from "react";
import * as ReactDOM from "react-dom";
import {HBox, VBox} from "../react-ui/FlexBox";
import PopupWindow from "../react-ui/PopupWindow";
import Button from "../semantic-ui/Button";

export interface IConfirmationDialogProps extends React.Props<ConfirmationDialog>
{
	content:React.ReactChild;
	okButtonContent:React.ReactChild;
	cancelButtonContent:React.ReactChild;
	onOk?:Function;
	onCancel?:Function;
}

export interface IConfirmationDialogState
{

}

export default class ConfirmationDialog extends React.Component<IConfirmationDialogProps, IConfirmationDialogState> {

	static window:PopupWindow;

	constructor(props:IConfirmationDialogProps)
	{
		super(props);
	}

	static close()
	{
		if(ConfirmationDialog.window)
		{
			PopupWindow.close(ConfirmationDialog.window);
			ConfirmationDialog.window = null;
		}
	}

	static open(context:React.ReactInstance, title:string, content:any, okButtonContent:any, onOk:Function, cancelButtonContent:any, onCancel:Function)
	{
		if (ConfirmationDialog.window)
			PopupWindow.close(ConfirmationDialog.window);

		ConfirmationDialog.window = PopupWindow.open(context, {
			title,
			content:
				<ConfirmationDialog content={content}
				                    okButtonContent={okButtonContent}
				                    cancelButtonContent={cancelButtonContent}/>,
			footerContent:
				<HBox style={{flex:1, justifyContent: "center"}}>
					<div className="ui buttons">
						{okButtonContent ? <Button className="primary" onClick={() => {
							onOk();
						}}>
							{okButtonContent}
						</Button>:null}
						{cancelButtonContent ? <Button className="secondary" onClick={() => {
							onCancel();
						}}>
							{cancelButtonContent}
						</Button>:null}
					</div>
				</HBox>,
			resizable: true,
			modal: true,
			width: 480,
			height: 230,
			onClose: ConfirmationDialog.close,
			onOk: onOk,
			onCancel: onCancel
		});
	}

	componentDidMount()
	{

	}

	render():JSX.Element
	{
		return (
			<VBox style={{flex: 1, justifyContent: "center"}} className="ui basic segment">
				{this.props.content}
			</VBox>
		)
	}
}