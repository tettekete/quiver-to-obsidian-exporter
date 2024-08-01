import fs from 'fs-extra'
import pathModule from 'path'

export function nonDuplicateMDPath( directory: string ,title: string ): string
{
	let dup_num: number = 0;
	function mdPathMaker( _dir: string ,_title: string ) : string
	{
		let _md_path: string = '';
		if( dup_num )
		{
			_md_path =  pathModule.join( _dir, `${_title}-dup${dup_num}.md`);
		}
		else
		{
			_md_path =  pathModule.join( _dir, `${_title}.md`);
		}
		
		dup_num ++;
		return _md_path;
	}

	let md_path = null;
	while( true )
	{
		md_path = mdPathMaker( directory , title );
		if( ! fs.pathExistsSync( md_path ) )
		{
			break;
		}
	}

	return md_path;
}

