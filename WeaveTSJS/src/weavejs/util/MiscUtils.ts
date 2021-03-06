namespace weavejs.util
{
	export declare type Structure = "string" | "boolean" | "number" | StructureFunction | StructureObject | StructureArray | StructureNullable;
	export declare type StructureFunction = ((a:any)=>any);
	export interface StructureObject {[key: string]: Structure};
	export interface StructureArray extends Array<Structure>{};
	export interface StructureNullable {nullable: Structure};
	export class MiscUtils
	{
		/**
		 * Generates an "rgba()" string for CSS.
		 *
		 * @param r A number between 0 and 255.
		 * @param g A number between 0 and 255.
		 * @param b A number between 0 and 255.
		 * @param a A number between 0 and 1.
		 * @return an "rgba()" string for CSS
		 */
		static rgba(r:number, g:number, b:number, a:number)
		{
			return `rgba(${r},${g},${b},${a})`;
		}
		
		/**
		 * Generates an "rgba()" string for CSS.
		 *
		 * @param rgb A number between 0x000000 and 0xFFFFFF.
		 * @param a A number between 0 and 1.
		 * @return an "rgba()" string for CSS
		 */
		static rgb_a(rgb:number, a:number)
		{
			return `rgba(${(rgb & 0xFF0000) >> 16},${(rgb & 0x00FF00) >> 8},${rgb & 0x0000FF},${a})`;
		}

		/**
		 * Generates an "rgba()" string for CSS.
		 *
		 * @param hex  A hexidecimal between 000000 and FFFFFF.
		 * @param a   A number between 0 and 1.
		 */
		static hex2rgba(hex:string, a:number)
		{
			var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
			hex = hex.replace(shorthandRegex, function(m, r, g, b) {
				return r + r + g + g + b + b;
			});

			var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

			return `rgba(${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)},${a})`;
		}

		/**
		 * Searches for the first nested object with matching properties
		 *
		 * @param root The root Object.
		 * @param match Either an Object with properties to match, or a Function that checks for a match.
		 *
		 * @returns returns an object with the matching properties
		 */
		static findDeep(root:any, match:any/*, matchArrayLength:boolean = true*/):any
		{
			if (typeof match !== "function")
			{
				// for lodash 4.0.0
				// * @param matchArrayLength Specifies whether or not array length should be considered when comparing objects.
				/*if (matchArrayLength)
					match = (obj:any) => _.isMatchWith(obj, match, (obj:any, src:any) => {
						var objIsArray = Array.isArray(obj);
						var srcIsArray = Array.isArray(src);
						if (objIsArray || srcIsArray)
							if (!objIsArray || !srcIsArray || obj.length != src.length)
								return false;
					});
				else*/
					match = _.matches(match);
			}

			if (match(root))
				return root;

			if (typeof root == "object")
			{
				var key:string;
				for (key in root)
				{
					var found:any = this.findDeep(root[key], match);
					if (found)
						return found;
				}
			}
		}

		/**
		 * Temporary polyfill workaround for String.startsWith for projects that are
		 * targetting es5
		 *
		 * determines whether a string begins with the characters of another string,
		 * returning true or false as appropriate.
		 *
		 * @param str
		 *            {string} the str string in which to search for in
		 *            str.startsWith
		 * @param searchString
		 *            {string} The characters to be searched for at the start of
		 *            this string.
		 * @param position
		 *            {number?} Optional. The position in this string at which to
		 *            begin searching for searchString; defaults to 0.
		 *
		 * @returns true or false
		 *
		 */
		static startsWith(str:string, searchString:string, position?:number):boolean
		{
			position = position || 0;
			return str.indexOf(searchString, position) === position;
		}

		static resolveRelative(base:string, path:string):string
		{
			// Upper directory
			if (MiscUtils.startsWith(path, "../"))
				return MiscUtils.resolveRelative(base.replace(/\/[^\/]*$/, ""), path.slice(3));
			// Relative to the root
			if (MiscUtils.startsWith(path, "/"))
			{
				var match = base.match(/(\w*:\/\/)?[^\/]*\//) || [base];
				return match[0] + path.slice(1);
			}
			// relative to the current directory
			return base.replace(/\/[^\/]*$/, "") + "/" + path;
		}

		/**
		 *
		 * This function return and object whose keys are url parameters and value
		 */
		
		static makeUrlParams(queryParams:any):string
		{
			let queryParamString: string = "";
			let queryParamArray: string[] = [];
			for (let key of Object.keys(queryParams))
			{
				let value:string = queryParams[key] as string;
				queryParamArray.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
			}
			return queryParamArray.join("&");
		}

		static getUrlParams():any
		{
			return MiscUtils.getParams(window.location.search.substring(1));
		}

		static getHashParams(): any {
			return MiscUtils.getParams(window.location.hash.substring(1));
		}

		private static getParams(query:string):any
		{
			if (!query)
				return {};
			
			var queryParams: any = {};
			var vars = query.split("&");
			for (var i = 0; i < vars.length; i++)
			{
				var name:string;
				var pos = vars[i].indexOf('=');
				var name = pos < 0 ? vars[i] : vars[i].substr(0, pos);
				var value = pos < 0 ? undefined : decodeURIComponent(vars[i].substr(pos + 1));
				
				if (typeof queryParams[name] === 'undefined')
				{
					queryParams[name] = value;
				}
				else if (typeof queryParams[name] === 'string')
				{
					// second entry with this name
					if (typeof value === 'string')
						queryParams[name] = [queryParams[name], value];
				}
				else
				{
					// third or later entry with this name
					(queryParams[name] as any[]).push(value);
				}
			}
			return queryParams;
		}
		
		public static evalTemplateString(str:string, thisArg:any = null):string
		{
			try
			{
				return str && JS.compile('`' + str + '`').call(thisArg);
			}
			catch (e)
			{
				return str;
			}
		}

		public static _pickDefined(obj:{[key:string]:any}, ...keys:string[]):typeof obj
		{
			return MiscUtils._pickBy(_.pick(obj, keys), _.negate(_.isUndefined));
		}

		public static _pickBy(obj:{[key:string]:any}, predicate:(value:any, key:string)=>boolean):typeof obj
		{
			var result:{[key:string]:any} = {};
			for (var key in obj)
			{
				var value = obj[key];
				if (predicate(value, key))
					result[key] = value;
			}
			return result;
		}
		
		/**
		 * Tests if a value is an object with a single property.
		 * @param value An object to test.
		 * @return The single property name, or null if the given value was not an object with a single property.
		 */
		public static testSinglePropertyObject(value:Object):string
		{
			if (typeof value != 'object' || !value)
				return null;
			
			var result:string = null;
			for (var key in value)
			{
				if (result == null)
					result = key;
				else
					return null;
			}
			return result;
		}

		// TODO needs documentation
		public static normalizeStructure(value:any, structure:Structure):any
		{
			var nullable = false;
			while (MiscUtils.testSinglePropertyObject(structure) == 'nullable')
			{
				nullable = true;
				structure = (structure as StructureNullable).nullable;
			}
			
			if (Array.isArray(structure))
			{
				var a:any[] = (Array.isArray(value) ? value : null);
				if (!a && nullable)
					return null;
				return _.map(a, item => MiscUtils.normalizeStructure(item, (structure as StructureArray)[0]));
			}
			else if (typeof(structure) == "object" && structure)
			{
				if (!value && nullable)
					return null;
				
				var o:any = {};
				for (var key in structure as StructureObject)
				{
					o[key] = MiscUtils.normalizeStructure(value && value[key], (structure as StructureObject)[key]);
				}
				return o;
			}
			else if (typeof structure == "function")
			{
				return (structure as StructureFunction)(value);
			}
			else if (structure == "string")
			{
				return StandardLib.asString(value);
			}
			else if (structure == "number")
			{
				return StandardLib.asNumber(value);
			}
			else if (structure == "boolean")
			{
				return StandardLib.asBoolean(value);
			}
			return value === undefined ? null : value;
		}
		
		public static nullableStructure(structure:Structure):StructureNullable
		{
			return {nullable: structure};
		}
	}
}
