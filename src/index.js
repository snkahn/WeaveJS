import React from "react";
import ReactDOM from "react-dom";
import $ from "jquery";
import JSZip from "jszip";
/* eslint-disable */
import {Layout} from "../lib/WeaveUI.js";
import {StandardLib} from "../lib/WeaveUI.js";
/* eslint-enable */

/*global Weave, weavejs*/

// TEMPORARY SOLUTION
weavejs.util.JS.JSZip = JSZip;
//weavejs.WeaveAPI.Locale.reverseLayout = true; // for testing

Weave.registerAsyncClass(React.Component);

var weave = window.weave;
if (weave)
{
	render();
}
else
{
	window.weave = weave = new Weave();
	var urlParams = StandardLib.getUrlParams();
	var weaveExternalTools = window.opener && window.opener.WeaveExternalTools;
	if (urlParams.file)
	{
		weavejs.core.WeaveArchive.loadUrl(weave, urlParams.file).then(render);
	}
	else if (weaveExternalTools && weaveExternalTools[window.name])
	{
		// read content from flash
		var ownerPath = weaveExternalTools[window.name].path;
		var content = atob(ownerPath.getValue('btoa(Weave.createWeaveFileContent())'));
		weavejs.core.WeaveArchive.loadFileContent(weave, content);
		render();
	}
	else
	{
		render();
	}
}

function render() {
	$(() => {
		ReactDOM.render(<Layout weave={weave} style={{width: "100%", height: "100%"}}/>, document.getElementById("weaveElt"));
	});
}
